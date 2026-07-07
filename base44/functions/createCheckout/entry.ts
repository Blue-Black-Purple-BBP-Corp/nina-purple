import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14';

const PRICE_MAP = {
  // Lunar
  lunar_1m:   'price_1ThadzJyNPXqDP7PjdEodCzY',  // $10/month recurring
  lunar_14d:  'price_1ThafYJyNPXqDP7PF2dar2xZ',   // $5
  lunar_3m:   'price_1ThafcJyNPXqDP7PhTApILWe',   // $27.50
  lunar_6m:   'price_1ThafeJyNPXqDP7PHPWBv7p4',   // $55
  lunar_1y:   'price_1ThafhJyNPXqDP7PepZOW4EJ',   // $110
  // Stellar
  stellar_14d:'price_1ThafmJyNPXqDP7P5zJeW8cV',   // $10
  stellar_1m: 'price_1Thae3JyNPXqDP7PyHoUSP8x',   // $15/month recurring
  stellar_3m: 'price_1ThafpJyNPXqDP7PpqGREGjI',   // $41.25
  stellar_6m: 'price_1ThafsJyNPXqDP7PiwZ9brVs',   // $82.50
  stellar_1y: 'price_1ThafvJyNPXqDP7PpbkUmOBQ',   // $165
  // Galactic
  galactic_7d: 'price_1ThafyJyNPXqDP7PChh0i70e',  // $7
  galactic_14d:'price_1Thag1JyNPXqDP7PBFMCP4a9',  // $14
  galactic_1m: 'price_1Thae5JyNPXqDP7PXCLj24hR',  // $20/month recurring
  galactic_3m: 'price_1Thag4JyNPXqDP7PkHPOIPQa',  // $55
  galactic_6m: 'price_1Thag7JyNPXqDP7PFJR0Ml55',  // $110
  galactic_1y: 'price_1Thag9JyNPXqDP7P12m7udNQ',  // $220
  galactic_life:'price_1ThagCJyNPXqDP7PIlBniKEg',  // $400
  // Wallet top-ups (one-time, USD)
  wallet_5:   'price_1ThakXJyNPXqDP7P47WbhGto',   // $5
  wallet_10:  'price_1ThakZJyNPXqDP7Pka3g4Hjx',   // $10
  wallet_25:  'price_1ThakcJyNPXqDP7PAEbkpudR',   // $25
  wallet_50:  'price_1ThakfJyNPXqDP7PS3HisLEp',   // $50
  wallet_100: 'price_1ThakiJyNPXqDP7PY4jAmmcD',   // $100
};

// Allowlisted origins for success/cancel URLs
const ALLOWED_ORIGINS = [
  'https://ninapurple.love',
  'https://www.ninapurple.love',
  'https://app.ninapurple.love',
];

function isAllowedUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.some(o => parsed.origin === o || parsed.origin.endsWith('.base44.app'));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);

    // BLOCKER 1 FIX: derive identity server-side — never trust client-supplied user_id
    const user = await base44.auth.me();
    if (!user) {
      console.warn('createCheckout: unauthenticated request rejected');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_key, success_url, cancel_url } = await req.json();

    const priceId = PRICE_MAP[price_key];
    if (!priceId) {
      console.error('Invalid price_key:', price_key);
      return Response.json({ error: 'Invalid price key' }, { status: 400 });
    }

    // Validate redirect URLs to prevent open-redirect attacks
    const safeSuccessUrl = isAllowedUrl(success_url) ? success_url : 'https://ninapurple.love/home?payment=success';
    const safeCancelUrl = isAllowedUrl(cancel_url) ? cancel_url : 'https://ninapurple.love/home?payment=cancelled';

    const isSubscription = ['lunar_1m', 'stellar_1m', 'galactic_1m'].includes(price_key);

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,  // set server-side — never from client body
        price_key,
      },
    });

    console.info('Checkout session created:', session.id, 'for price_key:', price_key, 'user:', user.id);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});