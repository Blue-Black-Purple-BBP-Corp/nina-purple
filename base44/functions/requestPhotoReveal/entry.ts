import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { computeMembershipStatus, isEntitledForPaidActions } from '../../shared/membershipState.ts';
import { evaluateFoundingEligibility } from '../../shared/foundingMembers.ts';
import { holdCredits, getAvailableBalance } from '../../shared/interactionCredits.ts';
import {
  checkRevealEligibility, createPhotoRevealRequest, isBlocked, writePhotoAudit,
  PHOTO_REVEAL_COST_BBP, APPROVAL_EXPIRY_DAYS,
} from '../../shared/photoAccess.ts';

// Viewer initiates a photo-reveal request. Credits are RESERVED (held, not
// debited) until the owner approves. On approval the hold converts to a debit
// and a viewer-specific PhotoRevealEntitlement is created. On decline, expiry
// (7 days), or cancellation the hold is released and no entitlement is created.
// A 30-day cooldown applies after decline/expiry/cancellation.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { owner_user_id } = await req.json().catch(() => ({}));
    if (!owner_user_id) return Response.json({ error: 'owner_user_id required' }, { status: 400 });
    if (owner_user_id === user.id) return Response.json({ error: 'Cannot reveal your own profile' }, { status: 400 });

    // ── Membership gate ──
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });
    if (profile.account_status === 'suspended' || profile.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not permitted to request photo reveals.' }, { status: 403 });
    }
    const foundingElig = await evaluateFoundingEligibility(base44, user.id);
    const membershipStatus = computeMembershipStatus(profile, foundingElig.benefit, 0);
    if (!isEntitledForPaidActions(membershipStatus)) {
      return Response.json({
        success: false,
        reason: 'An active Nina Purple membership is required to request photo reveals.',
        code: 'membership_required',
        membership_status: membershipStatus,
      }, { status: 403 });
    }

    // ── Owner account-status check ──
    const ownerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: owner_user_id });
    const ownerProfile = ownerProfiles[0];
    if (!ownerProfile) return Response.json({ error: 'Owner profile not found' }, { status: 404 });
    if (ownerProfile.account_status === 'permanently_removed' || ownerProfile.account_status === 'suspended') {
      return Response.json({ success: false, reason: 'This member is not available.' }, { status: 403 });
    }

    // ── Block check ──
    if (await isBlocked(base44, user.id, owner_user_id)) {
      await writePhotoAudit(base44, {
        viewer_native_user_id: user.id, owner_native_user_id: owner_user_id,
        access_result: 'blocked',
      });
      return Response.json({ success: false, reason: 'Cannot request photo reveal for this member.' }, { status: 403 });
    }

    // ── Duplicate / cooldown check ──
    const eligibility = await checkRevealEligibility(base44, user.id, owner_user_id);
    if (eligibility.blocked) {
      return Response.json({
        success: false,
        reason: eligibility.reason === 'pending_request_exists'
          ? 'You already have a pending photo reveal request for this member.'
          : 'A recent photo reveal request for this member was not approved. Please try again later.',
        code: eligibility.reason,
        cooldown_until: eligibility.cooldownUntil || null,
      }, { status: 403 });
    }

    // ── Already entitled? (existing active entitlement — no new charge) ──
    const { getActiveEntitlement } = await import('../../shared/photoAccess.ts');
    const existing = await getActiveEntitlement(base44, user.id, owner_user_id);
    if (existing) {
      return Response.json({
        success: true, already_entitled: true, entitlement_id: existing.entitlement_id,
        source_type: existing.source_type,
      });
    }

    // ── Sufficient available credits? ──
    const price = PHOTO_REVEAL_COST_BBP;
    const available = await getAvailableBalance(base44, user.id);
    if (available < price) {
      return Response.json({
        success: false,
        reason: 'You need more BBP Credits to request a photo reveal.',
        code: 'insufficient_credits',
        balance: available,
        required: price,
      }, { status: 403 });
    }

    // ── Reserve (hold) the credits ──
    const correlation_id = crypto.randomUUID();
    const holdExpiresAt = new Date(Date.now() + APPROVAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const idempotency_key = `hold-reveal-${owner_user_id}-${user.id}`;
    const hold = await holdCredits(base44, {
      native_user_id: user.id,
      amount: price,
      reserved_for_type: 'photo_reveal',
      reserved_for_id: owner_user_id, // provisional; updated to request_id after creation
      hold_expires_at: holdExpiresAt,
      idempotency_key,
      description: `Reserved ${price} BBP Credits for photo reveal request`,
      correlation_id,
    });
    if (!hold.success) {
      return Response.json({
        success: false,
        reason: hold.reason === 'insufficient_credits'
          ? 'You need more BBP Credits to request a photo reveal.'
          : 'Unable to reserve credits.',
        code: hold.reason,
        balance: hold.balance,
        required: hold.required,
      }, { status: 403 });
    }

    // ── Create the request ──
    const request = await createPhotoRevealRequest(base44, {
      viewer_id: user.id,
      owner_id: owner_user_id,
      quoted_price: price,
      reservation_id: hold.reservation_id,
      ledger_hold_id: hold.ledger_id,
      correlation_id,
    });

    return Response.json({
      success: true,
      request_id: request.request_id,
      request_status: 'pending_owner_approval',
      quoted_price: price,
      expires_at: request.expires_at,
      message: 'Your request has been sent to this member for approval. You will only receive access if the member approves.',
    });
  } catch (error) {
    console.error('[requestPhotoReveal] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});