import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS, getPricingForCompatibility, getMonthStart, hasActiveMembership } from '../../shared/planLimits.ts';

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
    const tier = profile?.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;

    // ── Profile unlock ──
    if (action === 'unlock') {
      // Idempotent: already unlocked — return the recorded cost.
      if (conn.is_unlocked) {
        return Response.json({ success: true, already_unlocked: true, unlock_cost_paid: conn.unlock_cost_paid || 0 });
      }

      const score = conn.compatibility_score || 0;
      const pricing = getPricingForCompatibility(score);
      const membershipActive = hasActiveMembership(profile);

      // ── Nina Membership: check free unlock allowance first ──
      if (tier === 'nina_membership' && membershipActive && limits.free_profile_unlocks > 0) {
        const freeUsed = profile.free_profile_unlocks_used || 0;
        if (freeUsed < limits.free_profile_unlocks) {
          await base44.asServiceRole.entities.Connection.update(conn.id, {
            is_unlocked: true,
            unlock_cost_paid: 0,
          });
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            free_profile_unlocks_used: freeUsed + 1,
          });
          return Response.json({ success: true, unlock_cost_paid: 0, free_unlock: true });
        }
        // Free allowance exhausted — fall through to paid pricing below
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
            reason: 'You have reached your monthly profile unlock limit. Upgrade your plan for more unlocks.',
          });
        }
      }

      // Paid unlock — cost from the interaction-pricing table (unchanged)
      await base44.asServiceRole.entities.Connection.update(conn.id, {
        is_unlocked: true,
        unlock_cost_paid: pricing.unlock,
      });

      return Response.json({ success: true, unlock_cost_paid: pricing.unlock });
    }

    // ── Gallery unlock (Galactic-only free perk) ──
    if (action === 'gallery_unlock') {
      if (conn.gallery_unlocked) {
        return Response.json({ success: true, already_unlocked: true });
      }
      if (!limits.gallery_unlock_free) {
        return Response.json({
          success: false,
          reason: 'Gallery unlock is not included in your plan. Upgrade to Galactic for free access.',
        });
      }
      await base44.asServiceRole.entities.Connection.update(conn.id, { gallery_unlocked: true });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('unlockConnection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});