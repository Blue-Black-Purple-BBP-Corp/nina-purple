// Exposes non-secret public configuration to the browser.
// The Google Maps API key is HTTP-referrer-restricted (not server-IP-restricted),
// so it is safe to expose client-side — it only works from authorized domains.
Deno.serve(async () => {
  const googleMapsApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || null;
  return Response.json({ googleMapsApiKey });
});