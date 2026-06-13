import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
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
      // Try fallback without types filter
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