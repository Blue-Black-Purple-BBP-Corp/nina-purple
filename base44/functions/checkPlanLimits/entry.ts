import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS, getBillingCycleStart } from '../../shared/planLimits.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body; // 'unlock' | 'message' | 'community_post' | 'gallery_unlock' | undefined (just get status)

    // Load user profile
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    const tier = profile?.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;

    // Calculate the billing-cycle start: nina_membership uses the member's
    // subscription_renewal_date; legacy tiers fall back to calendar month start.
    const now = new Date();
    const cycleStart = (profile?.subscription_tier === 'nina_membership')
      ? getBillingCycleStart(profile)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    // Count unlocks this month (Connection records unlocked this month)
    let unlocksUsed = 0;
    try {
      const myConns = await base44.entities.Connection.filter({ from_user_id: user.id });
      unlocksUsed = myConns.filter(c => c.is_unlocked && c.unlock_cost_paid > 0 && new Date(c.updated_date || c.created_date) >= cycleStart).length;
    } catch (e) {
      console.error('Error counting unlocks:', e.message);
    }

    // Count direct messages this month
    let directMessages = 0;
    try {
      const sentMsgs = await base44.entities.Message.filter({ from_user_id: user.id });
      directMessages = sentMsgs.filter(m => new Date(m.created_date) >= cycleStart).length;
    } catch (e) {
      console.error('Error counting messages:', e.message);
    }

    // Count community posts this month (excluding rooms the user owns/animates)
    let communityPosts = 0;
    try {
      const myPosts = await base44.entities.ChatPost.filter({ author_id: user.id });
      // Get all rooms to check ownership
      const roomIds = [...new Set(myPosts.map(p => p.room_id))];
      const ownedRoomIds = new Set();
      await Promise.all(roomIds.map(async (rid) => {
        const rooms = await base44.entities.ChatRoom.filter({ id: rid });
        if (rooms[0] && rooms[0].created_by_id === user.id) ownedRoomIds.add(rid);
      }));
      communityPosts = myPosts.filter(p => !ownedRoomIds.has(p.room_id) && new Date(p.created_date) >= cycleStart).length;
    } catch (e) {
      console.error('Error counting community posts:', e.message);
    }

    const messagesUsed = directMessages + communityPosts;
    const unlocksRemaining = Math.max(0, limits.unlocks_per_month - unlocksUsed);
    const messagesRemaining = limits.messages_per_month === Infinity ? Infinity : Math.max(0, limits.messages_per_month - messagesUsed);

    // Check specific action
    let allowed = true;
    let reason = '';
    if (action === 'unlock') {
      allowed = unlocksRemaining > 0;
      if (!allowed) reason = 'You have reached your monthly profile unlock limit. Upgrade your plan for more unlocks.';
    } else if (action === 'message' || action === 'community_post') {
      allowed = limits.messages_per_month === Infinity || messagesRemaining > 0;
      if (!allowed) reason = 'You have reached your monthly message limit. Upgrade your plan or wait for next month.';
    } else if (action === 'gallery_unlock') {
      allowed = limits.gallery_unlock_free;
    }

    return Response.json({
      tier,
      limits: {
        unlocks_per_month: limits.unlocks_per_month === Infinity ? 'unlimited' : limits.unlocks_per_month,
        messages_per_month: limits.messages_per_month === Infinity ? 'unlimited' : limits.messages_per_month,
        gallery_unlock_free: limits.gallery_unlock_free,
        priority_search: limits.priority_search,
        see_viewers: limits.see_viewers,
      },
      usage: {
        unlocks_used: unlocksUsed,
        unlocks_remaining: unlocksRemaining,
        messages_used: messagesUsed,
        messages_remaining: messagesRemaining === Infinity ? 'unlimited' : messagesRemaining,
        direct_messages: directMessages,
        community_posts: communityPosts,
      },
      action,
      allowed,
      reason,
    });
  } catch (error) {
    console.error('checkPlanLimits error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});