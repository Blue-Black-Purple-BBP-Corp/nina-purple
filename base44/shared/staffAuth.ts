// Dual-context access control core.
//
// Staff members use the app as ordinary members by default (member mode = the
// absence of an active PrivilegedSession). Privileged access requires:
//   1. an active UserRoleAssignment authorizing the requested operating_context
//   2. a fresh PrivilegedSession in that context, created after step-up
//      authentication (password re-entry, or platform-mediated SSO re-auth)
//   3. no conflict of interest between the staff member and the target
//
// Every protected backend function calls requirePrivilegedContext() before
// acting, and writeStaffAuditLog() in the same call. The client never decides
// authorization — it only renders based on getStaffContext().
//
// PLATFORM LIMITATION: Base44 does not expose linked identities, passkeys, or
// server-side OAuth token validation. The only server-verifiable credential
// check is loginViaEmailPassword (password). SSO step-up is therefore
// platform-mediated (loginWithProvider redirect), not app-validated; its
// assurance level is recorded as "platform_sso_reauth". Passkey and magic-link
// step-up are not supported by the platform and are intentionally not faked.

export const OPERATING_CONTEXTS = [
  "member",
  "admin",
  "trust_safety",
  "rewards_finance",
  "engineering_operations",
] as const;

export const PRIVILEGED_CONTEXTS = [
  "admin",
  "trust_safety",
  "rewards_finance",
  "engineering_operations",
] as const;

export const SESSION_MAX_LIFETIME_MINUTES = 30;
export const SESSION_INACTIVITY_MINUTES = 20;

// Trust & Safety requires tighter bounds: 5-minute step-up freshness, 15-minute
// inactivity, 30-minute absolute duration. Other contexts keep the defaults.
export const STEP_UP_FRESHNESS_MINUTES = 5;
export const HIGH_VALUE_BBP_THRESHOLD = 100;

const CONTEXT_SESSION_LIMITS: Record<string, { inactivity: number; absolute: number }> = {
  trust_safety: { inactivity: 15, absolute: 30 },
  admin: { inactivity: SESSION_INACTIVITY_MINUTES, absolute: SESSION_MAX_LIFETIME_MINUTES },
  rewards_finance: { inactivity: SESSION_INACTIVITY_MINUTES, absolute: SESSION_MAX_LIFETIME_MINUTES },
  engineering_operations: { inactivity: SESSION_INACTIVITY_MINUTES, absolute: SESSION_MAX_LIFETIME_MINUTES },
};

export function getSessionLimits(context: string): { inactivity: number; absolute: number } {
  return CONTEXT_SESSION_LIMITS[context] || { inactivity: SESSION_INACTIVITY_MINUTES, absolute: SESSION_MAX_LIFETIME_MINUTES };
}

// Role -> operating contexts granted by that role.
// `admin` is the top clearance: it grants every operating context, identical to
// `super_admin`. (The platform does not allow promoting the app owner to
// super_admin, so admin must carry the same authority.) super_admin remains as
// an equivalent alias.
const ROLE_CONTEXTS: Record<string, string[]> = {
  admin: ["admin", "trust_safety", "rewards_finance", "engineering_operations"],
  trust_safety: ["trust_safety"],
  rewards_finance: ["rewards_finance"],
  engineering_operations: ["engineering_operations"],
  super_admin: ["admin", "trust_safety", "rewards_finance", "engineering_operations"],
};

export function contextsForRole(role: string): string[] {
  return ROLE_CONTEXTS[role] || [];
}

// ── Role assignments ──

export async function getActiveRoleAssignments(base44: any, native_user_id: string) {
  const now = new Date();
  let all: any[] = [];
  try {
    all = await base44.asServiceRole.entities.UserRoleAssignment.filter({ native_user_id, status: "active" });
  } catch (e) {
    console.error("[staffAuth] getActiveRoleAssignments error:", e?.message || e);
    return [];
  }
  return all.filter((a) => {
    if (a.expires_at && new Date(a.expires_at) < now) return false;
    return true;
  });
}

// Returns the set of operating contexts the user is authorized for.
export function authorizedContexts(assignments: any[]): string[] {
  const ctxs = new Set<string>();
  for (const a of assignments) {
    if (a.scope === "all") {
      PRIVILEGED_CONTEXTS.forEach((c) => ctxs.add(c));
    } else if (a.scope) {
      ctxs.add(a.scope);
    }
    contextsForRole(a.role).forEach((c) => ctxs.add(c));
  }
  return Array.from(ctxs);
}

// ── Account status & auth methods (read from UserProfile) ──

