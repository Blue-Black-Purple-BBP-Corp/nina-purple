import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import {
  getActiveEntitlement, getActiveOwnerPhotos, signPhotoUrl, writePhotoAudit, isBlocked,
} from '../../shared/photoAccess.ts';
import { getActivePrivilegedSession, checkConflictOfInterest } from '../../shared/staffAuth.ts';

// Authorized photo delivery. Returns short-lived signed URLs for an owner's
// active photos ONLY when the caller is:
//   1. the owner (self-access), or
//   2. a viewer with an active PhotoRevealEntitlement for that owner, or
//   3. staff operating in an active privileged (trust_safety/admin) session
//      with no conflict of interest.
// Never returns storage URIs, raw public URLs, or long-lived URLs. Every
// request is audited. Blocks, moderation, and account-status checks apply.
//
// Accepts owner_user_ids: string[] (batch) and returns a map of results.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ownerIds: string[] = Array.isArray(body.owner_user_ids)
      ? body.owner_user_ids
      : (body.owner_user_id ? [body.owner_user_id] : []);
    if (!ownerIds.length) return Response.json({ results: {} });

    const results: Record<string, any> = {};

    for (const ownerId of ownerIds) {
      const correlation_id = crypto.randomUUID();

      // ── Owner self-access ──
      if (user.id === ownerId) {
        const photos = await getActiveOwnerPhotos(base44, user.id);
        const signed = await Promise.all(photos.map(async (p) => ({
          photo_id: p.photo_id,
          is_primary: p.is_primary,
          sort_order: p.sort_order,
          signed_url: await signPhotoUrl(base44, p.storage_uri),
        })));
        await writePhotoAudit(base44, {
          viewer_native_user_id: user.id, owner_native_user_id: user.id,
          access_result: 'owner_access', correlation_id,
        });
        results[ownerId] = { access_result: 'owner_access', photos: signed };
        continue;
      }

      // ── Block check ──
      if (await isBlocked(base44, user.id, ownerId)) {
        await writePhotoAudit(base44, {
          viewer_native_user_id: user.id, owner_native_user_id: ownerId,
          access_result: 'blocked', correlation_id,
        });
        results[ownerId] = { access_result: 'blocked', photos: [] };
        continue;
      }

      // ── Owner account-status check ──
      const ownerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: ownerId });
      const ownerProfile = ownerProfiles[0];
      if (ownerProfile?.account_status === 'permanently_removed') {
        await writePhotoAudit(base44, {
          viewer_native_user_id: user.id, owner_native_user_id: ownerId,
          access_result: 'denied', correlation_id,
        });
        results[ownerId] = { access_result: 'denied', photos: [] };
        continue;
      }

      // ── Active entitlement ──
      const entitlement = await getActiveEntitlement(base44, user.id, ownerId);
      if (entitlement) {
        const photos = await getActiveOwnerPhotos(base44, ownerId);
        const signed = await Promise.all(photos.map(async (p) => ({
          photo_id: p.photo_id,
          is_primary: p.is_primary,
          sort_order: p.sort_order,
          signed_url: await signPhotoUrl(base44, p.storage_uri),
        })));
        await writePhotoAudit(base44, {
          viewer_native_user_id: user.id, owner_native_user_id: ownerId,
          entitlement_id: entitlement.entitlement_id,
          access_result: 'allowed', source_type: entitlement.source_type, correlation_id,
        });
        results[ownerId] = { access_result: 'allowed', photos: signed, source_type: entitlement.source_type };
        continue;
      }

      // ── Staff privileged access (member mode must NOT bypass) ──
      const privSession = await getActivePrivilegedSession(base44, user.id);
      if (privSession && (privSession.operating_context === 'trust_safety' || privSession.operating_context === 'admin')) {
        const coi = await checkConflictOfInterest(base44, user.id, ownerId);
        if (coi.conflict) {
          await writePhotoAudit(base44, {
            viewer_native_user_id: user.id, owner_native_user_id: ownerId,
            access_result: 'denied', correlation_id,
          });
          results[ownerId] = { access_result: 'denied', photos: [], reason: 'conflict_of_interest' };
          continue;
        }
        const photos = await getActiveOwnerPhotos(base44, ownerId);
        const signed = await Promise.all(photos.map(async (p) => ({
          photo_id: p.photo_id,
          is_primary: p.is_primary,
          sort_order: p.sort_order,
          signed_url: await signPhotoUrl(base44, p.storage_uri),
        })));
        await writePhotoAudit(base44, {
          viewer_native_user_id: user.id, owner_native_user_id: ownerId,
          privileged_session_id: privSession.privileged_session_id,
          access_result: 'staff_access', correlation_id,
        });
        results[ownerId] = { access_result: 'staff_access', photos: signed };
        continue;
      }

      // ── No entitlement ──
      await writePhotoAudit(base44, {
        viewer_native_user_id: user.id, owner_native_user_id: ownerId,
        access_result: 'missing_entitlement', correlation_id,
      });
      results[ownerId] = { access_result: 'missing_entitlement', photos: [] };
    }

    return Response.json({ results });
  } catch (error) {
    console.error('[getPhotoAccess] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});