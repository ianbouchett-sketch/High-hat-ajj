import Stripe from 'stripe';
import { getServiceSupabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text(); // raw body needed for signature verification
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const stripeCustomerId = event.data.object.customer;

  // Find the member by their Stripe customer ID
  const { data: member, error } = await supabase
    .from('members')
    .select('id, name, email')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error || !member) {
    console.warn('No member found for Stripe customer:', stripeCustomerId);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // Log every event to the payment_events audit table
  await supabase.from('payment_events').insert({
    member_id: member.id,
    stripe_event_id: event.id,
    event_type: event.type,
    amount_cents: event.data.object.amount_paid || event.data.object.amount_due || null,
    currency: event.data.object.currency || 'usd',
    status: deriveStatus(event.type),
    raw_payload: event,
  });

  switch (event.type) {

    case 'invoice.paid': {
      const invoice = event.data.object;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      const nextDate = periodEnd
        ? new Date(periodEnd * 1000).toISOString().split('T')[0]
        : getNextMonthDate();

      await supabase
        .from('members')
        .update({ status: 'active', next_payment_date: nextDate })
        .eq('id', member.id);

      console.log(`Payment succeeded for ${member.name}. Next due: ${nextDate}`);
      break;
    }

    case 'invoice.payment_failed': {
      await supabase
        .from('members')
        .update({ status: 'overdue' })
        .eq('id', member.id);
      console.log(`Payment FAILED for ${member.name}`);
      break;
    }

    case 'customer.subscription.deleted': {
      await supabase
        .from('members')
        .update({ status: 'inactive', stripe_subscription_id: null })
        .eq('id', member.id);
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

function deriveStatus(type) {
  if (type === 'invoice.paid') return 'paid';
  if (type === 'invoice.payment_failed') return 'failed';
  if (type === 'customer.subscription.deleted') return 'cancelled';
  return type;
}

function getNextMonthDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}
