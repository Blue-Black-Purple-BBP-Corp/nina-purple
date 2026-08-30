import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Updates the authenticated caller's own profile, restricted to an allowlist of fields.
// Billing/trust fields (subscription_tier, credit_balance, bbp_rewards,
// consecutive_no_match_months, last_bbp_conversion_date, is_verified) are
// intentionally excluded — only Stripe webhooks and admin functions set those.
// Photos are managed via the Photo entity (uploadPhoto/managePhotos) — they
// are excluded here so the legacy UserProfile.photos[] array cannot be used
// to bypass private storage. photos_private is retired (paid-reveal is a
// server-side invariant).
const ALLOWED_FIELDS = new Set([
  // full_name, birthdate, phone are request-only (ProfileChangeRequest) —
  // they require step-up auth + staff review and are never direct-edited here.
  'display_name', 'city', 'country',
  'sexual_orientation', 'gender_pronoun', 'relationship_status',
  'dating_archetype', 'bio',
  'show_in_listings', 'allow_messages_all', 'profile_completeness',
  'couple_consent_given', 'language',
  'attachment_style', 'attachment_anxiety', 'attachment_avoidance',
  'big5_openness', 'big5_conscientiousness', 'big5_extraversion',
  'big5_agreeableness', 'big5_neuroticism',
  'last_profile_review_date', 'reviewed_fields',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Filter to allowlisted fields only — silently drop anything else
    const update = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) update[key] = value;
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ success: true, updated: false });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (!profiles.length) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, update);
    return Response.json({ success: true, updated: true });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});