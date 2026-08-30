import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { evaluateOnboardingCompletion, coarseFromGranular } from '../../shared/onboardingState.ts';

// Single source of truth for onboarding completion status.
// Called by route guards (AppLayout, Onboarding, Register, Login).
// Returns { authenticated, onboarding_status, onboarding_step, onboarding_current_step, age_confirmation_status }.
//
// If onboarding_status says "complete", validates server-side that all required
// fields, 3 photos (from the Photo entity), and 21 answers are present. If any
// are missing, reports "in_progress" instead (never silently trusts a stale flag).
// "awaiting_membership" = profile + compatibility complete but membership pending;
// route guards restore the member to the membership step, never the age step.
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
      return Response.json({
        authenticated: true,
        onboarding_status: 'not_started',
        onboarding_step: null,
        onboarding_current_step: null,
        age_confirmation_status: null,
      });
    }

    const ageConfirmed = profile.age_confirmation_status === 'confirmed';

    if (profile.onboarding_status === 'complete') {
      const answers = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id });
      const completion = await evaluateOnboardingCompletion(base44, user.id, profile, answers[0]);
      if (!completion.isComplete) {
        console.warn(`getOnboardingStatus: profile ${profile.id} marked complete but missing required data`);
        return Response.json({
          authenticated: true,
          onboarding_status: 'in_progress',
          onboarding_step: profile.onboarding_step || null,
          onboarding_current_step: coarseFromGranular(profile.onboarding_step) || 'profile_basics',
          age_confirmation_status: profile.age_confirmation_status || null,
        });
      }
      return Response.json({
        authenticated: true,
        onboarding_status: 'complete',
        onboarding_step: null,
        onboarding_current_step: 'completion',
        age_confirmation_status: profile.age_confirmation_status || null,
      });
    }

    // awaiting_membership / in_progress / not_started
    const coarse = coarseFromGranular(profile.onboarding_step)
      || (ageConfirmed ? 'profile_basics' : 'age_eligibility');

    return Response.json({
      authenticated: true,
      onboarding_status: profile.onboarding_status || 'not_started',
      onboarding_step: profile.onboarding_step || null,
      onboarding_current_step: coarse,
      age_confirmation_status: profile.age_confirmation_status || null,
    });
  } catch (error) {
    console.error('getOnboardingStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});