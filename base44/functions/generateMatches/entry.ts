import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { computeScoreFromStored } from '../../shared/compatibilityScoring.ts';

// Haversine distance in km between two lat/lng points.
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
    if (targetUserId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Cannot generate matches for another user' }, { status: 403 });
    }
    const maxMatches = Math.min(body.max_matches || 10, 50);

    const myProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: targetUserId });
    const myProfile = myProfiles[0];
    if (!myProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Account-status guard: suspended members are removed from discovery.
    if (myProfile.account_status === 'suspended' || myProfile.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not eligible for matching.' }, { status: 403 });
    }

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

    // Skip users with any existing connection in EITHER direction (already
    // matched, or already declined/blocked me — must never resurface).
    const [connsFrom, connsTo] = await Promise.all([
      base44.asServiceRole.entities.Connection.filter({ from_user_id: targetUserId }),
      base44.asServiceRole.entities.Connection.filter({ to_user_id: targetUserId }),
    ]);
    const existingToIds = new Set([
      ...connsFrom.map(c => c.to_user_id),
      ...connsTo.map(c => c.from_user_id),
    ]);

    // Skip users blocked by me or who have blocked me (either direction).
    const [blocksByMe, blocksOfMe] = await Promise.all([
      base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: targetUserId }),
      base44.asServiceRole.entities.BlockedUser.filter({ blocked_user_id: targetUserId }),
    ]);
    const blockedIds = new Set([
      ...blocksByMe.map(b => b.blocked_user_id),
      ...blocksOfMe.map(b => b.blocker_user_id),
    ]);

    // Matching preferences (pre-filters, not scoring inputs).
    // When unset, no restriction is applied on that dimension.
    const ageMin = myProfile.match_age_min;
    const ageMax = myProfile.match_age_max;
    const distMax = myProfile.match_distance_max;
    const myLat = myProfile.latitude;
    const myLng = myProfile.longitude;

    // SEGREGATION: only individual (single) profiles with completed onboarding
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 1000);
    const candidates = allProfiles.filter(p =>
      p.user_id !== targetUserId &&
      p.profile_type !== 'couple' &&
      p.onboarding_complete &&
      p.account_status !== 'suspended' &&
      p.account_status !== 'permanently_removed' &&
      !existingToIds.has(p.user_id) &&
      !blockedIds.has(p.user_id) &&
      // Pre-filter (Question 4): sexual orientation must be an exact match.
      // Only enforced when both users have a orientation set, so missing data
      // never blocks matching.
      (!myProfile.sexual_orientation || !p.sexual_orientation || p.sexual_orientation === myProfile.sexual_orientation) &&
      // Age pre-filter: skip candidates outside the preferred age range.
      // Missing age on either side = no restriction (never blocks).
      (!ageMin || !p.age || p.age >= ageMin) &&
      (!ageMax || !p.age || p.age <= ageMax) &&
      // Distance pre-filter: skip candidates farther than the preferred max distance.
      // Missing coordinates on either side = no restriction (never blocks).
      (!distMax || !myLat || !myLng || !p.latitude || !p.longitude ||
        haversineKm(myLat, myLng, p.latitude, p.longitude) <= distMax)
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