import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Handle checkout session completed -- this fires when a member
  // successfully enters their card and starts their subscription
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const memberId = session.metadata?.member_id;

    if (memberId && session.customer && session.subscription) {
      // Store their Stripe Customer ID and Subscription ID
      // and mark them active immediately
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);

      await supabase.from('members').update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
        last_payment: new Date().toISOString().split('T')[0],
        next_payment_date: nextDate.toISOString().split('T')[0],
      }).eq('id', memberId);

      console.log(`Checkout complete for member ${memberId} -- now active`);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // For all other events, find member by Stripe Customer ID
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
  await supabase.from('payment_events').insert({
    member_id: member.id,
    stripe_event_id: event.id,
    event_type: event.type,
    amount_cents: event.data.object.amount_paid || event.data.object.amount_due || null,
    currency: event.data.object.currency || 'usd',
    status: event.type === 'invoice.paid' ? 'paid' : event.type === 'invoice.payment_failed' ? 'failed' : event.type,
    raw_payload: event,
  });

  switch (event.type) {

    case 'invoice.paid': {
      const invoice = event.data.object;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      const nextDate = periodEnd
        ? new Date(periodEnd * 1000).toISOString().split('T')[0]
        : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })();

      await supabase.from('members').update({
        status: 'active',
        last_payment: new Date().toISOString().split('T')[0],
        next_payment_date: nextDate,
      }).eq('id', member.id);

      console.log(`Payment succeeded for ${member.name}`);
      break;
    }

    case 'invoice.payment_failed': {
      await supabase.from('members').update({ status: 'overdue' }).eq('id', member.id);
      console.log(`Payment FAILED for ${member.name}`);
      break;
    }

    case 'customer.subscription.deleted': {
      await supabase.from('members').update({
        status: 'inactive',
        stripe_subscription_id: null,
      }).eq('id', member.id);
      console.log(`Subscription cancelled for ${member.name}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const statusMap = { active: 'active', past_due: 'overdue', canceled: 'inactive' };
      const newStatus = statusMap[sub.status];
      if (newStatus) {
        await supabase.from('members').update({ status: newStatus }).eq('id', member.id);
      }
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
