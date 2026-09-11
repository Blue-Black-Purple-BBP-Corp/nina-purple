import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Pass (reject) a match and conditionally allow a replacement.
//
// - Only works on pending connections where from_user hasn't paid
//   (prevents orphaned pending-payment records from the mutual pay-to-connect flow).
// - Sets status to 'declined' (reuses existing rejection-exclusion in generateMatches
//   — declined connections are skipped in both directions, never resurfaced).
// - Tiered cooldown: if the passed match's score > 60%, the replacement slot
//   refills only once every 30 days. Score <= 60% refills immediately.
//
// The frontend calls generateMatches separately when replacement_allowed is true.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { connection_id } = await req.json();
    if (!connection_id) return Response.json({ error: 'connection_id required' }, { status: 400 });

    // Load the connection via service role so ownership can be verified regardless of RLS.
    const conns = await base44.asServiceRole.entities.Connection.filter({ id: connection_id });
    const conn = conns?.[0];
    if (!conn) return Response.json({ error: 'Connection not found' }, { status: 404 });

    // Only the matcher (from_user) may pass their own connection.
    if (conn.from_user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Mutual pay-to-connect safety ──
    // Only pending connections where from_user hasn't paid can be passed.
    // This prevents orphaned pending-payment records: if from_user already
    // paid (from_unlock_paid) or the connection moved to pending_payment,
    // passing is blocked — the investment stands.
    if (conn.status !== 'pending') {
      return Response.json({
        success: false,
        reason: 'This connection can no longer be passed.',
        code: 'not_passable',
      }, { status: 400 });
    }
    if (conn.from_unlock_paid || conn.is_unlocked) {
      return Response.json({
        success: false,
        reason: 'You have already invested in this connection.',
        code: 'already_invested',
      }, { status: 400 });
    }

    const score = conn.compatibility_score || 0;
    const isHighCompat = score > 60;

    // Mark as declined (generateMatches already skips declined connections in both directions).
    await base44.asServiceRole.entities.Connection.update(conn.id, {
      status: 'declined',
    });

    // Load the user's profile to check/set cooldown.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles?.[0];

    const now = new Date();
    let replacementAllowed = true;
    let cooldownActive = false;
    let cooldownUntil: string | null = null;
    let daysRemaining: number | null = null;

    if (isHighCompat) {
      // Check if a cooldown is currently active.
      const existingCooldown = profile?.high_compat_pass_cooldown_until
        ? new Date(profile.high_compat_pass_cooldown_until)
        : null;

      if (existingCooldown && existingCooldown > now) {
        // Cooldown active — block replacement.
        cooldownActive = true;
        cooldownUntil = existingCooldown.toISOString();
        daysRemaining = Math.ceil((existingCooldown.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        replacementAllowed = false;
      } else {
        // Set a new 30-day cooldown and allow one replacement.
        const cooldownEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        cooldownUntil = cooldownEnd.toISOString();
        daysRemaining = 30;

        if (profile) {
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            high_compat_pass_cooldown_until: cooldownUntil,
          });
        }
        // replacementAllowed stays true — frontend will call generateMatches.
      }
    }
    // Low compat (<= 60%): replacementAllowed stays true, no cooldown set.

    return Response.json({
      success: true,
      declined: true,
      replacement_allowed: replacementAllowed,
      passed_score: score,
      was_high_compat: isHighCompat,
      cooldown: {
        active: cooldownActive,
        until: cooldownUntil,
        days_remaining: daysRemaining,
      },
    });
  } catch (error) {
    console.error('[passConnection] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});