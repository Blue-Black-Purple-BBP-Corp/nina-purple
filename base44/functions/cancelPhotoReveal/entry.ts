import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { cancelPhotoRevealRequest } from '../../shared/photoAccess.ts';

// Viewer cancels their own pending photo-reveal request. Releases the held
// credits and sets a 30-day cooldown for the same viewer->owner pair.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { request_id } = await req.json().catch(() => ({}));
    if (!request_id) return Response.json({ error: 'request_id required' }, { status: 400 });

    const result = await cancelPhotoRevealRequest(base44, { request_id, viewer_id: user.id });
    if (!result.success) {
      return Response.json({ success: false, reason: result.reason }, { status: 400 });
    }
    return Response.json({
      success: true,
      request_id,
      message: 'Your photo reveal request was cancelled. Reserved BBP Credits were released.',
    });
  } catch (error) {
    console.error('[cancelPhotoReveal] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});