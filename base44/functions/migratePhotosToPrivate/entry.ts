import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import {
  getOwnerBbpMemberId, grantEntitlement, writePhotoAudit,
} from '../../shared/photoAccess.ts';

// BATCH MIGRATION — copies legacy public photos (UserProfile.photos[]) into
// private storage and creates authoritative Photo records, then backfills
// PhotoRevealEntitlements for existing paid reveals (Connection.is_unlocked)
// and Galactic gallery unlocks (Connection.gallery_unlocked).
//
// IDEMPOTENT: re-running skips photos/entitlements already migrated (matched
// by legacy_public_url / viewer+owner pair). REVERSIBLE: the legacy
// UserProfile.photos[] array and Connection flags are NOT modified or deleted,
// so legacy delivery can be re-enabled by reverting getConnectionProfiles.
// The Photo.legacy_public_url field is the rollback pointer.
//
// Processes up to `limit` profiles per call (default 50). Re-run until
// `remaining` is 0. Returns a summary for validation.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 200);

    // ── Phase 1: Migrate photos ──
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 1000);
    const profilesToMigrate = allProfiles.filter((p) => Array.isArray(p.photos) && p.photos.length > 0);
    const batch = profilesToMigrate.slice(0, limit);

    let photosMigrated = 0;
    let photosSkipped = 0;
    let photosFailed = 0;
    const failures: string[] = [];

    for (const profile of batch) {
      const ownerId = profile.user_id;
      const ownerBbp = await getOwnerBbpMemberId(base44, ownerId);
      const existingPhotos = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: ownerId });
      const existingUrls = new Set(existingPhotos.map((p) => p.legacy_public_url).filter(Boolean));

      for (let i = 0; i < profile.photos.length; i++) {
        const publicUrl = profile.photos[i];
        if (!publicUrl || existingUrls.has(publicUrl)) { photosSkipped++; continue; }

        try {
          // Fetch the public asset and re-upload to private storage.
          const resp = await fetch(publicUrl);
          if (!resp.ok) throw new Error(`fetch ${resp.status}`);
          const blob = await resp.blob();
          // The SDK triggers multipart only for File instances (not Blob).
          const file = new File([blob], `photo_${ownerId}_${i}.jpg`, { type: blob.type || 'image/jpeg' });
          const upRes = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
          const privateUri = upRes?.file_uri;
          if (!privateUri) throw new Error('no file_uri returned');

          const photo_id = crypto.randomUUID();
          await base44.asServiceRole.entities.Photo.create({
            photo_id,
            owner_native_user_id: ownerId,
            owner_bbp_member_id: ownerBbp,
            storage_uri: privateUri,
            legacy_public_url: publicUrl,
            status: 'active',
            is_primary: i === 0,
            sort_order: i,
            uploaded_at: profile.created_date || new Date().toISOString(),
            migration_source: 'batch_migration',
            migrated_at: new Date().toISOString(),
          });
          photosMigrated++;
        } catch (photoErr) {
          console.error(`[migratePhotosToPrivate] photo ${i} for user ${ownerId} failed:`, photoErr.message);
          photosFailed++;
          failures.push(`${ownerId}:${i}:${photoErr.message}`);
        }
      }
    }

    // ── Phase 2: Backfill entitlements for existing paid reveals ──
    const allConns = await base44.asServiceRole.entities.Connection.list('-created_date', 1000);
    let entitlementsCreated = 0;
    let entitlementsSkipped = 0;

    for (const conn of allConns) {
      const viewerId = conn.from_user_id;
      const ownerId = conn.to_user_id;

      // Paid unlock → paid_credit entitlement
      if (conn.is_unlocked) {
        const existing = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({
          viewer_native_user_id: viewerId, owner_native_user_id: ownerId,
        });
        if (existing.some((e) => e.status === 'active')) {
          entitlementsSkipped++;
        } else {
          await grantEntitlement(base44, {
            viewer_id: viewerId, owner_id: ownerId,
            source_type: 'paid_credit', source_connection_id: conn.id,
            source_transaction_id: conn.id,
            correlation_id: `migration-unlock-${conn.id}`,
          });
          entitlementsCreated++;
        }
      }

      // Galactic gallery unlock → subscription_perk entitlement
      if (conn.gallery_unlocked && !conn.is_unlocked) {
        const existing = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({
          viewer_native_user_id: viewerId, owner_native_user_id: ownerId,
        });
        if (existing.some((e) => e.status === 'active')) {
          entitlementsSkipped++;
        } else {
          await grantEntitlement(base44, {
            viewer_id: viewerId, owner_id: ownerId,
            source_type: 'subscription_perk', source_connection_id: conn.id,
            correlation_id: `migration-gallery-${conn.id}`,
          });
          entitlementsCreated++;
        }
      }
    }

    const remaining = profilesToMigrate.length - batch.length;
    return Response.json({
      success: true,
      summary: {
        profiles_scanned: profilesToMigrate.length,
        profiles_processed: batch.length,
        photos_migrated: photosMigrated,
        photos_skipped_already: photosSkipped,
        photos_failed: photosFailed,
        entitlements_created: entitlementsCreated,
        entitlements_skipped_already: entitlementsSkipped,
        remaining_profiles: remaining,
        failures: failures.slice(0, 20),
      },
    });
  } catch (error) {
    console.error('[migratePhotosToPrivate] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});