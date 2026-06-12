import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14';

const PRICE_MAP = {
  // Subscriptions (live)
  lunar:   'price_1ThadzJyNPXqDP7PjdEodCzY',
  stellar: 'price_1Thae3JyNPXqDP7PyHoUSP8x',
  galactic:'price_1Thae5JyNPXqDP7PXCLj24hR',
};

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);

    const { price_key, success_url, cancel_url, user_id } = await req.json();

    const priceId = PRICE_MAP[price_key];
    if (!priceId) {
      console.error('Invalid price_key:', price_key);
      return Response.json({ error: 'Invalid price key' }, { status: 400 });
    }

    const isSubscription = ['lunar', 'stellar', 'galactic'].includes(price_key);

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || 'https://your-app.base44.app/home?payment=success',
      cancel_url: cancel_url || 'https://your-app.base44.app/home?payment=cancelled',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user_id || '',
        price_key,
      },
    });

    console.info('Checkout session created:', session.id, 'for price_key:', price_key);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});