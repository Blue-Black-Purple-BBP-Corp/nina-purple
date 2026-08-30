// Append-only audit log writer. Every admin-facing mutation across the app
// calls this in the SAME function call that performs the action, so the audit
// entry cannot be skipped. Writes via asServiceRole (bypasses RLS) so admin
// actors can log even though AdminAuditLog.create RLS is super_admin-only
// (that RLS blocks direct client SDK forgery, not service-role writes).
//
// AdminAuditLog is append-only by RLS: update and delete are denied to everyone
// ({ id: { $exists: false } } matches no record). Corrections are a NEW entry
// referencing the original — never an edit.

export async function writeAuditLog(
  base44: any,
  entry: {
    actor_admin_id: string;
    actor_role: string;
    action: string;
    target_type: string;
    target_id?: string | null;
    reason?: string | null;
    changes?: any;
  }
): Promise<void> {
  try {
    await base44.asServiceRole.entities.AdminAuditLog.create({
      actor_admin_id: entry.actor_admin_id,
      actor_role: entry.actor_role,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id || null,
      reason: entry.reason || null,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
    });
  } catch (e) {
    // Audit logging must never silently break the action, but log loudly.
    console.error('[adminAudit] Failed to write audit log:', e?.message || e);
  }
}

// Role helper: super_admin has every admin capability.
export function isAdminRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'super_admin';
}