import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { completeConnectionIfBothPaid } from '../../shared/connectionComplete.ts';
import { PLAN_LIMITS, getPricingForCompatibility, getMonthStart } from '../../shared/planLimits.ts';
import { computeMembershipStatus, isEntitledForPaidActions } from '../../shared/membershipState.ts';
import { evaluateFoundingEligibility } from '../../shared/foundingMembers.ts';
import { debitInteraction } from '../../shared/interactionCredits.ts';

// Mutual pay-to-connect: the matched person (to_user) accepts a connection
// that the matcher (from_user) has already expressed interest in (paid their
// share). On acceptance, to_user is charged their share of the unlock cost.
// The connection becomes "connected" only when BOTH parties have a successful
// credit debit recorded. If to_user lacks credits, the connection is held in
// "pending_payment" state and to_user is prompted to recharge.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { connection_id } = await req.json();
    if (!connection_id) return Response.json({ error: 'connection_id required' }, { status: 400 });

    let conn = null;
    try {
      const conns = await base44.asServiceRole.entities.Connection.filter({ id: connection_id });
      conn = conns[0] || null;
    } catch (lookupErr) {
      console.error('acceptConnection lookup error:', lookupErr.message);
    }
    if (!conn) return Response.json({ error: 'Connection not found' }, { status: 404 });

    // Only the matched person (to_user) may accept.
    if (conn.to_user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Idempotent: already connected — return the existing brief.
    if (conn.status === 'connected') {
      const existing = await base44.asServiceRole.entities.ConnectionBrief.filter({ connection_id });
      return Response.json({ success: true, brief: existing[0] || null, already_connected: true });
    }

    // Handle pending_payment retry: only to_user retries their own payment.
    if (conn.status === 'pending_payment') {
      if (conn.pending_payment_for !== 'to_user') {
        return Response.json({
          success: false,
          reason: 'Waiting for the other member to complete their payment.',
          code: 'waiting_for_other',
        }, { status: 402 });
      }
      // Fall through to debit retry below.
    } else if (conn.status === 'pending') {
      // The matcher (from_user) must have expressed interest (paid) first.
      if (!conn.from_unlock_paid && !conn.is_unlocked) {
        return Response.json({
          success: false,
          reason: 'The other member has not expressed interest yet.',
          code: 'waiting_for_interest',
        }, { status: 400 });
      }
    } else {
      return Response.json({ error: 'Connection is not in a pending state' }, { status: 400 });
    }

    // Idempotent: to_user already paid — just check completion.
    if (conn.to_unlock_paid) {
      const result = await completeConnectionIfBothPaid(base44, conn.id);
      if (result.completed) {
        return Response.json({ success: true, brief: result.brief });
      }
      return Response.json({ success: true, waiting_for_other: true, reason: 'Waiting for the other member to complete their payment.' });
    }

    // ── Load to_user's profile for membership + plan checks ──
    const toProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const toProfile = toProfiles[0];
    if (!toProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Account-status guard
    if (toProfile.account_status === 'suspended' || toProfile.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not permitted to accept connections.' }, { status: 403 });
    }

    // ── Membership entitlement gate for to_user ──
    const foundingElig = await evaluateFoundingEligibility(base44, user.id);
    const membershipStatus = computeMembershipStatus(toProfile, foundingElig.benefit, 0);
    if (!isEntitledForPaidActions(membershipStatus)) {
      return Response.json({
        success: false,
        reason: 'An active Nina Purple membership is required to accept connections.',
        code: 'membership_required',
        membership_status: membershipStatus,
      }, { status: 403 });
    }

    const tier = toProfile.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;
    const score = conn.compatibility_score || 0;
    const pricing = getPricingForCompatibility(score);

    // ── Nina Membership: check free unlock allowance for to_user ──
    if (tier === 'nina_membership' && limits.free_profile_unlocks > 0) {
      const freeUsed = toProfile.free_profile_unlocks_used || 0;
      if (freeUsed < limits.free_profile_unlocks) {
        // Use free unlock — no debit needed.
        await base44.asServiceRole.entities.UserProfile.update(toProfile.id, {
          free_profile_unlocks_used: freeUsed + 1,
        });
        await base44.asServiceRole.entities.Connection.update(conn.id, {
          to_unlock_paid: true,
          pending_payment_for: null,
        });

        const result = await completeConnectionIfBothPaid(base44, conn.id);
        if (result.completed) {
          return Response.json({ success: true, brief: result.brief, free_unlock: true });
        }
        return Response.json({ success: true, free_unlock: true, waiting_for_other: true, reason: 'Waiting for the other member to complete their payment.' });
      }
    }

    // ── Legacy tier monthly acceptance quota (hard cap) ──
    if (tier !== 'nina_membership') {
      const monthStart = getMonthStart();
      const myAcceptedConns = await base44.asServiceRole.entities.Connection.filter({ to_user_id: user.id });
      const acceptedUsed = myAcceptedConns.filter(
        (c) => c.to_unlock_paid && new Date(c.updated_date || c.created_date) >= monthStart
      ).length;
      if (acceptedUsed >= limits.unlocks_per_month) {
        return Response.json({
          success: false,
          reason: 'You have reached your monthly connection acceptance limit.',
          code: 'monthly_limit',
        }, { status: 403 });
      }
    }

    // ── Debit to_user's share of the unlock cost ──
    const idempotencyKey = `accept-${conn.id}`;
    const debit = await debitInteraction(base44, {
      native_user_id: user.id,
      amount: pricing.unlock,
      entry_type: 'debit_unlock',
      source_type: 'unlock',
      source_reference: conn.id,
      idempotency_key: idempotencyKey,
      description: `Accepted connection (${score}% compatibility)`,
      correlation_id: idempotencyKey,
    });

    if (!debit.success) {
      // Hold in pending_payment — to_user needs to recharge.
      await base44.asServiceRole.entities.Connection.update(conn.id, {
        status: 'pending_payment',
        pending_payment_for: 'to_user',
        to_unlock_paid: false,
      });
      return Response.json({
        success: false,
        reason: 'You need more Interaction Credits to accept this connection.',
        code: 'insufficient_credits',
        pending_payment_for: 'to_user',
        balance: debit.balance,
        required: debit.required,
        recharge_url: '/wallet',
      }, { status: 402 });
    }

    // Record to_user's payment.
    await base44.asServiceRole.entities.Connection.update(conn.id, {
      to_unlock_paid: true,
      pending_payment_for: null,
    });

    // Attempt to complete the connection (both parties must have paid).
    const result = await completeConnectionIfBothPaid(base44, conn.id);
    if (result.completed) {
      return Response.json({ success: true, brief: result.brief });
    }

    // from_user hasn't paid yet — hold in pending_payment for from_user.
    await base44.asServiceRole.entities.Connection.update(conn.id, {
      status: 'pending_payment',
      pending_payment_for: 'from_user',
    });
    return Response.json({
      success: true,
      waiting_for_other: true,
      reason: 'Waiting for the other member to complete their payment.',
    });
  } catch (error) {
    console.error('acceptConnection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});