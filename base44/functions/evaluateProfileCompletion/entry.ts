import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { awardPoints } from '../../shared/bbpRules.ts';

// Evaluates whether the current member's profile and compatibility content
// are complete. If so, transitions onboarding_state to 'profile_complete' and
// issues the one-time PROFILE_COMPLETE award idempotently.
//
// "Profile Complete" = required UserProfile fields + MatchingAnswers (21 questions) complete.
// This is measured server-side — never trusts client-supplied completion flags.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch engagement profile
    const engagementProfiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
      native_user_id: user.id,
    });
    if (!engagementProfiles.length) {
      return Response.json({ error: 'Engagement profile not found' }, { status: 404 });
    }
    const engagement = engagementProfiles[0];

    // Fetch UserProfile and MatchingAnswers
    const [userProfiles, matchingAnswers] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id }),
    ]);
    const profile = userProfiles[0];
    const answers = matchingAnswers[0];

    // Server-side completion check
    const requiredFields = [
      profile?.display_name,
      profile?.city,
      profile?.birthdate,
      profile?.sexual_orientation,
      profile?.gender_pronoun,
      profile?.relationship_status,
      profile?.dating_archetype,
    ];
    const photosCount = (profile?.photos || []).length;
    const requiredPhotosOk = photosCount >= 3;

    // Check 21 questions answered
    const questionKeys = [
      'q11_core_values', 'q12_success', 'q13_conflict', 'q14_spirituality',
      'q15_personal_growth', 'q16_stress', 'q17_living_env', 'q18_family',
      'q19_work_life', 'q20_relationship_goal', 'q21_money', 'q22_gender_roles',
      'q23_leisure', 'q24_communication', 'q25_intellectual', 'q26_boundaries',
      'q27_change', 'q28_diversity', 'q29_activism', 'q30_emotional_intimacy',
      'q31_partner_growth',
    ];
    const answeredCount = questionKeys.filter(k => answers?.[k]).length;
    const allQuestionsAnswered = answeredCount === 21;

    const isComplete = requiredFields.every(f => f) && requiredPhotosOk && allQuestionsAnswered;

    if (!isComplete) {
      return Response.json({
        success: true,
        profile_complete: false,
        missing: {
          required_fields: requiredFields.filter(f => !f).length,
          photos: Math.max(0, 3 - photosCount),
          questions: 21 - answeredCount,
        },
      });
    }

    // Transition to profile_complete if not already
    const now = new Date().toISOString();
    if (engagement.onboarding_state === 'getting_started') {
      await base44.asServiceRole.entities.MemberEngagementProfile.update(engagement.id, {
        onboarding_state: 'profile_complete',
        community_standing_state: engagement.community_standing_state === 'getting_started' ? 'profile_complete' : engagement.community_standing_state,
        profile_complete_at: engagement.profile_complete_at || now,
      });
    }

    // Issue one-time PROFILE_COMPLETE award (idempotent)
    const awardResult = await awardPoints(
      base44,
      engagement.bbp_member_id,
      user.id,
      'profile_complete',
      'profile_complete',
      `profile_${user.id}` // source_event_id — one-time per user
    );

    return Response.json({
      success: true,
      profile_complete: true,
      award: awardResult,
    });
  } catch (error) {
    console.error('evaluateProfileCompletion error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});