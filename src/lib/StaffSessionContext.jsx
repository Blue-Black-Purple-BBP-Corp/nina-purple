import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Tracks the current user's staff context: their authorized operating contexts
// (from UserRoleAssignment), any active PrivilegedSession, and their self-declared
// auth_methods (sign-in methods they have used). The provider restores an active
// session on mount so a page reload keeps the user in their privileged workspace
// until inactivity expiry. Member mode is the absence of an active session.
//
// Step-up activation supports two paths:
//   - password: activate(context, password) — verified server-side.
//   - SSO: activateSSO(context, provider) — stashes the intent and redirects to
//     the provider via loginWithProvider; on return, refresh() completes the
//     activation. Assurance is platform-mediated (platform_sso_reauth).

const StaffSessionContext = createContext(null);

function cleanActivationQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    params.delete('activate_ctx');
    params.delete('auth_method');
    const clean = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (clean ? `?${clean}` : ''));
  } catch (e) { /* non-fatal */ }
}

export const StaffSessionProvider = ({ children }) => {
  const [staffContext, setStaffContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [pendingActivationError, setPendingActivationError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getStaffContext', {});
      const data = res.data || res;
      setStaffContext(data);

      // Complete a pending SSO step-up if the user just returned from a provider
      // redirect and does not yet have an active session.
      const pending = sessionStorage.getItem('pending_activation');
      if (pending) {
        sessionStorage.removeItem('pending_activation');
        cleanActivationQuery();
        if (!data.active_session) {
          let target = null;
          try { target = JSON.parse(pending); } catch (e) { target = null; }
          if (target && target.context && target.method) {
            setPendingActivationError(null);
            try {
              const r = await base44.functions.invoke('activatePrivilegedSession', {
                context: target.context,
                auth_method: target.method,
                sso_reauth: true,
              });
              const rd = r.data || r;
              if (rd.success) {
                const r2 = await base44.functions.invoke('getStaffContext', {});
                setStaffContext(r2.data || r2);
              } else {
                setPendingActivationError(rd.error || 'Activation failed.');
              }
            } catch (e) {
              setPendingActivationError(e.message || 'Activation failed.');
            }
          }
        }
      }
    } catch (e) {
      console.error('StaffSession refresh error:', e.message);
      setStaffContext({ authenticated: false, assignments: [], authorized_contexts: [], auth_methods: [], active_session: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const activate = useCallback(async (context, reauthPassword, opts = {}) => {
    setActivating(true);
    try {
      const res = await base44.functions.invoke('activatePrivilegedSession', {
        context,
        auth_method: opts.auth_method || 'password',
        reauth_password: reauthPassword,
        sso_reauth: opts.sso_reauth || false,
      });
      await refresh();
      return { success: true, session: res.data?.session || res.session };
    } catch (e) {
      return { success: false, error: e.message || 'Activation failed' };
    } finally {
      setActivating(false);
    }
  }, [refresh]);

  // Start a platform-mediated SSO step-up: stash the activation intent, then
  // redirect to the provider. After the provider redirects back, refresh()
  // detects the pending activation and completes it server-side.
  const activateSSO = useCallback((context, provider) => {
    try {
      sessionStorage.setItem('pending_activation', JSON.stringify({ context, method: provider }));
    } catch (e) { /* non-fatal */ }
    const returnTo = `${window.location.pathname}?activate_ctx=${encodeURIComponent(context)}&auth_method=${encodeURIComponent(provider)}`;
    base44.auth.loginWithProvider(provider, returnTo);
  }, []);

  const endSession = useCallback(async (reason) => {
    try {
      await base44.functions.invoke('endPrivilegedSession', { reason: reason || 'manual_exit' });
    } catch (e) {
      console.error('End session error:', e.message);
    }
    await refresh();
  }, [refresh]);

  const clearPendingActivationError = useCallback(() => setPendingActivationError(null), []);

  const activeSession = staffContext?.active_session || null;
  const authorizedContexts = staffContext?.authorized_contexts || [];
  const authMethods = staffContext?.auth_methods || [];

  return (
    <StaffSessionContext.Provider value={{
      staffContext,
      loading,
      activating,
      activeSession,
      authorizedContexts,
      authMethods,
      isPrivileged: !!activeSession,
      currentContext: activeSession?.operating_context || null,
      activate,
      activateSSO,
      endSession,
      refresh,
      pendingActivationError,
      clearPendingActivationError,
    }}>
      {children}
    </StaffSessionContext.Provider>
  );
};

export const useStaffSession = () => {
  const ctx = useContext(StaffSessionContext);
  if (!ctx) throw new Error('useStaffSession must be used within StaffSessionProvider');
  return ctx;
};