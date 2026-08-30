import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { updateWalletProjection } from '../../shared/bbpRules.ts';

// Rebuilds the wallet balance from the append-only ledger for reconciliation
// and repair. Admin-only. Useful after data corrections or migrations.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { bbp_member_id, native_user_id } = body;

    if (!bbp_member_id && !native_user_id) {
      return Response.json({ error: 'Provide bbp_member_id or native_user_id' }, { status: 400 });
    }

    // If only native_user_id provided, resolve bbp_member_id
    let bbpId = bbp_member_id;
    let nativeId = native_user_id;
    if (!bbpId) {
      const profiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id });
      if (!profiles.length) return Response.json({ error: 'Member not found' }, { status: 404 });
      bbpId = profiles[0].bbp_member_id;
    }
    if (!nativeId) {
      const profiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ bbp_member_id: bbpId });
      if (!profiles.length) return Response.json({ error: 'Member not found' }, { status: 404 });
      nativeId = profiles[0].native_user_id;
    }

    await updateWalletProjection(base44, bbpId, nativeId);

    const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({ bbp_member_id: bbpId });
    return Response.json({ success: true, wallet: wallets[0] || null });
  } catch (error) {
    console.error('recalculateWallet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}