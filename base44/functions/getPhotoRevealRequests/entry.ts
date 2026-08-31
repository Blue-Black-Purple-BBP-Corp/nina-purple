import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Returns the current member's photo-reveal requests: outgoing (as viewer) and
// incoming (as owner). Used by the Wallet page and Home page. Never exposes the
// other party's wallet, payment source, internal notes, or safety flags.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [outgoing, incoming] = await Promise.all([
      base44.asServiceRole.entities.PhotoRevealRequest.filter({ viewer_native_user_id: user.id }),
      base44.asServiceRole.entities.PhotoRevealRequest.filter({ owner_native_user_id: user.id }),
    ]);

    // Sort by requested_at desc.
    const sortFn = (a, b) => new Date(b.requested_at) - new Date(a.requested_at);
    const out = (outgoing || []).sort(sortFn);
    const inc = (incoming || []).sort(sortFn);

    // For incoming, resolve the viewer's display name via getConnectionProfiles-style projection.
    // We keep it minimal: just return the viewer_native_user_id; the UI resolves names.
    return Response.json({
      success: true,
      outgoing: out,
      incoming: inc,
    });
  } catch (error) {
    console.error('[getPhotoRevealRequests] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});