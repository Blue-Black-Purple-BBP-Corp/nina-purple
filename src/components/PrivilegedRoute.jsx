import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useStaffSession } from '@/lib/StaffSessionContext';
import ReauthModal from './ReauthModal';
import PrivilegedModeBanner from './PrivilegedModeBanner';
import { CONTEXT_LABELS } from './PrivilegedModeBanner';

// Route guard for privileged workspaces. A privileged route renders only when
// the caller has an active PrivilegedSession in the matching operating context.
// Visiting the URL alone does NOT activate privileged access — the user must
// explicitly switch context and re-authenticate. Server-side functions re-check
// the session independently, so this guard is defense-in-depth, not the
// enforcement boundary.
export default function PrivilegedRoute({ context }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { activeSession, authorizedContexts, loading: sessionLoading } = useStaffSession();
  const [showReauth, setShowReauth] = useState(false);
  const navigate = useNavigate();

  if (isLoadingAuth || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const authorized = authorizedContexts.includes(context);
  const sessionMatches = activeSession?.operating_context === context;
  const label = CONTEXT_LABELS[context] || context;

  if (sessionMatches) {
    return (
      <>
        <PrivilegedModeBanner />
        <Outlet />
      </>
    );
  }

  // No matching active session — show the activation gate.
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-5 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(245,168,0,0.1)] flex items-center justify-center">
        {authorized ? <Shield className="w-8 h-8 text-[#F5A800]" /> : <Lock className="w-8 h-8 text-[#F0E6FF]/30" />}
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-[#F0E6FF]">{label} workspace</h2>
        <p className="text-[#F0E6FF]/50 text-sm max-w-sm">
          {authorized
            ? `Activate ${label} mode to continue. Administrative actions are logged.`
            : 'You are not authorized for this workspace.'}
        </p>
      </div>
      {authorized && (
        <button
          onClick={() => setShowReauth(true)}
          className="px-6 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-yellow-400 transition-all"
        >
          Switch to {label} workspace
        </button>
      )}
      <button onClick={() => navigate('/home')} className="text-[#F0E6FF]/40 hover:text-[#F5A800] text-xs">
        ← Back to member mode
      </button>

      {showReauth && (
        <ReauthModal
          context={context}
          onClose={() => setShowReauth(false)}
          onSuccess={() => setShowReauth(false)}
        />
      )}
    </div>
  );
}