import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import Stripe from 'npm:stripe@14';

// Price IDs — read from env (per-environment: test vs live) with hardcoded
// live-mode fallbacks so the function keeps working if env vars are absent.
const priceFromEnv = (key, fallback) => Deno.env.get(`STRIPE_PRICE_${key.toUpperCase()}`) || fallback;

const PRICE_MAP = {
  // Lunar
  lunar_1m:    priceFromEnv('lunar_1m',    'price_1ThadzJyNPXqDP7PjdEodCzY'),
  lunar_14d:   priceFromEnv('lunar_14d',   'price_1ThafYJyNPXqDP7PF2dar2xZ'),
  lunar_3m:    priceFromEnv('lunar_3m',     'price_1ThafcJyNPXqDP7PhTApILWe'),
  lunar_6m:    priceFromEnv('lunar_6m',    'price_1ThafeJyNPXqDP7PHPWBv7p4'),
  lunar_1y:    priceFromEnv('lunar_1y',    'price_1ThafhJyNPXqDP7PepZOW4EJ'),
  // Stellar
  stellar_14d: priceFromEnv('stellar_14d', 'price_1ThafmJyNPXqDP7P5zJeW8cV'),
  stellar_1m:  priceFromEnv('stellar_1m',  'price_1Thae3JyNPXqDP7PyHoUSP8x'),
  stellar_3m:  priceFromEnv('stellar_3m',  'price_1ThafpJyNPXqDP7PpqGREGjI'),
  stellar_6m:  priceFromEnv('stellar_6m',  'price_1ThafsJyNPXqDP7PiwZ9brVs'),
  stellar_1y:  priceFromEnv('stellar_1y',  'price_1ThafvJyNPXqDP7PpbkUmOBQ'),
  // Galactic
  galactic_7d:  priceFromEnv('galactic_7d',  'price_1ThafyJyNPXqDP7PChh0i70e'),
  galactic_14d: priceFromEnv('galactic_14d', 'price_1Thag1JyNPXqDP7PBFMCP4a9'),
  galactic_1m:  priceFromEnv('galactic_1m',  'price_1Thae5JyNPXqDP7PXCLj24hR'),
  galactic_3m:  priceFromEnv('galactic_3m',  'price_1Thag4JyNPXqDP7PkHPOIPQa'),
  galactic_6m:  priceFromEnv('galactic_6m',  'price_1Thag7JyNPXqDP7PFJR0Ml55'),
  galactic_1y:  priceFromEnv('galactic_1y',  'price_1Thag9JyNPXqDP7P12m7udNQ'),
  galactic_life:priceFromEnv('galactic_life','price_1ThagCJyNPXqDP7PIlBniKEg'),
  // Wallet top-ups (one-time, USD)
  wallet_5:    priceFromEnv('wallet_5',    'price_1ThakXJyNPXqDP7P47WbhGto'),
  wallet_10:   priceFromEnv('wallet_10',   'price_1ThakZJyNPXqDP7Pka3g4Hjx'),
  wallet_25:   priceFromEnv('wallet_25',   'price_1ThakcJyNPXqDP7PAEbkpudR'),
  wallet_50:   priceFromEnv('wallet_50',   'price_1ThakfJyNPXqDP7PS3HisLEp'),
  wallet_100:  priceFromEnv('wallet_100',  'price_1ThakiJyNPXqDP7PY4jAmmcD'),
  // Lunar Couple
  lunar_couple_14d:  priceFromEnv('lunar_couple_14d',  'price_1Tqk98JyNPXqDP7P1NEhdTRa'),
  lunar_couple_1m:   priceFromEnv('lunar_couple_1m',   'price_1Tqk98JyNPXqDP7PO2nee2Ik'),
  lunar_couple_3m:   priceFromEnv('lunar_couple_3m',   'price_1Tqk98JyNPXqDP7PBHvEhPSL'),
  lunar_couple_6m:   priceFromEnv('lunar_couple_6m',   'price_1Tqk98JyNPXqDP7P0j97yIAq'),
  lunar_couple_1y:   priceFromEnv('lunar_couple_1y',   'price_1Tqk98JyNPXqDP7PAzK2D5NT'),
  // Stellar Couple
  stellar_couple_14d: priceFromEnv('stellar_couple_14d', 'price_1Tqk98JyNPXqDP7Ppuop1UNk'),
  stellar_couple_1m:  priceFromEnv('stellar_couple_1m',  'price_1Tqk98JyNPXqDP7PX7VTKF6N'),
  stellar_couple_3m:  priceFromEnv('stellar_couple_3m',  'price_1Tqk98JyNPXqDP7Po8nvxFMq'),
  stellar_couple_6m:  priceFromEnv('stellar_couple_6m',  'price_1Tqk98JyNPXqDP7PQbOrMzm2'),
  stellar_couple_1y:  priceFromEnv('stellar_couple_1y',  'price_1Tqk98JyNPXqDP7PWt5oepyw'),
  // Galactic Couple
  galactic_couple_7d:   priceFromEnv('galactic_couple_7d',   'price_1Tqk98JyNPXqDP7PUOP1yMpg'),
  galactic_couple_14d:  priceFromEnv('galactic_couple_14d',  'price_1Tqk98JyNPXqDP7PpR28pAMS'),
  galactic_couple_1m:   priceFromEnv('galactic_couple_1m',   'price_1Tqk98JyNPXqDP7PYpNGZ8TR'),
  galactic_couple_3m:   priceFromEnv('galactic_couple_3m',   'price_1Tqk98JyNPXqDP7PQneDtxjF'),
  galactic_couple_6m:   priceFromEnv('galactic_couple_6m',   'price_1Tqk98JyNPXqDP7PdSajOD9Y'),
  galactic_couple_1y:   priceFromEnv('galactic_couple_1y',   'price_1Tqk98JyNPXqDP7PCdOkpHgH'),
  galactic_couple_life: priceFromEnv('galactic_couple_life', 'price_1Tqk98JyNPXqDP7PTXIgt1cE'),
  // Therapy Add-On (weekly recurring — available to all members)
  therapy_weekly:  priceFromEnv('therapy_weekly', 'price_1Tqk98JyNPXqDP7PeNHVSmmW'),
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
    // Exact origin match only — no wildcard subdomain matching to prevent attacker-controlled preview apps
    return ALLOWED_ORIGINS.includes(parsed.origin);
  } catch {
    return false;
  }
}

