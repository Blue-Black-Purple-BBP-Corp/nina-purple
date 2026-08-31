// Exposes non-secret public configuration to the browser.
// Only returns a boolean indicating whether Google Places is configured — the
// API key itself is never exposed. All Places requests go through the
// server-side placesAutocomplete function, which holds the key.
Deno.serve(async () => {
  const googleMapsEnabled = !!Deno.env.get('GOOGLE_PLACES_API_KEY');
  return Response.json({ googleMapsEnabled });
});