import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateBbpMemberId } from '../../shared/bbpRules.ts';

// Idempotent: ensures every authenticated member has exactly one
// MemberEngagementProfile (with an immutable bbp_member_id) and one
// BBPWalletBalance projection. Called on profile creation and on app load.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if engagement profile already exists
    const existing = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
      native_user_id: user.id,
    });

    if (existing.length > 0) {
      // Ensure wallet exists too
      const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({
        bbp_member_id: existing[0].bbp_member_id,
      });
      if (wallets.length === 0) {
        await base44.asServiceRole.entities.BBPWalletBalance.create({
          bbp_member_id: existing[0].bbp_member_id,
          native_user_id: user.id,
          available_points: 0,
          pending_points: 0,
          lifetime_earned: 0,
          lifetime_redeemed: 0,
        });
      }
      return Response.json({
        success: true,
        engagement_profile: existing[0],
        created: false,
      });
    }

    // Generate new immutable bbp_member_id
    const bbpMemberId = generateBbpMemberId();
    const now = new Date().toISOString();

    const profile = await base44.asServiceRole.entities.MemberEngagementProfile.create({
      bbp_member_id: bbpMemberId,
      native_user_id: user.id,
      onboarding_state: 'getting_started',
      community_standing_state: 'getting_started',
      language_preference: 'en',
      account_confirmed: false,
    });

    // Create wallet projection
    await base44.asServiceRole.entities.BBPWalletBalance.create({
      bbp_member_id: bbpMemberId,
      native_user_id: user.id,
      available_points: 0,
      pending_points: 0,
      lifetime_earned: 0,
      lifetime_redeemed: 0,
    });

    return Response.json({
      success: true,
      engagement_profile: profile,
      created: true,
    });
  } catch (error) {
    console.error('ensureMemberEngagementProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});