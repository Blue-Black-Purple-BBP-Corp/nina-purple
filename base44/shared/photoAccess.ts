// Shared photo-access + entitlement + reveal-request logic. Imported by
// getPhotoAccess, unlockConnection, requestPhotoReveal, respondPhotoReveal,
// cancelPhotoReveal, getPhotoRevealRequests, migratePhotosToPrivate, and
// stripeWebhook.
//
// PRIVACY MODEL:
//   - All photos live in private storage (UploadPrivateFile). The storage_uri
//     is never sent to a non-owner client. Photos are delivered only as
//     short-lived signed URLs (CreateFileSignedUrl) after authorization.
//   - Authorization = owner self-access OR an active viewer-specific
//     profile-level PhotoRevealEntitlement, subject to blocks/moderation.
//   - NEW (owner-approval policy): a PhotoRevealEntitlement with
//     approval_policy_version='owner_approval_required' is only active if it
//     links to an approved PhotoRevealRequest. Legacy entitlements
//     (approval_policy_version='legacy_auto_grant') remain active without a
//     request (grandfathered).
//   - The legacy owner-controlled photos_private toggle is retired — paid
//     reveal is a server-side invariant.

export const SIGNED_URL_EXPIRES_SECONDS = 300; // 5 minutes
export const GALACTIC_REVEAL_ALLOWANCE = 3; // legacy Galactic perk (retained for existing subscribers)
export const MAX_PHOTOS_PER_OWNER = 6;

// Photo-reveal owner-approval policy constants.
export const PHOTO_REVEAL_COST_BBP = 10; // flat BBP Credit price per photo-reveal request
export const APPROVAL_EXPIRY_DAYS = 7;   // owner has 7 days to respond
export const COOLDOWN_DAYS = 30;         // 30-day cooldown after decline/expiry/cancel

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

