import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { getOwnerBbpMemberId, writePhotoAudit, MAX_PHOTOS_PER_OWNER } from '../../shared/photoAccess.ts';

// Owner photo upload. The client uploads the binary to private storage via
// base44.integrations.Core.UploadPrivateFile (returns { file_uri }), then
// calls this function with the private file_uri. This function creates the
// authoritative Photo record server-side so the record is authenticated and
// the owner is derived from the session (never client-supplied).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_uri } = await req.json().catch(() => ({}));
    if (!file_uri) return Response.json({ error: 'file_uri required' }, { status: 400 });

    // Account-status guard: suspended/removed members cannot upload.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (profile?.account_status === 'suspended' || profile?.account_status === 'permanently_removed') {
      return Response.json({ error: 'Account is not permitted to upload photos.' }, { status: 403 });
    }

    // Enforce max photos per owner.
    const existing = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: user.id });
    const activeCount = existing.filter((p) => p.status === 'active').length;
    if (activeCount >= MAX_PHOTOS_PER_OWNER) {
      return Response.json({ error: `Maximum of ${MAX_PHOTOS_PER_OWNER} photos allowed.` }, { status: 400 });
    }

    const bbpMemberId = await getOwnerBbpMemberId(base44, user.id);
    const photo_id = crypto.randomUUID();
    const now = new Date().toISOString();
    const isPrimary = activeCount === 0; // first photo becomes primary
    const sortOrder = existing.length; // append at end

    await base44.asServiceRole.entities.Photo.create({
      photo_id,
      owner_native_user_id: user.id,
      owner_bbp_member_id: bbpMemberId,
      storage_uri: file_uri,
      status: 'active',
      is_primary: isPrimary,
      sort_order: sortOrder,
      uploaded_at: now,
      migration_source: 'upload',
    });

    await writePhotoAudit(base44, {
      viewer_native_user_id: user.id, owner_native_user_id: user.id,
      photo_id, access_result: 'photo_uploaded', correlation_id: photo_id,
    });

    return Response.json({ success: true, photo_id, is_primary: isPrimary });
  } catch (error) {
    console.error('[uploadPhoto] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});