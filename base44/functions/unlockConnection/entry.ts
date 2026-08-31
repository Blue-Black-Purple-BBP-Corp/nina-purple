import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS, getPricingForCompatibility, getMonthStart, hasActiveMembership } from '../../shared/planLimits.ts';
import { grantEntitlement } from '../../shared/photoAccess.ts';
import { computeMembershipStatus, isEntitledForPaidActions } from '../../shared/membershipState.ts';
import { evaluateFoundingEligibility } from '../../shared/foundingMembers.ts';
import { debitInteraction, reverseDebit } from '../../shared/interactionCredits.ts';

// Authoritative server-side handler for connection unlocks.
// The client must NEVER write is_unlocked / unlock_cost_paid / gallery_unlocked
// directly — all such mutations go through this function, which verifies
// ownership, enforces plan limits, and computes the cost from the stored
// compatibility score (never from client input).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { connection_id, action } = body; // 'unlock' | 'gallery_unlock'

    if (!connection_id) return Response.json({ error: 'connection_id required' }, { status: 400 });

    // Load the connection via service role so ownership can be verified regardless of RLS.
    let conn = null;
    try {
      const conns = await base44.asServiceRole.entities.Connection.filter({ id: connection_id });
      conn = conns[0] || null;
    } catch (lookupErr) {
      console.error('unlockConnection lookup error:', lookupErr.message);
    }
    if (!conn) return Response.json({ error: 'Connection not found' }, { status: 404 });

    // Only the matcher (from_user) may unlock their own connection.
    if (conn.from_user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Load the caller's profile + plan limits.
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    // Account-status guard: suspended members cannot unlock new connections.
    if (profile?.account_status === 'suspended' || profile?.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not permitted to unlock connections.' }, { status: 403 });
    }
    const tier = profile?.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;

    // ── Membership entitlement gate (decision 1) ──
    const foundingElig = await evaluateFoundingEligibility(base44, user.id);
    const membershipStatus = computeMembershipStatus(profile, foundingElig.benefit, 0);
    if (!isEntitledForPaidActions(membershipStatus)) {
      return Response.json({
        success: false,
        reason: 'An active Nina Purple membership is required to unlock connections.',
        code: 'membership_required',
        membership_status: membershipStatus,
      }, { status: 403 });
    }

    // ── Profile unlock ──
    if (action === 'unlock') {
      // Idempotent: already unlocked — return the recorded cost.
      if (conn.is_unlocked) {
        return Response.json({ success: true, already_unlocked: true, unlock_cost_paid: conn.unlock_cost_paid || 0 });
      }

      const score = conn.compatibility_score || 0;
      const pricing = getPricingForCompatibility(score);

      // ── Nina Membership: check free unlock allowance first ──
      if (tier === 'nina_membership' && limits.free_profile_unlocks > 0) {
        const freeUsed = profile.free_profile_unlocks_used || 0;
        if (freeUsed < limits.free_profile_unlocks) {
          await base44.asServiceRole.entities.Connection.update(conn.id, {
            is_unlocked: true,
            unlock_cost_paid: 0,
          });
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            free_profile_unlocks_used: freeUsed + 1,
          });
          await grantEntitlement(base44, {
            viewer_id: user.id, owner_id: conn.to_user_id,
            source_type: 'paid_credit', source_connection_id: conn.id,
            correlation_id: `unlock-${conn.id}`,
          });
          return Response.json({ success: true, unlock_cost_paid: 0, free_unlock: true });
        }
      }

      // ── Legacy tier monthly unlock quota (hard cap) ──
      if (tier !== 'nina_membership') {
        const monthStart = getMonthStart();
        const myConns = await base44.asServiceRole.entities.Connection.filter({ from_user_id: user.id });
        const unlocksUsed = myConns.filter(
          (c) => c.is_unlocked && c.unlock_cost_paid > 0 && new Date(c.updated_date || c.created_date) >= monthStart
        ).length;
        const unlocksRemaining = Math.max(0, limits.unlocks_per_month - unlocksUsed);
        if (unlocksRemaining <= 0) {
          return Response.json({
            success: false,
            reason: 'You have reached your monthly profile unlock limit.',
          });
        }
      }

      // ── Paid unlock: debit Interaction Credits (decision 2) ──
      const idempotencyKey = `unlock-${conn.id}`;
      const debit = await debitInteraction(base44, {
        native_user_id: user.id,
        amount: pricing.unlock,
        entry_type: 'debit_unlock',
        source_type: 'unlock',
        source_reference: conn.id,
        idempotency_key: idempotencyKey,
        description: `Unlocked connection (${score}% compatibility)`,
        correlation_id: idempotencyKey,
      });
      if (!debit.success) {
        return Response.json({
          success: false,
          reason: debit.reason === 'insufficient_credits'
            ? 'You need more Interaction Credits to unlock this connection.'
            : 'Unable to complete the unlock.',
          code: debit.reason,
          balance: debit.balance,
          required: debit.required,
        }, { status: 403 });
      }

      // Record the unlock + grant the photo-reveal entitlement. If the grant
      // fails, reverse the debit so the member is not charged.
      try {
        await base44.asServiceRole.entities.Connection.update(conn.id, {
          is_unlocked: true,
          unlock_cost_paid: pricing.unlock,
        });
        await grantEntitlement(base44, {
          viewer_id: user.id, owner_id: conn.to_user_id,
          source_type: 'paid_credit', source_connection_id: conn.id,
          correlation_id: idempotencyKey,
        });
      } catch (grantErr) {
        console.error('[unlockConnection] entitlement grant failed:', grantErr.message);
        await reverseDebit(base44, {
          native_user_id: user.id,
          original_ledger_id: debit.ledger_id,
          amount: pricing.unlock,
          reason: 'unlock_entitlement_grant_failed',
          idempotency_key: `reverse-${idempotencyKey}`,
          correlation_id: idempotencyKey,
        });
        return Response.json({ success: false, reason: 'Unable to complete the unlock.', code: 'grant_failed' }, { status: 500 });
      }

      return Response.json({ success: true, unlock_cost_paid: pricing.unlock, balance_after: debit.balance_after });
    }

    // gallery_unlock has been folded into the PhotoRevealEntitlement model
    // (source_type=subscription_perk via the revealPhotos function). The
    // legacy gallery_unlock action is intentionally no longer supported here.
    if (action === 'gallery_unlock') {
      return Response.json({
        success: false,
        reason: 'Gallery unlock is now handled via the photo reveal flow. Use revealPhotos.',
        code: 'use_reveal_photos',
      }, { status: 410 });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('unlockConnection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});