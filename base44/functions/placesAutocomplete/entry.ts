import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  // No auth required — called during onboarding before login
  const { input } = await req.json();
  if (!input || input.length < 2) return Response.json({ predictions: [] });

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) return Response.json({ predictions: [] });

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  const predictions = (data.predictions || []).map(p => ({
    place_id: p.place_id,
    description: p.description,
  }));

  return Response.json({ predictions });
});