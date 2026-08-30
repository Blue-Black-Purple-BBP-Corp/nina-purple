import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronDown, LogOut, ArrowRight } from 'lucide-react';
import { useStaffSession } from '@/lib/StaffSessionContext';
import { CONTEXT_LABELS } from './PrivilegedModeBanner';

const CONTEXT_ROUTE = {
  admin: '/admin',
  trust_safety: '/trust-safety',
  rewards_finance: '/rewards',
  engineering_operations: '/operations',
};

// Account-menu action for staff. Hidden entirely for members with no role
// assignments. For staff it lists their authorized workspaces and lets them
// switch context (with re-authentication) or return to member mode.
export default function StaffAccountMenu() {
  const { authorizedContexts, activeSession, endSession } = useStaffSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!authorizedContexts.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
          activeSession
            ? 'bg-[rgba(245,168,0,0.18)] text-[#F5A800] border border-[rgba(245,168,0,0.4)]'
            : 'glass-card text-[#F0E6FF]/60 hover:text-[#F5A800]'
        }`}
      >
        <Shield className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{activeSession ? CONTEXT_LABELS[activeSession.operating_context] : 'Staff'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl p-2 shadow-xl z-50">
          {activeSession ? (
            <>
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#F0E6FF]/40">
                Active: {CONTEXT_LABELS[activeSession.operating_context]}
              </div>
              <button
                onClick={() => { setOpen(false); navigate(CONTEXT_ROUTE[activeSession.operating_context]); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#F0E6FF]/70 hover:bg-[rgba(240,230,255,0.06)] text-sm"
              >
                Open workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => { setOpen(false); await endSession('manual_exit'); navigate('/home'); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-sm"
              >
                <LogOut className="w-3.5 h-3.5" /> Return to Member mode
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#F0E6FF]/40">Switch to workspace</div>
              {authorizedContexts.map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => { setOpen(false); navigate(CONTEXT_ROUTE[ctx]); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#F0E6FF]/70 hover:bg-[rgba(240,230,255,0.06)] text-sm"
                >
                  {CONTEXT_LABELS[ctx] || ctx} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}