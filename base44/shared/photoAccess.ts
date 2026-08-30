// Shared photo-access + entitlement logic. Imported by getPhotoAccess,
// unlockConnection, revealPhotos, migratePhotosToPrivate, and stripeWebhook.
//
// PRIVACY MODEL:
//   - All photos live in private storage (UploadPrivateFile). The storage_uri
//     is never sent to a non-owner client. Photos are delivered only as
//     short-lived signed URLs (CreateFileSignedUrl) after authorization.
//   - Authorization = owner self-access OR an active viewer-specific
//     profile-level PhotoRevealEntitlement, subject to blocks/moderation.
//   - The legacy owner-controlled photos_private toggle is retired — paid
//     reveal is a server-side invariant.

export const SIGNED_URL_EXPIRES_SECONDS = 300; // 5 minutes
export const GALACTIC_REVEAL_ALLOWANCE = 3; // photo-profile reveals per billing month
export const MAX_PHOTOS_PER_OWNER = 6;

export async function getOwnerBbpMemberId(base44: any, native_user_id: string): Promise<string | null> {
  try {
    const eng = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id });
    return eng[0]?.bbp_member_id || null;
  } catch (e) {
    console.error("[photoAccess] getOwnerBbpMemberId error:", e?.message || e);
    return null;
  }
}

// Returns the viewer's active entitlement for an owner, or null.
export async function getActiveEntitlement(base44: any, viewer_id: string, owner_id: string) {
  try {
    const ents = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({
      viewer_native_user_id: viewer_id,
      owner_native_user_id: owner_id,
    });
    return ents.find((e) => e.status === "active") || null;
  } catch (e) {
    console.error("[photoAccess] getActiveEntitlement error:", e?.message || e);
    return null;
  }
}

// Returns active Photo records for an owner, ordered by sort_order.
export async function getActiveOwnerPhotos(base44: any, owner_id: string) {
  try {
    const photos = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: owner_id });
    return photos
      .filter((p) => p.status === "active")
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  } catch (e) {
    console.error("[photoAccess] getActiveOwnerPhotos error:", e?.message || e);
    return [];
  }
}

// Creates/activates an entitlement for a viewer→owner pair. Supersedes any
// existing active entitlement (sets it to 'superseded'). Idempotent: if an
// active entitlement with the same source_type already exists, returns it.
export async function grantEntitlement(
  base44: any,
  opts: {
    viewer_id: string;
    owner_id: string;
    source_type: string;
    source_connection_id?: string;
    source_transaction_id?: string;
    correlation_id?: string;
  }
) {
  const { viewer_id, owner_id, source_type, source_connection_id, source_transaction_id, correlation_id } = opts;
  const viewerBbp = await getOwnerBbpMemberId(base44, viewer_id);
  const ownerBbp = await getOwnerBbpMemberId(base44, owner_id);
  const existing = await getActiveEntitlement(base44, viewer_id, owner_id);
  if (existing && existing.source_type === source_type) {
    return { entitlement: existing, created: false };
  }
  if (existing) {
    await base44.asServiceRole.entities.PhotoRevealEntitlement.update(existing.id, {
      status: "superseded",
      revoked_at: new Date().toISOString(),
      revocation_reason: "superseded",
    });
  }
  const entitlement_id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const entitlement = await base44.asServiceRole.entities.PhotoRevealEntitlement.create({
    entitlement_id,
    viewer_native_user_id: viewer_id,
    viewer_bbp_member_id: viewerBbp,
    owner_native_user_id: owner_id,
    owner_bbp_member_id: ownerBbp,
    scope: "profile",
    source_type,
    source_transaction_id: source_transaction_id || null,
    source_connection_id: source_connection_id || null,
    status: "active",
    granted_at: now,
  });
  await writePhotoAudit(base44, {
    viewer_native_user_id: viewer_id,
    viewer_bbp_member_id: viewerBbp,
    owner_native_user_id: owner_id,
    owner_bbp_member_id: ownerBbp,
    entitlement_id,
    access_result: "entitlement_created",
    source_type,
    correlation_id: correlation_id || entitlement_id,
  });
  return { entitlement, created: true };
}

// Revokes an active entitlement (refund / block / moderation / fraud).
export async function revokeEntitlement(base44: any, viewer_id: string, owner_id: string, reason: string, correlation_id?: string) {
  const ent = await getActiveEntitlement(base44, viewer_id, owner_id);
  if (!ent) return null;
  const status = reason === "refund" ? "refunded" : reason === "block" ? "blocked" : "revoked";
  await base44.asServiceRole.entities.PhotoRevealEntitlement.update(ent.id, {
    status,
    revoked_at: new Date().toISOString(),
    revocation_reason: reason,
  });
  await writePhotoAudit(base44, {
    viewer_native_user_id: viewer_id,
    owner_native_user_id: owner_id,
    entitlement_id: ent.entitlement_id,
    access_result: "entitlement_revoked",
    source_type: ent.source_type,
    correlation_id: correlation_id || ent.entitlement_id,
  });
  return ent;
}

// Writes a PhotoAccessAudit record. Never logs URLs, content, tokens, or codes.
export async function writePhotoAudit(base44: any, entry: {
  viewer_native_user_id?: string;
  viewer_bbp_member_id?: string;
  owner_native_user_id?: string;
  owner_bbp_member_id?: string;
  photo_id?: string;
  entitlement_id?: string;
  access_result: string;
  source_type?: string;
  correlation_id?: string;
}): Promise<void> {
  try {
    await base44.asServiceRole.entities.PhotoAccessAudit.create({
      audit_id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      viewer_native_user_id: entry.viewer_native_user_id || null,
      viewer_bbp_member_id: entry.viewer_bbp_member_id || null,
      owner_native_user_id: entry.owner_native_user_id || null,
      owner_bbp_member_id: entry.owner_bbp_member_id || null,
      photo_id: entry.photo_id || null,
      entitlement_id: entry.entitlement_id || null,
      access_result: entry.access_result,
      access_at: new Date().toISOString(),
      source_type: entry.source_type || null,
      correlation_id: entry.correlation_id || ((typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
    });
  } catch (e) {
    console.error("[photoAccess] audit write failed:", e?.message || e);
  }
}

// Returns a short-lived signed URL for a private storage URI.
export async function signPhotoUrl(base44: any, storage_uri: string): Promise<string | null> {
  try {
    const res = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: storage_uri,
      expires_in: SIGNED_URL_EXPIRES_SECONDS,
    });
    return res?.signed_url || null;
  } catch (e) {
    console.error("[photoAccess] sign url failed:", e?.message || e);
    return null;
  }
}

// Checks whether a block exists between two users (either direction).
export async function isBlocked(base44: any, user_a: string, user_b: string): Promise<boolean> {
  try {
    const [outgoing, incoming] = await Promise.all([
      base44.asServiceRole.entities.Connection.filter({ from_user_id: user_a, to_user_id: user_b }),
      base44.asServiceRole.entities.Connection.filter({ from_user_id: user_b, to_user_id: user_a }),
    ]);
    return [...outgoing, ...incoming].some((c) => c.status === "blocked");
  } catch (e) {
    console.error("[photoAccess] isBlocked error:", e?.message || e);
    return false;
  }
}