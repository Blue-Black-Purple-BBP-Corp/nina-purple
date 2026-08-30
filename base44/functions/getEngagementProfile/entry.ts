import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Returns the current member's engagement profile, wallet balance, and recent
// ledger entries for UI display. Also ensures the engagement profile and wallet
// exist (idempotent bootstrap). This is the primary read function for the
// Community Standing card and BBP Wallet page.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure engagement profile exists
    let engagementProfiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
      native_user_id: user.id,
    });

    let engagement = engagementProfiles[0];

    if (!engagement) {
      // Bootstrap: generate bbp_member_id and create profile + wallet
      const { generateBbpMemberId } = await import('../../shared/bbpRules.ts');
      const bbpMemberId = generateBbpMemberId();
      engagement = await base44.asServiceRole.entities.MemberEngagementProfile.create({
        bbp_member_id: bbpMemberId,
        native_user_id: user.id,
        onboarding_state: 'getting_started',
        community_standing_state: 'getting_started',
        language_preference: 'en',
        account_confirmed: false,
      });
      await base44.asServiceRole.entities.BBPWalletBalance.create({
        bbp_member_id: bbpMemberId,
        native_user_id: user.id,
        available_points: 0,
        pending_points: 0,
        lifetime_earned: 0,
        lifetime_redeemed: 0,
      });
    }

    // Fetch wallet
    const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({
      bbp_member_id: engagement.bbp_member_id,
    });
    const wallet = wallets[0] || {
      available_points: 0,
      pending_points: 0,
      lifetime_earned: 0,
      lifetime_redeemed: 0,
    };

    // Fetch recent ledger entries (last 20, sorted by created_date desc)
    const ledgerEntries = await base44.asServiceRole.entities.BBPPointsLedger.filter({
      bbp_member_id: engagement.bbp_member_id,
    }, '-created_date', 20);

    // Fetch policy acknowledgements
    const acknowledgements = await base44.asServiceRole.entities.PolicyAcknowledgement.filter({
      bbp_member_id: engagement.bbp_member_id,
    });

    return Response.json({
      success: true,
      engagement_profile: engagement,
      wallet,
      recent_ledger: ledgerEntries,
      acknowledgements,
    });
  } catch (error) {
    console.error('getEngagementProfile error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});