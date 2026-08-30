import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { computeScoreFromStored } from '../../shared/compatibilityScoring.ts';

// Matching-pool generator. Creates Connection records for a single user against
// other SINGLE users with completed onboarding + compatibility answers.
//
// SEGREGATION (critical): couple-mode profiles are NEVER included in either
// direction. A couple caller gets zero matches. Single callers only match
// with other singles. There is no couple-to-couple pool (the existing couple
// flow does not implement one).
//
// Idempotent: skips to_user_ids the caller already has a Connection with.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id || user.id;
    // Only admins may generate matches for another user
    if (targetUserId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Cannot generate matches for another user' }, { status: 403 });
    }
    const maxMatches = Math.min(body.max_matches || 10, 50);

    const myProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: targetUserId });
    const myProfile = myProfiles[0];
    if (!myProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // SEGREGATION: couples are not in the singles matching pool
    if (myProfile.profile_type === 'couple') {
      return Response.json({
        success: true,
        created: 0,
        message: 'Couple profiles are not in the singles matching pool.',
      });
    }

    const myAnswersArr = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: targetUserId });
    const myAnswers = myAnswersArr[0];
    if (!myAnswers) {
      return Response.json({ error: 'Complete the 21 compatibility questions first' }, { status: 400 });
    }

    // Skip users the caller already has a connection with
    const existingConns = await base44.asServiceRole.entities.Connection.filter({ from_user_id: targetUserId });
    const existingToIds = new Set(existingConns.map(c => c.to_user_id));

    // SEGREGATION: only individual (single) profiles with completed onboarding
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 1000);
    const candidates = allProfiles.filter(p =>
      p.user_id !== targetUserId &&
      p.profile_type !== 'couple' &&
      p.onboarding_complete &&
      !existingToIds.has(p.user_id) &&
      // Pre-filter (Question 4): sexual orientation must be an exact match.
      // Only enforced when both users have a orientation set, so missing data
      // never blocks matching.
      (!myProfile.sexual_orientation || !p.sexual_orientation || p.sexual_orientation === myProfile.sexual_orientation)
    );

    const scored = [];
    for (const p of candidates) {
      const theirAnswersArr = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: p.user_id });
      const theirAnswers = theirAnswersArr[0];
      if (!theirAnswers) continue;
      const { overall } = computeScoreFromStored(myAnswers, theirAnswers);
      scored.push({ profile: p, score: overall });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, maxMatches);

    let created = 0;
    for (const { profile, score } of top) {
      await base44.asServiceRole.entities.Connection.create({
        from_user_id: targetUserId,
        to_user_id: profile.user_id,
        compatibility_score: score,
        status: 'pending',
        is_unlocked: false,
      });
      created++;
    }

    return Response.json({
      success: true,
      created,
      total_candidates: candidates.length,
    });
  } catch (error) {
    console.error('[generateMatches] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});