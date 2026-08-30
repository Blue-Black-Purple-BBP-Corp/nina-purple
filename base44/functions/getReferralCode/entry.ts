import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ensureReferralCode, REFERRAL_REWARD_BBP } from '../../shared/referral.ts';

// Returns the caller's unique referral code + shareable link + referral stats.
// Generates the code on first call (idempotent — one code per member, persisted
// on UserProfile.referral_code). The link points to /register?ref=CODE so the
// invitee's signup is attributed to this referrer.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const code = await ensureReferralCode(base44, user.id);
    const link = `https://nina-purple-connect.base44.app/register?ref=${code}`;

    // Stats: referrals made + points earned from referrals (user-token read,
    // RLS allows referrer to see their own referral records).
    const referrals = await base44.entities.Referral.filter({ referrer_native_user_id: user.id });
    const rewarded = referrals.filter((r: any) => r.status === 'rewarded');
    const pending = referrals.filter((r: any) => r.status === 'pending');

    return Response.json({
      code,
      link,
      reward_bbp: REFERRAL_REWARD_BBP,
      reward_usd: REFERRAL_REWARD_BBP,
      stats: {
        total: referrals.length,
        rewarded: rewarded.length,
        pending: pending.length,
        points_earned: rewarded.length * REFERRAL_REWARD_BBP,
      },
    });
  } catch (error) {
    console.error('[getReferralCode] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});