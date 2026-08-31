import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { expirePhotoRevealRequest } from '../../shared/photoAccess.ts';

// Scheduled job: expires photo-reveal requests whose 7-day approval window has
// passed without an owner response. Releases the held BBP Credits and sets a
// 30-day cooldown. Called by the "Expire Photo Reveal Requests" workflow.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    // Find all requests still pending past their expires_at.
    const allPending = await base44.asServiceRole.entities.PhotoRevealRequest.filter({
      request_status: 'pending_owner_approval',
    });
    const expired = [];
    for (const r of allPending) {
      if (r.expires_at && new Date(r.expires_at) < now) {
        try {
          await expirePhotoRevealRequest(base44, r);
          expired.push(r.request_id);
        } catch (e) {
          console.warn('[expirePhotoRevealRequests] failed for', r.request_id, e?.message || e);
        }
      }
    }

    return Response.json({ success: true, expired_count: expired.length, expired_ids: expired });
  } catch (error) {
    console.error('[expirePhotoRevealRequests] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});