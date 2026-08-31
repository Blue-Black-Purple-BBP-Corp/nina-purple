import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { QUESTION_KEYS } from '../../shared/onboardingState.ts';

// Versioned save of the compatibility profile. Called only on an explicit
// "Save updated compatibility profile" submission — NOT on every field edit or
// autosave draft (decision 4).
//
// Updates:
//   - MatchingAnswers (the 21 onboarding answers) + version metadata
//   - UserProfile derived tags (attachment + Big Five) + version metadata
//   - Creates a restricted CompatibilityRevision snapshot (owner-only read;
//     unavailable to other members, standard support, moderation, rewards,
//     and admins in Member mode)
//
// Does NOT erase profile, subscription, Founding Member entitlement, wallet,
// connection, message, event, or Experience data. Match/pricing recalculation
// is triggered separately by generateMatches where current logic supports it.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { answers, attachment, big5, edit_reason } = body;
    const now = new Date().toISOString();

    const [profiles, existingAnswers] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }),
      base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: user.id }),
    ]);
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Compute the new version (monotonic).
    const currentVersion = profile.compatibility_version || 1;
    const newVersion = currentVersion + 1;

    // Update the 21 onboarding answers.
    const answersUpdate = { ...(answers || {}) };
    const answeredCount = QUESTION_KEYS.filter((k) => answersUpdate[k]).length;
    answersUpdate.questions_answered = answeredCount;
    answersUpdate.compatibility_version = newVersion;
    answersUpdate.compatibility_updated_at = now;
    answersUpdate.compatibility_edit_status = 'saved';

    if (existingAnswers[0]) {
      await base44.asServiceRole.entities.MatchingAnswers.update(existingAnswers[0].id, answersUpdate);
    } else {
      await base44.asServiceRole.entities.MatchingAnswers.create({ user_id: user.id, ...answersUpdate });
    }

    // Update UserProfile derived tags + version metadata.
    const profileUpdate = {
      compatibility_version: newVersion,
      compatibility_updated_at: now,
      compatibility_edit_status: 'saved',
    };
    if (attachment) {
      profileUpdate.attachment_style = attachment.style;
      profileUpdate.attachment_anxiety = attachment.anxiety;
      profileUpdate.attachment_avoidance = attachment.avoidance;
    }
    if (big5) {
      profileUpdate.big5_openness = big5.openness;
      profileUpdate.big5_conscientiousness = big5.conscientiousness;
      profileUpdate.big5_extraversion = big5.extraversion;
      profileUpdate.big5_agreeableness = big5.agreeableness;
      profileUpdate.big5_neuroticism = big5.neuroticism;
    }
    if (answeredCount === 21) {
      profileUpdate.compatibility_last_completed_at = now;
    }
    await base44.asServiceRole.entities.UserProfile.update(profile.id, profileUpdate);

    // Create the restricted CompatibilityRevision snapshot (owner-only read).
    const revision_id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    await base44.asServiceRole.entities.CompatibilityRevision.create({
      revision_id,
      native_user_id: user.id,
      compatibility_version: newVersion,
      revised_at: now,
      source: 'member_edit',
      attachment_style: attachment?.style || profile.attachment_style,
      attachment_anxiety: attachment?.anxiety ?? profile.attachment_anxiety,
      attachment_avoidance: attachment?.avoidance ?? profile.attachment_avoidance,
      big5_openness: big5?.openness ?? profile.big5_openness,
      big5_conscientiousness: big5?.conscientiousness ?? profile.big5_conscientiousness,
      big5_extraversion: big5?.extraversion ?? profile.big5_extraversion,
      big5_agreeableness: big5?.agreeableness ?? profile.big5_agreeableness,
      big5_neuroticism: big5?.neuroticism ?? profile.big5_neuroticism,
      answers_snapshot: JSON.stringify(answers || {}),
      edit_reason: edit_reason || null,
    });

    return Response.json({
      success: true,
      compatibility_version: newVersion,
      compatibility_updated_at: now,
      questions_answered: answeredCount,
    });
  } catch (error) {
    console.error('[saveCompatibilityAnswers] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});