// Creates/activates an entitlement for a viewer->owner pair. Supersedes any
// existing active entitlement. Idempotent: if an active entitlement with the
// same source_type already exists, returns it.
export async function grantEntitlement(
  base44: any,
  opts: {
    viewer_id: string;
    owner_id: string;
    source_type: string;
    source_connection_id?: string;
    source_transaction_id?: string;
    correlation_id?: string;
    approval_policy_version?: string;
    request_id?: string;
  }
) {
  const { viewer_id, owner_id, source_type, source_connection_id, source_transaction_id, correlation_id, approval_policy_version = 'owner_approval_required', request_id } = opts;
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
    request_id: request_id || null,
    approval_policy_version,
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

// Revokes an active entitlement (refund / block / moderation / fraud / owner).
export async function revokeEntitlement(base44: any, viewer_id: string, owner_id: string, reason: string, correlation_id?: string) {
  const ent = await getActiveEntitlement(base44, viewer_id, owner_id);
  if (!ent) return null;
  const status = reason === "refund" ? "refunded" : reason === "block" ? "blocked" : reason === "moderation" ? "under_review" : reason === "owner_revoked" ? "revoked" : "revoked";
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

// Bulk-update a viewer's active entitlements to a given status. Used by
// webhook-driven membership state changes. Never deletes entitlement history.
export async function setViewerEntitlementsStatus(base44: any, viewer_id: string, newStatus: string, reason: string) {
  try {
    const ents = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({ viewer_native_user_id: viewer_id });
    const active = ents.filter((e) => e.status === "active");
    for (const e of active) {
      await base44.asServiceRole.entities.PhotoRevealEntitlement.update(e.id, {
        status: newStatus,
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      });
    }
    return active.length;
  } catch (e) {
    console.error("[photoAccess] setViewerEntitlementsStatus error:", e?.message || e);
    return 0;
  }
}

// Reactivate entitlements that were inactive_due_to_membership.
export async function reactivateViewerEntitlements(base44: any, viewer_id: string) {
  try {
    const ents = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({ viewer_native_user_id: viewer_id });
    const inactive = ents.filter((e) => e.status === "inactive_due_to_membership");
    for (const e of inactive) {
      await base44.asServiceRole.entities.PhotoRevealEntitlement.update(e.id, {
        status: "active",
        revoked_at: null,
        revocation_reason: "reactivated",
      });
    }
    return inactive.length;
  } catch (e) {
    console.error("[photoAccess] reactivateViewerEntitlements error:", e?.message || e);
    return 0;
  }
}

// ── PHOTO REVEAL REQUEST LIFECYCLE ──

// Check whether a viewer->owner pair has an active pending request or an
// unexpired cooldown. Returns { blocked, reason, pendingRequest?, cooldownUntil? }.
export async function checkRevealEligibility(base44: any, viewer_id: string, owner_id: string) {
  try {
    const reqs = await base44.asServiceRole.entities.PhotoRevealRequest.filter({
      viewer_native_user_id: viewer_id,
      owner_native_user_id: owner_id,
    });
    const now = new Date();
    // Pending request blocks a duplicate.
    const pending = reqs.find((r) =>
      ['initiated', 'payment_authorized', 'pending_owner_approval'].includes(r.request_status)
    );
    if (pending) {
      return { blocked: true, reason: 'pending_request_exists', pendingRequest: pending };
    }
    // Active cooldown blocks a new request.
    const cooldown = reqs.find((r) =>
      r.cooldown_until && new Date(r.cooldown_until) > now &&
      ['declined', 'expired', 'cancelled'].includes(r.request_status)
    );
    if (cooldown) {
      return { blocked: true, reason: 'cooldown_active', cooldownUntil: cooldown.cooldown_until };
    }
    return { blocked: false };
  } catch (e) {
    console.error("[photoAccess] checkRevealEligibility error:", e?.message || e);
    return { blocked: false };
  }
}

// Create a photo-reveal request (viewer-initiated). Does NOT debit — the caller
// must have already reserved credits via holdCredits. Returns the request.
export async function createPhotoRevealRequest(base44: any, opts: {
  viewer_id: string;
  owner_id: string;
  quoted_price: number;
  reservation_id: string;
  ledger_hold_id: string;
  correlation_id?: string;
}) {
  const { viewer_id, owner_id, quoted_price, reservation_id, ledger_hold_id, correlation_id } = opts;
  const viewerBbp = await getOwnerBbpMemberId(base44, viewer_id);
  const ownerBbp = await getOwnerBbpMemberId(base44, owner_id);

  // Resolve owner's profile_id.
  let profile_id = null;
  try {
    const ownerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: owner_id });
    profile_id = ownerProfiles[0]?.id || null;
  } catch {}

  const request_id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const now = new Date();
  const expires_at = new Date(now.getTime() + APPROVAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const request = await base44.asServiceRole.entities.PhotoRevealRequest.create({
    request_id,
    viewer_native_user_id: viewer_id,
    viewer_bbp_member_id: viewerBbp,
    owner_native_user_id: owner_id,
    owner_bbp_member_id: ownerBbp,
    profile_id,
    request_status: 'pending_owner_approval',
    quoted_price_bbp_credits: quoted_price,
    reservation_id,
    ledger_hold_id,
    approval_policy_version: 'owner_approval_required',
    requested_at: now.toISOString(),
    expires_at,
    correlation_id: correlation_id || request_id,
  });

  await writePhotoAudit(base44, {
    viewer_native_user_id: viewer_id,
    owner_native_user_id: owner_id,
    access_result: 'entitlement_created',
    source_type: 'photo_reveal_request',
    correlation_id: correlation_id || request_id,
  });

  return request;
}

// Owner approves a request: convert hold to debit + grant entitlement.
export async function approvePhotoRevealRequest(base44: any, opts: {
  request_id: string;
  owner_id: string;
}) {
  const { request_id, owner_id } = opts;
  const reqs = await base44.asServiceRole.entities.PhotoRevealRequest.filter({ request_id });
  const req = reqs[0];
  if (!req) return { success: false, reason: 'request_not_found' };
  if (req.owner_native_user_id !== owner_id) return { success: false, reason: 'not_owner' };
  if (req.request_status !== 'pending_owner_approval') return { success: false, reason: 'not_pending' };

  // Check expiry.
  if (req.expires_at && new Date(req.expires_at) < new Date()) {
    return { success: false, reason: 'expired' };
  }

  const now = new Date().toISOString();

  // Convert the hold to a debit.
  const { convertHoldToDebit } = await import('./interactionCredits.ts');
  const convert = await convertHoldToDebit(base44, {
    native_user_id: req.viewer_native_user_id,
    reservation_id: req.reservation_id,
    description: `Photo reveal approved — ${req.quoted_price_bbp_credits} BBP Credits`,
    idempotency_key: `convert-${req.request_id}`,
    correlation_id: req.correlation_id || req.request_id,
  });
  if (!convert.success) {
    return { success: false, reason: 'convert_failed', detail: convert.reason };
  }

  // Grant the entitlement (owner_approval_required, linked to request).
  const { entitlement } = await grantEntitlement(base44, {
    viewer_id: req.viewer_native_user_id,
    owner_id: req.owner_native_user_id,
    source_type: 'paid_credit',
    source_transaction_id: req.request_id,
    approval_policy_version: 'owner_approval_required',
    request_id: req.request_id,
    correlation_id: req.correlation_id || req.request_id,
  });

  // Update the request.
  await base44.asServiceRole.entities.PhotoRevealRequest.update(req.id, {
    request_status: 'approved',
    owner_responded_at: now,
    approved_at: now,
    ledger_debit_id: convert.ledger_id,
    entitlement_id: entitlement.entitlement_id,
  });

  return { success: true, entitlement_id: entitlement.entitlement_id, request_id };
}

// Owner declines a request: release hold, set cooldown.
export async function declinePhotoRevealRequest(base44: any, opts: {
  request_id: string;
  owner_id: string;
}) {
  const { request_id, owner_id } = opts;
  const reqs = await base44.asServiceRole.entities.PhotoRevealRequest.filter({ request_id });
  const req = reqs[0];
  if (!req) return { success: false, reason: 'request_not_found' };
  if (req.owner_native_user_id !== owner_id) return { success: false, reason: 'not_owner' };
  if (req.request_status !== 'pending_owner_approval') return { success: false, reason: 'not_pending' };

  const now = new Date();
  const cooldown_until = new Date(now.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Release the held credits.
  const { releaseHold } = await import('./interactionCredits.ts');
  await releaseHold(base44, {
    native_user_id: req.viewer_native_user_id,
    reservation_id: req.reservation_id,
    reason: 'owner_declined',
    idempotency_key: `release-${req.request_id}`,
    correlation_id: req.correlation_id || req.request_id,
  });

  await base44.asServiceRole.entities.PhotoRevealRequest.update(req.id, {
    request_status: 'declined',
    owner_responded_at: now.toISOString(),
    declined_at: now.toISOString(),
    cooldown_until,
  });

  return { success: true, request_id };
}

// Viewer cancels a pending request: release hold, set cooldown.
export async function cancelPhotoRevealRequest(base44: any, opts: {
  request_id: string;
  viewer_id: string;
}) {
  const { request_id, viewer_id } = opts;
  const reqs = await base44.asServiceRole.entities.PhotoRevealRequest.filter({ request_id });
  const req = reqs[0];
  if (!req) return { success: false, reason: 'request_not_found' };
  if (req.viewer_native_user_id !== viewer_id) return { success: false, reason: 'not_viewer' };
  if (!['initiated', 'payment_authorized', 'pending_owner_approval'].includes(req.request_status)) {
    return { success: false, reason: 'not_cancellable' };
  }

  const now = new Date();
  const cooldown_until = new Date(now.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Release the held credits.
  const { releaseHold } = await import('./interactionCredits.ts');
  await releaseHold(base44, {
    native_user_id: req.viewer_native_user_id,
    reservation_id: req.reservation_id,
    reason: 'viewer_cancelled',
    idempotency_key: `release-${req.request_id}`,
    correlation_id: req.correlation_id || req.request_id,
  });

  await base44.asServiceRole.entities.PhotoRevealRequest.update(req.id, {
    request_status: 'cancelled',
    cancelled_at: now.toISOString(),
    cooldown_until,
  });

  return { success: true, request_id };
}

// Expire a pending request (7-day timeout): release hold, set cooldown.
// Called by the scheduled workflow.
export async function expirePhotoRevealRequest(base44: any, request: any) {
  if (!['initiated', 'payment_authorized', 'pending_owner_approval'].includes(request.request_status)) {
    return { success: true, already_resolved: true };
  }
  const now = new Date();
  const cooldown_until = new Date(now.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Release the held credits.
  const { releaseHold } = await import('./interactionCredits.ts');
  await releaseHold(base44, {
    native_user_id: request.viewer_native_user_id,
    reservation_id: request.reservation_id,
    reason: 'expired_no_owner_response',
    idempotency_key: `release-${request.request_id}`,
    correlation_id: request.correlation_id || request.request_id,
  });

  await base44.asServiceRole.entities.PhotoRevealRequest.update(request.id, {
    request_status: 'expired',
    expired_at: now.toISOString(),
    cooldown_until,
  });

  return { success: true, request_id: request.request_id };
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