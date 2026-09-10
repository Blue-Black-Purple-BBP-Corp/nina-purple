import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Public endpoint — no auth required. Called during onboarding (before login
// is guaranteed) and from the profile editor. Returns cities where
// is_actively_onboarding === true, sorted by display_order. The list is
// informational only (suggestions); free-text entry is always allowed
// client-side, and no feature is ever gated on this flag.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cities = await base44.asServiceRole.entities.ActiveCity.filter(
      { is_actively_onboarding: true },
      'display_order',
      500
    );
    return Response.json({
      cities: cities.map(c => ({
        id: c.id,
        city: c.city,
        region: c.region || '',
        country: c.country || '',
        display_order: c.display_order || 0,
      })),
    });
  } catch (err) {
    console.error('[getActiveCities] Error:', err.message);
    // Return empty list on error so the frontend falls back to free-text only
    return Response.json({ cities: [] });
  }
});