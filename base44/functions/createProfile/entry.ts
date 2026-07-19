import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Creates a UserProfile for the authenticated caller.
// Billing fields (subscription_tier, credit_balance) are forced server-side —
// the client cannot grant itself a paid tier or credits at signup.
const ALLOWED_FIELDS = new Set([
  'display_name', 'birthdate', 'city', 'country', 'phone',
  'sexual_orientation', 'gender_pronoun', 'relationship_status',
  'dating_archetype', 'bio', 'photos', 'photos_private',
  'show_in_listings', 'allow_messages_all', 'profile_completeness',
  'language', 'onboarding_complete', 'age_verified', 'guidelines_accepted',
  'profile_type', 'paired_status', 'partner_email',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Build profile data: user_id derived server-side, billing fields forced
    const profileData = { user_id: user.id, subscription_tier: 'solar', credit_balance: 0 };
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) profileData[key] = value;
    }

    if (!profileData.display_name) {
      return Response.json({ error: 'display_name is required' }, { status: 400 });
    }

    // Prevent duplicate profile creation
    const existing = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (existing.length > 0) {
      return Response.json({ error: 'Profile already exists' }, { status: 409 });
    }

    const created = await base44.asServiceRole.entities.UserProfile.create(profileData);
    return Response.json({ success: true, profile: created });
  } catch (error) {
    console.error('createProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});