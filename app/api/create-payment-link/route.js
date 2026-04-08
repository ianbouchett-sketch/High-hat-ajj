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
  const { amount, memberId, memberName, memberEmail } = await request.json();
  if (!amount || !memberId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: member, error: fetchErr } = await supabase
    .from('members')
    .select('stripe_subscription_id, stripe_checkout_session, status')
    .eq('id', memberId)
    .single();

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });

  // Block if member already has an active subscription -- prevents double-charging
  if (member.stripe_subscription_id) {
    return Response.json({
      error: 'ACTIVE_SUBSCRIPTION',
      message: 'This member already has an active subscription. Use Update Rate to change their billing amount instead.',
      subscriptionId: member.stripe_subscription_id,
    }, { status: 409 });
  }

  // Expire any previous unused checkout session before creating a new one
  if (member.stripe_checkout_session) {
    try {
      await stripe.checkout.sessions.expire(member.stripe_checkout_session);
    } catch (e) {
      // Session may already be expired or completed -- ignore
      console.log('Could not expire previous session:', e.message);
    }
  }

  try {
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: { name: `High Hat BJJ - ${memberName || 'Member'} Membership` },
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      ...(memberEmail && { customer_email: memberEmail }),
      subscription_data: { metadata: { member_id: memberId } },
      metadata: { member_id: memberId },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      success_url: 'https://high-hat-ajj.vercel.app/portal?welcome=1',
      cancel_url: 'https://high-hat-ajj.vercel.app/portal',
    });

    await supabase
      .from('members')
      .update({
        stripe_checkout_session: session.id,
        monthly_rate: Math.round(amount * 100),
      })
      .eq('id', memberId);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
