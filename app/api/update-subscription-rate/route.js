import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const { memberId, newAmount } = await request.json();
  if (!memberId || !newAmount) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: member, error: fetchErr } = await supabase
    .from('members')
    .select('stripe_subscription_id, name')
    .eq('id', memberId)
    .single();

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });
  if (!member.stripe_subscription_id) {
    return Response.json({ error: 'No active subscription found for this member.' }, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(member.stripe_subscription_id);
    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return Response.json({ error: 'Could not find subscription item.' }, { status: 500 });
    }

    const newPrice = await stripe.prices.create({
      unit_amount: Math.round(newAmount * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: { name: `High Hat BJJ - ${member.name || 'Member'} Membership` },
    });

    await stripe.subscriptionItems.update(subscriptionItemId, {
      price: newPrice.id,
      proration_behavior: 'none',
    });

    await supabase
      .from('members')
      .update({ monthly_rate: Math.round(newAmount * 100) })
      .eq('id', memberId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Stripe rate update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
