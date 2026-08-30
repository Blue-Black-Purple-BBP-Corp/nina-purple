import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS, hasActiveMembership, getBillingCycleStart } from '../../shared/planLimits.ts';
import {
  getActiveEntitlement, grantEntitlement, writePhotoAudit, isBlocked, GALACTIC_REVEAL_ALLOWANCE,
} from '../../shared/photoAccess.ts';

// Galactic subscription-perk photo reveal. A Galactic member with an active
// membership can reveal a profile's photos without paying the per-connection
// unlock cost, up to GALACTIC_REVEAL_ALLOWANCE (3) photo-profile reveals per
// billing month. No rollover. Creates a viewer-specific, auditable
// profile-level PhotoRevealEntitlement (source_type=subscription_perk),
// subject to block/moderation/account-status rules. Does NOT grant messaging
// (that still requires the paid connection unlock).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { owner_user_id } = await req.json().catch(() => ({}));
    if (!owner_user_id) return Response.json({ error: 'owner_user_id required' }, { status: 400 });
    if (owner_user_id === user.id) return Response.json({ error: 'Cannot reveal your own profile' }, { status: 400 });

    const correlation_id = crypto.randomUUID();

    // Caller must be Galactic with an active membership.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });
    if (profile.subscription_tier !== 'galactic' || !hasActiveMembership(profile)) {
      return Response.json({
        success: false,
        reason: 'Photo reveal is a Galactic perk. Upgrade to Galactic to reveal photos without paying per connection.',
      }, { status: 403 });
    }

    // Account-status guard.
    if (profile.account_status === 'suspended' || profile.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not permitted to reveal photos.' }, { status: 403 });
    }

    // Block check.
    if (await isBlocked(base44, user.id, owner_user_id)) {
      await writePhotoAudit(base44, {
        viewer_native_user_id: user.id, owner_native_user_id: owner_user_id,
        access_result: 'blocked', correlation_id,
      });
      return Response.json({ success: false, reason: 'Cannot reveal photos for this member.' }, { status: 403 });
    }

    // Idempotent: if an active entitlement already exists, return it.
    const existing = await getActiveEntitlement(base44, user.id, owner_user_id);
    if (existing) {
      return Response.json({
        success: true, entitlement_id: existing.entitlement_id, already_entitled: true,
        source_type: existing.source_type,
      });
    }

    // Allowance: count subscription_perk entitlements granted this billing cycle.
    const cycleStart = getBillingCycleStart(profile);
    const allEnts = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({
      viewer_native_user_id: user.id,
    });
    const usedThisCycle = allEnts.filter(
      (e) => e.source_type === 'subscription_perk' &&
             e.status !== 'superseded' &&
             e.granted_at && new Date(e.granted_at) >= cycleStart
    ).length;
    if (usedThisCycle >= GALACTIC_REVEAL_ALLOWANCE) {
      return Response.json({
        success: false,
        reason: `You have used all ${GALACTIC_REVEAL_ALLOWANCE} photo reveals for this billing cycle. Your allowance resets on your next renewal.`,
      }, { status: 403 });
    }

    // Grant the entitlement.
    const { entitlement } = await grantEntitlement(base44, {
      viewer_id: user.id,
      owner_id: owner_user_id,
      source_type: 'subscription_perk',
      correlation_id,
    });

    return Response.json({
      success: true,
      entitlement_id: entitlement.entitlement_id,
      remaining: GALACTIC_REVEAL_ALLOWANCE - usedThisCycle - 1,
    });
  } catch (error) {
    console.error('[revealPhotos] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});