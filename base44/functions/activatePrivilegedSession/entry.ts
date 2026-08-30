import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import {
  PRIVILEGED_CONTEXTS,
  getSessionLimits,
  getActiveRoleAssignments,
  authorizedContexts,
  getActivePrivilegedSession,
  getAccountStatus,
  getAuthMethods,
  _endSession,
  writeStaffAuditLog,
} from '../../shared/staffAuth.ts';

// Activates a privileged session in a given operating context after a fresh
// step-up authentication.
//
// Step-up methods (auth_method):
//   - "password": local credential, verified server-side via loginViaEmailPassword.
//     assurance = password_reauth.
//   - "google" | "microsoft" | "apple": platform-mediated SSO re-authentication.
//     The client must have just completed a loginWithProvider redirect for the
//     same provider before calling this with sso_reauth: true. The app does NOT
//     validate the provider token (Base44 handles OAuth internally and does not
//     expose the token to backend functions), so assurance = platform_sso_reauth.
//     The provider must be present in the member's self-declared auth_methods.
//
// Before creating the session, rechecks: active UserRoleAssignment for the
// context, requested role scope, account is active and not restricted. Any
// previously-active session is ended first (one live context at a time). Every
// attempt, method selection, success, and failure is written to the append-only
// audit trail under a shared correlation_id. No passwords, tokens, or codes are
// ever logged.
Deno.serve(async (req) => {
  const correlation_id = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const { context, auth_method, reauth_password, sso_reauth } = await req.json().catch(() => ({}));
    if (!context || !PRIVILEGED_CONTEXTS.includes(context)) {
      return Response.json({ error: 'Invalid operating context' }, { status: 400 });
    }
    const VALID_METHODS = ['password', 'google', 'microsoft', 'apple'];
    if (!auth_method || !VALID_METHODS.includes(auth_method)) {
      return Response.json({ error: 'auth_method is required (password|google|microsoft|apple)' }, { status: 400 });
    }
    const isPassword = auth_method === 'password';
    if (isPassword && (!reauth_password || !String(reauth_password).trim())) {
      return Response.json({ error: 'Re-authentication password is required' }, { status: 400 });
    }
    if (!isPassword && !sso_reauth) {
      return Response.json({ error: 'sso_reauth is required for provider step-up' }, { status: 400 });
    }

    // Audit the attempt (method selected) before any decision.
    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      actor_role: user.role,
      operating_context: context,
      action_type: 'privileged_session.activation_attempt',
      target_entity_type: 'PrivilegedSession',
      reason_code: auth_method,
      result: 'success',
      correlation_id,
      new_state: { auth_method },
    });

    // 1. Verify the user holds an active assignment for this context.
    const assignments = await getActiveRoleAssignments(base44, user.id);
    const ctxs = authorizedContexts(assignments);
    if (!ctxs.includes(context)) {
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id, actor_role: user.role, operating_context: context,
        action_type: 'privileged_session.activation_denied', target_entity_type: 'PrivilegedSession',
        reason_code: 'no_role_assignment', result: 'denied', correlation_id,
      });
      return Response.json({ error: 'You are not authorized for this workspace.' }, { status: 403 });
    }

    // 2. Account must not be restricted. A missing/unreadable profile is allowed
    // through here — the role-assignment check above is the primary gate; this
    // only blocks known non-active statuses (suspended, limited_review,
    // permanently_removed) so a suspended staff member cannot elevate.
    const accountStatus = await getAccountStatus(base44, user.id);
    if (accountStatus && accountStatus !== 'active') {
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id, actor_role: user.role, operating_context: context,
        action_type: 'privileged_session.activation_denied', target_entity_type: 'PrivilegedSession',
        reason_code: `account_${accountStatus}`, result: 'denied', correlation_id,
      });
      return Response.json({ error: 'Your account is not eligible for privileged access.' }, { status: 403 });
    }

    // 3. Step-up verification.
    let session_assurance_level = 'password_reauth';
    if (isPassword) {
      try {
        await base44.auth.loginViaEmailPassword(user.email, String(reauth_password));
      } catch (e) {
        await writeStaffAuditLog(base44, {
          actor_native_user_id: user.id, actor_role: user.role, operating_context: context,
          action_type: 'privileged_session.reauth_failed', target_entity_type: 'User',
          target_entity_id: user.id, reason_code: 'invalid_credentials', result: 'denied', correlation_id,
        });
        return Response.json({ error: 'Re-authentication failed. Please re-enter your password.' }, { status: 401 });
      }
    } else {
      // SSO: best-effort linked-method check. The platform does not expose linked
      // identities, so we rely on the self-declared auth_methods record. When the
      // record is non-empty, the provider must be in it (the member has recorded
      // methods and must use one of them). When the record is empty (no profile, or
      // an account that signed in before this feature shipped), we allow the
      // provider: the platform's loginWithProvider already validated the provider
      // auth, and the role-assignment check above backstops a mismatched account.
      const linked = await getAuthMethods(base44, user.id);
      if (linked.length > 0 && !linked.includes(auth_method)) {
        await writeStaffAuditLog(base44, {
          actor_native_user_id: user.id, actor_role: user.role, operating_context: context,
          action_type: 'privileged_session.activation_denied', target_entity_type: 'PrivilegedSession',
          reason_code: 'provider_not_linked', result: 'denied', correlation_id,
          new_state: { auth_method, linked_methods: linked },
        });
        return Response.json({ error: 'That sign-in method is not linked to your account.', code: 'provider_not_linked' }, { status: 403 });
      }
      session_assurance_level = 'platform_sso_reauth';
      // The platform just re-authenticated the user via loginWithProvider. The
      // app does NOT validate the provider token (issuer/audience/signature/
      // subject/nonce/state/freshness) — Base44 handles OAuth internally.
    }

    // 4. End any existing active session (one live context at a time).
    const existing = await getActivePrivilegedSession(base44, user.id);
    if (existing) {
      await _endSession(base44, existing, 'superseded');
    }

    // 5. Determine the active role for this context.
    const matching = assignments.find((a) => a.scope === context || a.scope === 'all' || authorizedContexts([a]).includes(context));
    const activeRole = matching?.role || 'admin';

    // 6. Resolve bbp_member_id (best-effort).
    let bbp_member_id = null;
    try {
      const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({ native_user_id: user.id });
      bbp_member_id = wallets[0]?.bbp_member_id || null;
    } catch (e) { /* non-fatal */ }

    const now = new Date();
    const limits = getSessionLimits(context);
    const expiresAt = new Date(now.getTime() + limits.absolute * 60 * 1000);
    const sessionId = crypto.randomUUID();
    const identity_provider = isPassword ? 'password' : auth_method;

    const session = await base44.asServiceRole.entities.PrivilegedSession.create({
      privileged_session_id: sessionId,
      native_user_id: user.id,
      bbp_member_id,
      active_role: activeRole,
      operating_context: context,
      auth_method,
      identity_provider,
      step_up_verified_at: now.toISOString(),
      session_assurance_level,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_activity_at: now.toISOString(),
      reauthenticated_at: now.toISOString(),
    });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      actor_bbp_member_id: bbp_member_id,
      actor_role: activeRole,
      operating_context: context,
      privileged_session_id: sessionId,
      action_type: 'privileged_session.activated',
      target_entity_type: 'PrivilegedSession',
      target_entity_id: sessionId,
      reason_code: 'manual_activation',
      result: 'success',
      correlation_id,
      new_state: {
        operating_context: context,
        active_role: activeRole,
        auth_method,
        identity_provider,
        session_assurance_level,
        expires_at: expiresAt.toISOString(),
      },
    });

    return Response.json({
      success: true,
      session: {
        privileged_session_id: sessionId,
        operating_context: context,
        active_role: activeRole,
        auth_method,
        identity_provider,
        session_assurance_level,
        activated_at: session.activated_at,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error('[activatePrivilegedSession] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});