// Returns the member's account_status, or null if it cannot be determined.
// Callers should deny privileged access when null (fail closed).
export async function getAccountStatus(base44: any, native_user_id: string): Promise<string | null> {
  try {
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id });
    return profiles[0]?.account_status ?? null;
  } catch (e) {
    console.error("[staffAuth] getAccountStatus error:", e?.message || e);
    return null;
  }
}

// Returns the member's self-declared auth_methods (sign-in methods they have
// used). Best-effort: Base44 does not expose linked identities.
export async function getAuthMethods(base44: any, native_user_id: string): Promise<string[]> {
  try {
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id });
    return Array.isArray(profiles[0]?.auth_methods) ? profiles[0].auth_methods : [];
  } catch (e) {
    console.error("[staffAuth] getAuthMethods error:", e?.message || e);
    return [];
  }
}

// ── Privileged sessions ──

export async function _endSession(base44: any, session: any, reason: string) {
  try {
    await base44.asServiceRole.entities.PrivilegedSession.update(session.id, {
      ended_at: new Date().toISOString(),
      end_reason: reason,
    });
  } catch (e) {
    console.error("[staffAuth] endSession error:", e?.message || e);
  }
}

// Returns the user's currently-active privileged session, or null if none
// (after auto-ending any that have hit hard or inactivity expiry, using the
// limits for that session's operating context).
export async function getActivePrivilegedSession(base44: any, native_user_id: string) {
  const now = new Date();
  let sessions: any[] = [];
  try {
    sessions = await base44.asServiceRole.entities.PrivilegedSession.filter({ native_user_id });
  } catch (e) {
    console.error("[staffAuth] getActivePrivilegedSession error:", e?.message || e);
    return null;
  }
  const live = sessions
    .filter((s) => !s.ended_at)
    .sort((a, b) => new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime());
  if (!live.length) return null;
  const session = live[0];
  const limits = getSessionLimits(session.operating_context);
  // Hard expiry
  if (session.expires_at && new Date(session.expires_at) < now) {
    await _endSession(base44, session, "expired_hard_limit");
    return null;
  }
  // Inactivity expiry
  const lastActivity = new Date(session.last_activity_at || session.activated_at);
  const inactiveMs = now.getTime() - lastActivity.getTime();
  if (inactiveMs > limits.inactivity * 60 * 1000) {
    await _endSession(base44, session, "expired_inactivity");
    return null;
  }
  return session;
}

