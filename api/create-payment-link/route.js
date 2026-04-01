import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const { amount, memberId, memberName, memberEmail } = await request.json();

  if (!amount || isNaN(amount) || +amount < 1) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 });
  }

  try {
    // Create a Stripe product for this member's membership
    const product = await stripe.products.create({
      name: `High Hat BJJ Monthly Membership`,
      metadata: { member_id: memberId, member_name: memberName },
    });

    // Create a recurring price at the specified amount
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(+amount * 100), // dollars to cents
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    // Create a Checkout Session for a subscription
    // This gives the member a hosted payment page to enter their card
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      // Pre-fill their email if we have it
      ...(memberEmail && { customer_email: memberEmail }),
      // Store member ID so webhook can find them
      subscription_data: {
        metadata: { member_id: memberId },
      },
      metadata: { member_id: memberId },
      success_url: 'https://high-hat-ajj.vercel.app/portal?welcome=1',
      cancel_url: 'https://high-hat-ajj.vercel.app/portal',
    });

    // Store the session ID in Supabase so we can track it
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabase
      .from('members')
      .update({ stripe_checkout_session: session.id })
      .eq('id', memberId);

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
