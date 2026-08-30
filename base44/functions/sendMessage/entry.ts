import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS, getPricingForCompatibility, getMonthStart, hasActiveMembership } from '../../shared/planLimits.ts';

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

    // Check plan limits
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    const tier = profile?.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;
    const membershipActive = hasActiveMembership(profile);

    // Compute cost server-side from the connection's compatibility score
    const pricing = getPricingForCompatibility(conn.compatibility_score || 0);

    // ── Nina Membership: check free message allowance first ──
    if (tier === 'nina_membership' && membershipActive && limits.free_messages > 0) {
      const freeUsed = profile.free_messages_used || 0;
      if (freeUsed < limits.free_messages) {
        const message = await base44.asServiceRole.entities.Message.create({
          conversation_id,
          from_user_id: user.id,
          to_user_id,
          content: content.trim(),
          cost: 0,
          message_type: 'text',
        });
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          free_messages_used: freeUsed + 1,
        });
        return Response.json({ success: true, message, free_message: true });
      }
      // Free allowance exhausted — fall through to paid pricing below
    } else if (tier !== 'nina_membership') {
      // ── Legacy tier monthly message quota (hard cap) ──
      const monthStart = getMonthStart();
      let directMessages = 0;
      try {
        const sentMsgs = await base44.asServiceRole.entities.Message.filter({ from_user_id: user.id });
        directMessages = sentMsgs.filter(m => new Date(m.created_date) >= monthStart).length;
      } catch (e) {
        console.error('Error counting messages:', e.message);
      }
      if (limits.messages_per_month !== Infinity && directMessages >= limits.messages_per_month) {
        return Response.json({ error: 'Message limit reached. Upgrade your plan or wait for next month.' }, { status: 403 });
      }
    }

    // Paid message — cost from the interaction-pricing table (unchanged)
    const message = await base44.asServiceRole.entities.Message.create({
      conversation_id,
      from_user_id: user.id,
      to_user_id,
      content: content.trim(),
      cost: pricing.msg,
      message_type: 'text',
    });

    return Response.json({ success: true, message });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});