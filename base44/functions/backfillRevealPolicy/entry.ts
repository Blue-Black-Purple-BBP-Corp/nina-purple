import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// One-time backfill: marks all existing PhotoRevealEntitlement records that
// predate the owner-approval policy with approval_policy_version =
// 'legacy_auto_grant'. These grandfathered entitlements remain active without
// a linked PhotoRevealRequest and are subject to all current membership, block,
// suspension, moderation, and access-time checks. New entitlements created
// after this release use 'owner_approval_required' and require a linked
// approved request.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const ents = await base44.asServiceRole.entities.PhotoRevealEntitlement.filter({});
    let updated = 0;
    let skipped = 0;
    for (const e of ents) {
      // Only backfill records that have no approval_policy_version set (or null).
      if (!e.approval_policy_version) {
        try {
          await base44.asServiceRole.entities.PhotoRevealEntitlement.update(e.id, {
            approval_policy_version: 'legacy_auto_grant',
          });
          updated++;
        } catch (err) {
          console.warn('[backfillRevealPolicy] failed for', e.entitlement_id, err?.message || err);
        }
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      total: ents.length,
      backfilled_to_legacy: updated,
      already_had_policy: skipped,
    });
  } catch (error) {
    console.error('[backfillRevealPolicy] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});