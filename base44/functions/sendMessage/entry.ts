import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS } from '../../shared/planLimits.ts';
import { computeMembershipStatus, isEntitledForPaidActions } from '../../shared/membershipState.ts';
import { evaluateFoundingEligibility } from '../../shared/foundingMembers.ts';
import { debitInteraction, reverseDebit } from '../../shared/interactionCredits.ts';

// Sends a message with server-authoritative cost computation and plan-limit enforcement.
// The client never sets the cost — it is derived from the connection's compatibility score.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversation_id, to_user_id, content } = await req.json();
    if (!conversation_id || !to_user_id || !content || !content.trim()) {
      return Response.json({ error: 'conversation_id, to_user_id, and content are required' }, { status: 400 });
    }

    // Verify the caller owns this connection and it's unlocked
    const conns = await base44.asServiceRole.entities.Connection.filter({ id: conversation_id, from_user_id: user.id });
    const conn = conns[0];
    if (!conn) return Response.json({ error: 'Connection not found' }, { status: 404 });
    if (!conn.is_unlocked) return Response.json({ error: 'Connection is not unlocked' }, { status: 403 });
    if (conn.to_user_id !== to_user_id) return Response.json({ error: 'Invalid recipient' }, { status: 400 });
    if (conn.status === 'blocked') return Response.json({ error: 'You cannot message this member.' }, { status: 403 });

    // Blocking check (either direction) — never rely on connection status alone,
    // since a block can happen after unlock without an explicit connection record.
    const [blocksByMe, blocksOfMe] = await Promise.all([
      base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: user.id, blocked_user_id: to_user_id }),
      base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: to_user_id, blocked_user_id: user.id }),
    ]);
    if (blocksByMe.length > 0 || blocksOfMe.length > 0) {
      return Response.json({ error: 'You cannot message this member.' }, { status: 403 });
    }

    // Basic spam prevention: max 10 messages per rolling 60 seconds per sender.
    const recentMsgs = await base44.asServiceRole.entities.Message.filter({ from_user_id: user.id }, '-created_date', 15);
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentCount = recentMsgs.filter(m => m.created_date && new Date(m.created_date).getTime() >= oneMinuteAgo).length;
    if (recentCount >= 10) {
      return Response.json({ error: 'You are sending messages too quickly. Please wait a moment.' }, { status: 429 });
    }

    // Check plan limits
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    // Account-status guard: suspended members cannot send messages.
    if (profile?.account_status === 'suspended' || profile?.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not permitted to send messages.' }, { status: 403 });
    }
    const tier = profile?.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;

    // ── Membership entitlement gate (decision 1) ──
    const foundingElig = await evaluateFoundingEligibility(base44, user.id);
    const membershipStatus = computeMembershipStatus(profile, foundingElig.benefit, 0);
    if (!isEntitledForPaidActions(membershipStatus)) {
      return Response.json({
        error: 'An active Nina Purple membership is required to send messages.',
        code: 'membership_required',
        membership_status: membershipStatus,
      }, { status: 403 });
    }

    // ── Initial outreach vs reply (decision 2) ──
    // The first message this user sends in a conversation is a paid initial
    // outreach (one credit). Replies in an existing conversation are free.
    let hasSentBefore = false;
    try {
      const priorMsgs = await base44.asServiceRole.entities.Message.filter({ conversation_id, from_user_id: user.id });
      hasSentBefore = priorMsgs.length > 0;
    } catch (e) {
      console.warn('sendMessage: could not check prior messages:', e.message);
    }

    if (hasSentBefore) {
      // Reply — free.
      const message = await base44.asServiceRole.entities.Message.create({
        conversation_id,
        from_user_id: user.id,
        to_user_id,
        content: content.trim(),
        cost: 0,
        message_type: 'text',
      });
      return Response.json({ success: true, message, free_reply: true });
    }

    // ── First message: included free with the connection unlock ──
    // The connection unlock payment (both parties) includes the first message.
    // Per-message charges, if any, begin with the second message; replies are free.
    const message = await base44.asServiceRole.entities.Message.create({
      conversation_id,
      from_user_id: user.id,
      to_user_id,
      content: content.trim(),
      cost: 0,
      message_type: 'text',
    });
    return Response.json({ success: true, message, free_first_message: true });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});