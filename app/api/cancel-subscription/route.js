import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const { subscriptionId, memberId } = await request.json();
  if (!subscriptionId) return Response.json({ error: 'No subscription ID provided' }, { status: 400 });

  try {
    await stripe.subscriptions.cancel(subscriptionId);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabase.from('members').update({ status: 'inactive', stripe_subscription_id: null }).eq('id', memberId);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
