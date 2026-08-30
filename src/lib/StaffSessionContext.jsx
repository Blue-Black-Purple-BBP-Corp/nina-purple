import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Tracks the current user's staff context: their authorized operating contexts
// (from UserRoleAssignment) and any active PrivilegedSession. The provider
// restores an active session on mount so a page reload keeps the user in their
// privileged workspace until inactivity expiry. Member mode is the absence of
// an active session — the member app never reads staff-only data through this.
const StaffSessionContext = createContext(null);

export const StaffSessionProvider = ({ children }) => {
  const [staffContext, setStaffContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getStaffContext', {});
      setStaffContext(res.data || res);
    } catch (e) {
      console.error('StaffSession refresh error:', e.message);
      setStaffContext({ authenticated: false, assignments: [], authorized_contexts: [], active_session: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const activate = useCallback(async (context, reauthPassword) => {
    setActivating(true);
    try {
      const res = await base44.functions.invoke('activatePrivilegedSession', {
        context,
        reauth_password: reauthPassword,
      });
      await refresh();
      return { success: true, session: res.data?.session || res.session };
    } catch (e) {
      return { success: false, error: e.message || 'Activation failed' };
    } finally {
      setActivating(false);
    }
  }, [refresh]);

  const endSession = useCallback(async (reason) => {
    try {
      await base44.functions.invoke('endPrivilegedSession', { reason: reason || 'manual_exit' });
    } catch (e) {
      console.error('End session error:', e.message);
    }
    await refresh();
  }, [refresh]);

  const activeSession = staffContext?.active_session || null;
  const authorizedContexts = staffContext?.authorized_contexts || [];

  return (
    <StaffSessionContext.Provider value={{
      staffContext,
      loading,
      activating,
      activeSession,
      authorizedContexts,
      isPrivileged: !!activeSession,
      currentContext: activeSession?.operating_context || null,
      activate,
      endSession,
      refresh,
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