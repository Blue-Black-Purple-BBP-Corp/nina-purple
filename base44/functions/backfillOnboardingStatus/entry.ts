import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { evaluateOnboardingCompletion, hasMembership, coarseFromGranular } from '../../shared/onboardingState.ts';

// Idempotent migration: for existing members who lack an onboarding_status field,
// computes completion from their stored data and sets the field.
// - Members with all required fields + 3 photos + 21 answers → "complete"
// - Members with some data but not all → "in_progress"
// - Members with no data → "not_started" (left as default)
// Never downgrades a member who is already "complete" or "in_progress".
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Admin only
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const questionKeys = [
      'q11_core_values', 'q12_success', 'q13_conflict', 'q14_spirituality',
      'q15_personal_growth', 'q16_stress', 'q17_living_env', 'q18_family',
      'q19_work_life', 'q20_relationship_goal', 'q21_money', 'q22_gender_roles',
      'q23_leisure', 'q24_communication', 'q25_intellectual', 'q26_boundaries',
      'q27_change', 'q28_diversity', 'q29_activism', 'q30_emotional_intimacy',
      'q31_partner_growth',
    ];

    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 500);

    let backfilledComplete = 0;
    let backfilledAwaiting = 0;
    let backfilledInProgress = 0;
    let alreadyComplete = 0;
    let alreadyInProgress = 0;
    let notStarted = 0;
    let errors = 0;

    for (const profile of allProfiles) {
      try {
        // Skip members already marked complete — never downgrade them.
        if (profile.onboarding_status === 'complete') {
          alreadyComplete++;
          continue;
        }

        // Compute completion from data (reads photos from the Photo entity).
        const answers = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: profile.user_id });
        const completion = await evaluateOnboardingCompletion(base44, profile.user_id, profile, answers[0]);

        if (completion.isComplete) {
          // Profile + compatibility complete. If no membership yet → awaiting_membership;
          // else complete.
          if (hasMembership(profile)) {
            await base44.asServiceRole.entities.UserProfile.update(profile.id, {
              onboarding_status: 'complete',
              onboarding_complete: true,
              onboarding_completed_at: new Date().toISOString(),
              onboarding_version: '1.0',
              onboarding_current_step: 'completion',
              onboarding_step: null,
            });
            backfilledComplete++;
          } else {
            await base44.asServiceRole.entities.UserProfile.update(profile.id, {
              onboarding_status: 'awaiting_membership',
              onboarding_complete: true,
              onboarding_current_step: 'membership',
              onboarding_step: 'subscription',
            });
            backfilledAwaiting++;
          }
        } else if (completion.fieldsOk || completion.photosOk || completion.questionsOk) {
          // Has some data but not fully complete → in_progress at the latest valid step.
          const coarse = coarseFromGranular(profile.onboarding_step) || 'profile_basics';
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            onboarding_status: 'in_progress',
            onboarding_complete: false,
            onboarding_current_step: coarse,
          });
          backfilledInProgress++;
        } else {
          notStarted++;
        }
      } catch (e) {
        console.error(`Backfill failed for profile ${profile.id}:`, e.message);
        errors++;
      }
    }

    return Response.json({
      success: true,
      summary: {
        total: allProfiles.length,
        backfilled_complete: backfilledComplete,
        backfilled_awaiting_membership: backfilledAwaiting,
        backfilled_in_progress: backfilledInProgress,
        already_complete: alreadyComplete,
        already_in_progress: alreadyInProgress,
        not_started: notStarted,
        errors,
      },
    });
  } catch (error) {
    console.error('backfillOnboardingStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});