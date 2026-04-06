import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function updateMemberAndDependents(supabase, memberId, updates) {
  // Update the primary member
  await supabase.from('members').update(updates).eq('id', memberId);
  // Update all dependents linked to this member
  await supabase.from('members').update(updates).eq('primary_member_id', memberId);
}

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Checkout completed -- member paid for first time
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const memberId = session.metadata?.member_id;
    if (memberId && session.customer && session.subscription) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);
      const updates = {
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
        last_payment: new Date().toISOString().split('T')[0],
        next_payment_date: nextDate.toISOString().split('T')[0],
      };
      await updateMemberAndDependents(supabase, memberId, {
        status: 'active',
        last_payment: updates.last_payment,
        next_payment_date: updates.next_payment_date,
      });
      // Only set stripe fields on the primary
      await supabase.from('members').update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      }).eq('id', memberId);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // All other events -- find member by Stripe customer ID
  const stripeCustomerId = event.data.object.customer;
  if (!stripeCustomerId) {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const { data: member } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (!member) {
    console.warn('No member found for Stripe customer:', stripeCustomerId);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // Log to payment_events
  try {
    await supabase.from('payment_events').insert({
      member_id: member.id,
      stripe_event_id: event.id,
      event_type: event.type,
      amount_cents: event.data.object.amount_paid || event.data.object.amount_due || null,
      currency: event.data.object.currency || 'usd',
      status: event.type === 'invoice.paid' ? 'paid' : event.type === 'invoice.payment_failed' ? 'failed' : event.type,
      raw_payload: event,
    });
  } catch(e) { console.error('payment_events insert failed:', e); }

  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      const nextDate = periodEnd
        ? new Date(periodEnd * 1000).toISOString().split('T')[0]
        : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })();
      await updateMemberAndDependents(supabase, member.id, {
        status: 'active',
        last_payment: new Date().toISOString().split('T')[0],
        next_payment_date: nextDate,
      });
      break;
    }
    case 'invoice.payment_failed': {
      await updateMemberAndDependents(supabase, member.id, { status: 'overdue' });
      break;
    }
    case 'customer.subscription.deleted': {
      await updateMemberAndDependents(supabase, member.id, { status: 'inactive' });
      await supabase.from('members').update({ stripe_subscription_id: null }).eq('id', member.id);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const statusMap = { active: 'active', past_due: 'overdue', canceled: 'inactive' };
      const newStatus = statusMap[sub.status];
      if (newStatus) await updateMemberAndDependents(supabase, member.id, { status: newStatus });
      break;
    }
    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
