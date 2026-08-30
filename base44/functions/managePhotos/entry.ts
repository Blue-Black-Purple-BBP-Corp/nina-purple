import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { writePhotoAudit } from '../../shared/photoAccess.ts';

// Owner photo management: remove, reorder. All actions verify ownership
// server-side. Removed photos stay as records (status=removed) for audit;
// they are no longer delivered. Reorder sets sort_order and is_primary
// (position 0 = primary) for the owner's active photos.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── Remove ──
    if (action === 'remove') {
      const { photo_id } = body;
      if (!photo_id) return Response.json({ error: 'photo_id required' }, { status: 400 });
      const photos = await base44.asServiceRole.entities.Photo.filter({ photo_id });
      const photo = photos[0];
      if (!photo) return Response.json({ error: 'Photo not found' }, { status: 404 });
      if (photo.owner_native_user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

      await base44.asServiceRole.entities.Photo.update(photo.id, {
        status: 'removed',
        removed_at: new Date().toISOString(),
      });

      // If the removed photo was primary, promote the next active photo.
      if (photo.is_primary) {
        const remaining = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: user.id });
        const active = remaining
          .filter((p) => p.status === 'active' && p.photo_id !== photo_id)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        if (active[0]) {
          await base44.asServiceRole.entities.Photo.update(active[0].id, { is_primary: true, sort_order: 0 });
        }
      }

      await writePhotoAudit(base44, {
        viewer_native_user_id: user.id, owner_native_user_id: user.id,
        photo_id, access_result: 'photo_removed', correlation_id: photo_id,
      });
      return Response.json({ success: true });
    }

    // ── Reorder ──
    if (action === 'reorder') {
      const { photo_ids } = body; // new full order of active photo_ids
      if (!Array.isArray(photo_ids)) return Response.json({ error: 'photo_ids array required' }, { status: 400 });
      const all = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: user.id });
      const byId = new Map(all.map((p) => [p.photo_id, p]));
      for (let i = 0; i < photo_ids.length; i++) {
        const p = byId.get(photo_ids[i]);
        if (p && p.owner_native_user_id === user.id && p.status === 'active') {
          await base44.asServiceRole.entities.Photo.update(p.id, {
            sort_order: i,
            is_primary: i === 0,
          });
        }
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[managePhotos] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});