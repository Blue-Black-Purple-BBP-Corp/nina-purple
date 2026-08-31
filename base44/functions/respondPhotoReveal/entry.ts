import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { approvePhotoRevealRequest, declinePhotoRevealRequest } from '../../shared/photoAccess.ts';

// Owner responds to a photo-reveal request. Approve converts the held credits
// to a debit and creates a viewer-specific PhotoRevealEntitlement. Decline
// releases the held credits and sets a 30-day cooldown. The owner never sees
// the viewer's wallet balance, payment source, or internal notes.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { request_id, decision } = await req.json().catch(() => ({}));
    if (!request_id) return Response.json({ error: 'request_id required' }, { status: 400 });
    if (decision !== 'approve' && decision !== 'decline') {
      return Response.json({ error: 'decision must be approve or decline' }, { status: 400 });
    }

    if (decision === 'approve') {
      const result = await approvePhotoRevealRequest(base44, { request_id, owner_id: user.id });
      if (!result.success) {
        return Response.json({ success: false, reason: result.reason, detail: result.detail }, { status: 400 });
      }
      return Response.json({
        success: true,
        request_id,
        entitlement_id: result.entitlement_id,
        message: 'Photos revealed. The member now has access to your private photos through Nina Purple.',
      });
    } else {
      const result = await declinePhotoRevealRequest(base44, { request_id, owner_id: user.id });
      if (!result.success) {
        return Response.json({ success: false, reason: result.reason }, { status: 400 });
      }
      return Response.json({
        success: true,
        request_id,
        message: 'This photo reveal request was not approved. No BBP Credits were used.',
      });
    }
  } catch (error) {
    console.error('[respondPhotoReveal] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});