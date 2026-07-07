import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// ── Simple in-memory per-IP rate limiting (best-effort; protects the billable
// Google Places key from abuse). Deno Deploy isolates are stateless across
// instances, so this is a first layer, not a hard cap. ──
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30;           // 30 autocomplete calls per minute per IP
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
  // Rate limit before touching the billable API
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    console.warn('[placesAutocomplete] Rate limit exceeded for IP:', ip);
    return Response.json({ error: 'Too many requests. Please slow down.', predictions: [] }, { status: 429 });
  }

  // No auth required — called during onboarding before login
  const { input } = await req.json();
  if (!input || input.length < 2) return Response.json({ predictions: [] });

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    console.error('[placesAutocomplete] Missing GOOGLE_PLACES_API_KEY');
    return Response.json({ error: 'API key not configured', predictions: [] });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[placesAutocomplete] Google API error:', data.status, data.error_message || 'no message');
      const fallbackUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();

      if (fallbackData.status === 'OK') {
        const predictions = (fallbackData.predictions || []).map(p => ({
          place_id: p.place_id,
          description: p.description,
        }));
        return Response.json({ predictions });
      }

      return Response.json({
        error: `Google API error: ${data.status}`,
        predictions: []
      });
    }

    const predictions = (data.predictions || []).map(p => ({
      place_id: p.place_id,
      description: p.description,
    }));

    return Response.json({ predictions });
  } catch (err) {
    console.error('[placesAutocomplete] Fetch error:', err.message);
    return Response.json({ error: err.message, predictions: [] });
  }
});