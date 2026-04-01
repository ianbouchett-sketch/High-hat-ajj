import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const { amount, memberId, memberName, memberEmail } = await request.json();

  if (!amount || amount < 1) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 });
  }

  try {
    // Create a Stripe Payment Link for this specific amount
    const product = await stripe.products.create({
      name: `High Hat BJJ Monthly Membership`,
      metadata: { member_id: memberId, member_name: memberName },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // convert dollars to cents
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { member_id: memberId },
      // Pre-fill email if provided
      ...(memberEmail && {
        customer_creation: 'always',
        invoice_creation: { enabled: true },
      }),
      after_completion: {
        type: 'redirect',
        redirect: { url: 'https://high-hat-ajj.vercel.app/portal' },
      },
    });

    return Response.json({ url: paymentLink.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
