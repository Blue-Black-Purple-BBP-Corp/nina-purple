// Returns public, referrer-restricted client config (safe to expose to the
// browser). The Google Maps key is restricted by HTTP referrer to the app's
// domain, so exposing it client-side is the intended Google Maps pattern.
Deno.serve(async (req) => {
  const googleMapsApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || '';
  return Response.json({ googleMapsApiKey });
});