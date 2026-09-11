import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Peer vouch: one member confirms another is a real person.
//   method "event"   — both attended the same event (EventAttendance cross-checked).
//   method "contact" — voucher knows the vouched-for member's email or phone.
//
// The vouched-for member is resolved by vouched_for_user_id, contact_email
// (User entity lookup), or contact_phone (UserProfile lookup).
// Self-vouching and duplicate vouches are rejected.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { method, event_id, contact_email, contact_phone, vouched_for_user_id } = body;

    if (!method || !['event', 'contact'].includes(method)) {
      return Response.json({ error: 'method must be "event" or "contact"' }, { status: 400 });
    }

    // ── Resolve the vouched-for user ──
    let targetUserId = vouched_for_user_id;

    if (!targetUserId) {
      if (contact_email) {
        const users = await base44.asServiceRole.entities.User.filter({ email: contact_email });
        if (!users.length) {
          return Response.json({ error: 'No member found with that email' }, { status: 404 });
        }
        targetUserId = users[0].id;
      } else if (contact_phone) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ phone: contact_phone });
        if (!profiles.length) {
          return Response.json({ error: 'No member found with that phone number' }, { status: 404 });
        }
        targetUserId = profiles[0].user_id;
      } else {
        return Response.json({ error: 'Provide vouched_for_user_id, contact_email, or contact_phone' }, { status: 400 });
      }
    }

    // Prevent self-vouching
    if (targetUserId === user.id) {
      return Response.json({ error: 'You cannot vouch for yourself' }, { status: 400 });
    }

    // ── Event method: cross-check both attended ──
    if (method === 'event') {
      if (!event_id) {
        return Response.json({ error: 'event_id is required for event method' }, { status: 400 });
      }
      const [myAttendance, theirAttendance] = await Promise.all([
        base44.asServiceRole.entities.EventAttendance.filter({
          event_id, native_user_id: user.id, attendance_status: 'attended',
        }),
        base44.asServiceRole.entities.EventAttendance.filter({
          event_id, native_user_id: targetUserId, attendance_status: 'attended',
        }),
      ]);
      if (!myAttendance.length) {
        return Response.json({ error: 'You must have attended this event to vouch' }, { status: 403 });
      }
      if (!theirAttendance.length) {
        return Response.json({ error: 'That member did not attend this event' }, { status: 403 });
      }
    }

    // ── Prevent duplicate vouches ──
    const existing = await base44.asServiceRole.entities.PeerVouch.filter({
      voucher_user_id: user.id,
      vouched_for_user_id: targetUserId,
    });
    if (existing.length) {
      return Response.json({ error: 'You have already vouched for this member' }, { status: 409 });
    }

    // ── Create the vouch ──
    await base44.asServiceRole.entities.PeerVouch.create({
      voucher_user_id: user.id,
      vouched_for_user_id: targetUserId,
      method,
      event_id: method === 'event' ? event_id : null,
      vouched_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[submitPeerVouch] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});