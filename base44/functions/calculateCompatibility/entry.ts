import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { computeScore } from '../../shared/compatibilityScoring.ts';

// Scores compatibility between two users who share an unlocked Connection.
// SEGREGATION: refuses to score across experience modes (single vs couple) —
// couple profiles are never merged into the single-to-single scoring pipeline.

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { target_user_id } = await req.json();
  if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });

  // Authorization: an unlocked connection between the caller and the target must exist.
  const connections = await base44.entities.Connection.filter({
    $or: [
      { from_user_id: user.id, to_user_id: target_user_id },
      { from_user_id: target_user_id, to_user_id: user.id },
    ],
    is_unlocked: true,
  });
  if (!connections.length) {
    return Response.json({ error: 'No unlocked connection with this user' }, { status: 403 });
  }

  // Fetch both profiles to enforce mode segregation
  const [myProfilesArr, theirProfilesArr] = await Promise.all([
    base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }),
    base44.asServiceRole.entities.UserProfile.filter({ user_id: target_user_id },
  )]);
  const myProfile = myProfilesArr[0];
  const theirProfile = theirProfilesArr[0];

  // SEGREGATION: do not score across experience modes
  const myMode = myProfile?.profile_type || 'individual';
  const theirMode = theirProfile?.profile_type || 'individual';
  if (myMode !== theirMode) {
    return Response.json({ error: 'Cross-mode compatibility scoring is not supported' }, { status: 400 });
  }

  // Fetch both users' answers
  const [myAnswersArr, theirAnswersArr] = await Promise.all([
    base44.entities.MatchingAnswers.filter({ user_id: user.id }),
    base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: target_user_id }),
  ]);

  if (!myAnswersArr.length || !theirAnswersArr.length) {
    return Response.json({ error: 'One or both users have no matching answers' }, { status: 404 });
  }

  const myAnswers = myAnswersArr[0];
  const theirAnswers = theirAnswersArr[0];

  const { overall, categoryScores } = computeScore(myAnswers, theirAnswers);

  return Response.json({ compatibility: overall, categoryScores });
});