import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { processRedemption } from '../../shared/bbpRules.ts';

// Processes a BBP redemption request. Validates balance, catalog availability,
// caps, minimum payable, no-stack rule, and existing payment/booking result
// before debiting ledger and creating a Redemption record.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { benefit_id, benefit_type, points_cost, transaction_amount_usd, has_promo_code, fulfillment_reference } = body;

    if (!benefit_id || !benefit_type || !points_cost) {
      return Response.json({ error: 'Missing required fields: benefit_id, benefit_type, points_cost' }, { status: 400 });
    }

    // Resolve the member's bbp_member_id from their engagement profile
    const profiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id: user.id });
    if (!profiles.length) {
      return Response.json({ error: 'Member engagement profile not found' }, { status: 404 });
    }
    const bbp_member_id = profiles[0].bbp_member_id;

    const result = await processRedemption(
      base44,
      bbp_member_id,
      user.id,
      benefit_id,
      benefit_type,
      points_cost,
      transaction_amount_usd || 0,
      has_promo_code || false,
      fulfillment_reference || `manual_${Date.now()}`
    );

    return Response.json(result);
  } catch (error) {
    console.error('redeemBBP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}