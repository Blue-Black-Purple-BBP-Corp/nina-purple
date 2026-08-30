import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { coarseFromGranular } from '../../shared/onboardingState.ts';

// Lightweight onboarding-state persistence for early onboarding steps (age,
// guidelines, segmentation) where the member has no display_name yet and so
// cannot call createProfile (which requires display_name). Persists only the
// onboarding-state fields so refresh/back/logout-login restores the correct
// step and age confirmation is never repeated.
//
// Upserts the UserProfile: creates a minimal placeholder profile if none
// exists (display_name derived from auth identity; overwritten later by the
// profile step), or updates the onboarding fields on an existing profile.

const ALLOWED = new Set([
  'onboarding_status',
  'onboarding_step',
  'onboarding_current_step',
  'age_confirmation_status',
  'age_confirmed_at',
  'membership_selection_status',
  'membership_subscription_reference',
  'onboarding_started_at',
  'last_saved_at',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const update = { last_saved_at: now };

    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) update[k] = v;
    }
    // Derive coarse step from granular step when not explicitly provided.
    if (body.onboarding_step && !body.onboarding_current_step) {
      const coarse = coarseFromGranular(body.onboarding_step);
      if (coarse) update.onboarding_current_step = coarse;
    }
    if (body.onboarding_status === 'in_progress' && !body.onboarding_started_at) {
      update.onboarding_started_at = now;
    }

    const existing = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (existing.length) {
      await base44.asServiceRole.entities.UserProfile.update(existing[0].id, update);
    } else {
      const placeholderName = user.full_name || (user.email ? user.email.split('@')[0] : 'Member');
      await base44.asServiceRole.entities.UserProfile.create({
        user_id: user.id,
        subscription_tier: 'solar',
        credit_balance: 0,
        display_name: placeholderName,
        ...update,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[saveOnboardingStep] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});