export async function _touchSession(base44: any, session: any) {
  try {
    await base44.asServiceRole.entities.PrivilegedSession.update(session.id, {
      last_activity_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[staffAuth] touchSession error:", e?.message || e);
  }
}

// Enforces an active privileged session in the given context. Returns
// { session, assignments } on success, or { errorResponse } on failure.
// Callers should: const guard = await requirePrivilegedContext(...);
//                if (guard.errorResponse) return guard.errorResponse;
export async function requirePrivilegedContext(base44: any, user: any, context: string) {
  if (!user) {
    return { errorResponse: Response.json({ error: "Authentication required" }, { status: 401 }) };
  }
  const session = await getActivePrivilegedSession(base44, user.id);
  if (!session || session.operating_context !== context) {
    return {
      errorResponse: Response.json(
        { error: `A privileged ${context} session is required for this action. Activate ${context} mode.`, code: "privileged_session_required" },
        { status: 403 }
      ),
    };
  }
  // Verify the user still holds an active assignment for this context.
  const assignments = await getActiveRoleAssignments(base44, user.id);
  const ctxs = authorizedContexts(assignments);
  if (!ctxs.includes(context)) {
    await _endSession(base44, session, "role_revoked");
    return { errorResponse: Response.json({ error: "Role assignment no longer active.", code: "role_revoked" }, { status: 403 }) };
  }
  // Account must remain active for privileged actions.
  const accountStatus = await getAccountStatus(base44, user.id);
  if (accountStatus && accountStatus !== "active") {
    await _endSession(base44, session, "account_restricted");
    return { errorResponse: Response.json({ error: "Account is no longer eligible for privileged access.", code: "account_restricted" }, { status: 403 }) };
  }
  await _touchSession(base44, session);
  return { session, assignments };
}

// High-impact actions require a fresh step-up (within STEP_UP_FRESHNESS_MINUTES).
// Returns { fresh: true } or { fresh: false, reason }. Callers should return a
// 419 with code "fresh_step_up_required" when not fresh, so the client can
// re-prompt step-up verification.
export function requireFreshStepUp(session: any, withinMinutes = STEP_UP_FRESHNESS_MINUTES) {
  if (!session?.step_up_verified_at) return { fresh: false, reason: "no_step_up" };
  const ageMs = Date.now() - new Date(session.step_up_verified_at).getTime();
  if (ageMs > withinMinutes * 60 * 1000) return { fresh: false, reason: "stale_step_up" };
  return { fresh: true };
}

// ── Conflict of interest ──

// Returns { conflict: true, reason } if the staff member must not act on the
// target member, otherwise { conflict: false }.
export async function checkConflictOfInterest(base44: any, staff_user_id: string, target_user_id: string) {
  if (!target_user_id) return { conflict: false };
  if (staff_user_id === target_user_id) {
    return { conflict: true, reason: "You cannot act on your own account. Reassign to another authorized staff member." };
  }
  // Declared conflicts
  try {
    const declared = await base44.asServiceRole.entities.ConflictOfInterest.filter({
      staff_native_user_id: staff_user_id,
      related_native_user_id: target_user_id,
    });
    if (declared.some((c) => c.status === "active")) {
      return { conflict: true, reason: "A declared conflict of interest exists for this member. Reassign to another authorized staff member." };
    }
  } catch (e) {
    console.error("[staffAuth] COI declared check error:", e?.message || e);
  }
  // Connections (either direction, any status — historical or active)
  try {
    const connsFrom = await base44.asServiceRole.entities.Connection.filter({
      from_user_id: staff_user_id,
      to_user_id: target_user_id,
    });
    if (connsFrom.length) {
      return { conflict: true, reason: "You cannot act on this case because of a conflict of interest. Reassign it to another authorized staff member." };
    }
    const connsTo = await base44.asServiceRole.entities.Connection.filter({
      from_user_id: target_user_id,
      to_user_id: staff_user_id,
    });
    if (connsTo.length) {
      return { conflict: true, reason: "You cannot act on this case because of a conflict of interest. Reassign it to another authorized staff member." };
    }
  } catch (e) {
    console.error("[staffAuth] COI connection check error:", e?.message || e);
  }
  // Conversation history (messages either direction)
  try {
    const msgsFrom = await base44.asServiceRole.entities.Message.filter({
      from_user_id: staff_user_id,
      to_user_id: target_user_id,
    });
    if (msgsFrom.length) {
      return { conflict: true, reason: "You cannot act on this case because of a conflict of interest. Reassign it to another authorized staff member." };
    }
    const msgsTo = await base44.asServiceRole.entities.Message.filter({
      from_user_id: target_user_id,
      to_user_id: staff_user_id,
    });
    if (msgsTo.length) {
      return { conflict: true, reason: "You cannot act on this case because of a conflict of interest. Reassign it to another authorized staff member." };
    }
  } catch (e) {
    console.error("[staffAuth] COI message check error:", e?.message || e);
  }
  return { conflict: false };
}

// ── Audit logging (rich, append-only) ──

export async function writeStaffAuditLog(base44: any, entry: {
  actor_native_user_id: string;
  actor_role?: string;
  actor_bbp_member_id?: string;
  operating_context?: string;
  privileged_session_id?: string;
  action_type: string;
  target_entity_type?: string;
  target_entity_id?: string;
  reason_code?: string;
  previous_state?: any;
  new_state?: any;
  case_or_ticket_reference?: string;
  result?: string;
  correlation_id?: string;
}): Promise<void> {
  const correlationId = entry.correlation_id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const auditEventId = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  const changes =
    entry.previous_state || entry.new_state
      ? JSON.stringify({ previous: entry.previous_state || null, next: entry.new_state || null })
      : null;
  try {
    await base44.asServiceRole.entities.AdminAuditLog.create({
      audit_event_id: auditEventId,
      actor_admin_id: entry.actor_native_user_id,
      actor_bbp_member_id: entry.actor_bbp_member_id || null,
      actor_role: entry.actor_role || null,
      operating_context: entry.operating_context || null,
      privileged_session_id: entry.privileged_session_id || null,
      action: entry.action_type,
      action_type: entry.action_type,
      target_type: entry.target_entity_type || null,
      target_entity_type: entry.target_entity_type || null,
      target_id: entry.target_entity_id || null,
      target_entity_id: entry.target_entity_id || null,
      reason: entry.reason_code || null,
      reason_code: entry.reason_code || null,
      changes,
      previous_state: entry.previous_state ? JSON.stringify(entry.previous_state) : null,
      new_state: entry.new_state ? JSON.stringify(entry.new_state) : null,
      case_or_ticket_reference: entry.case_or_ticket_reference || null,
      result: entry.result || "success",
      correlation_id: correlationId,
    });
  } catch (e) {
    // Audit logging must never silently break the action, but log loudly.
    console.error("[staffAuth] Failed to write staff audit log:", e?.message || e);
  }
}

// Backward-compatible alias for existing callers.
export { isAdminRole } from "./adminAudit.ts";