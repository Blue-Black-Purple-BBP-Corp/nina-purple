import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Single source of truth for onboarding completion status.
// Called by route guards (AppLayout, Onboarding, Register, Login).
// Returns { authenticated, onboarding_status, onboarding_step }.
//
// If onboarding_status field says "complete", validates server-side that all
// required fields, 3 photos, and 21 answers are actually present. If any are
// missing, reports "in_progress" instead (never silently trusts a stale flag).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ authenticated: false, onboarding_status: 'not_started' });
    }
    if (!user) {
      return Response.json({ authenticated: false, onboarding_status: 'not_started' });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ authenticated: true, onboarding_status: 'not_started', onboarding_step: null });
    }

    // If onboarding_status says complete, validate server-side
    if (profile.onboarding_status === 'complete') {
      const requiredFields = [
        !!profile.display_name,
        !!profile.city,
        !!profile.birthdate,
        !!profile.sexual_orientation,
        !!profile.gender_pronoun,
        !!profile.relationship_status,
        !!profile.dating_archetype,
      ];
      const photosOk = (profile.photos || []).length >= 3;
      const fieldsOk = requiredFields.every(f => f);

      if (!fieldsOk || !photosOk) {
        // Field says complete but data is missing — report as in_progress
        console.warn(`getOnboardingStatus: profile ${profile.id} marked complete but missing required data`);
        return Response.json({
          authenticated: true,
          onboarding_status: 'in_progress',
          onboarding_step: profile.onboarding_step || null,
        });
      }

      // Also check 21 questions
      const answers = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id });
      const questionKeys = [
        'q11_core_values', 'q12_success', 'q13_conflict', 'q14_spirituality',
        'q15_personal_growth', 'q16_stress', 'q17_living_env', 'q18_family',
        'q19_work_life', 'q20_relationship_goal', 'q21_money', 'q22_gender_roles',
        'q23_leisure', 'q24_communication', 'q25_intellectual', 'q26_boundaries',
        'q27_change', 'q28_diversity', 'q29_activism', 'q30_emotional_intimacy',
        'q31_partner_growth',
      ];
      const answeredCount = questionKeys.filter(k => answers[0]?.[k]).length;
      if (answeredCount < 21) {
        console.warn(`getOnboardingStatus: profile ${profile.id} marked complete but only ${answeredCount}/21 questions answered`);
        return Response.json({
          authenticated: true,
          onboarding_status: 'in_progress',
          onboarding_step: profile.onboarding_step || null,
        });
      }

      return Response.json({ authenticated: true, onboarding_status: 'complete', onboarding_step: null });
    }

    // Return the stored status (not_started or in_progress)
    return Response.json({
      authenticated: true,
      onboarding_status: profile.onboarding_status || 'not_started',
      onboarding_step: profile.onboarding_step || null,
    });
  } catch (error) {
    console.error('getOnboardingStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});