// ── Simple in-memory per-IP rate limiting (best-effort; Deno Deploy isolates
// are stateless across instances, so this is a first layer, not a hard cap). ──
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;           // 10 checkout requests per minute per IP
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function getClientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

Deno.serve(async (req) => {
  try {
    // Rate limit
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      console.warn('[createCheckout] Rate limit exceeded for IP:', ip);
      return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);

    // Derive identity server-side — never trust client-supplied user_id
    const user = await base44.auth.me();
    if (!user) {
      console.warn('[createCheckout] Unauthenticated request rejected');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { price_key, success_url, cancel_url } = await req.json();

    const priceId = PRICE_MAP[price_key];
    if (!priceId) {
      console.error('[createCheckout] Invalid price_key:', price_key);
      return Response.json({ error: 'Invalid price key' }, { status: 400 });
    }

    const safeSuccessUrl = isAllowedUrl(success_url) ? success_url : 'https://ninapurple.love/home?payment=success';
    const safeCancelUrl = isAllowedUrl(cancel_url) ? cancel_url : 'https://ninapurple.love/home?payment=cancelled';

    const isSubscription = ['lunar_1m', 'stellar_1m', 'galactic_1m', 'lunar_couple_1m', 'stellar_couple_1m', 'galactic_couple_1m', 'therapy_weekly'].includes(price_key);

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        price_key,
      },
    });

    console.info('[createCheckout] Session created:', session.id, 'price_key:', price_key, 'user:', user.id, 'ip:', ip);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('[createCheckout] Error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});