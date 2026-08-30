import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { useStaffSession } from '@/lib/StaffSessionContext';

export const CONTEXT_LABELS = {
  admin: 'Admin',
  trust_safety: 'Trust & Safety',
  rewards_finance: 'Rewards / Finance',
  engineering_operations: 'Engineering / Operations',
};

// Persistent banner shown across all privileged routes while a PrivilegedSession
// is active. Reminds staff that actions are logged and offers a one-tap return
// to member mode.
export default function PrivilegedModeBanner() {
  const { activeSession, endSession } = useStaffSession();
  const navigate = useNavigate();
  if (!activeSession) return null;
  const label = CONTEXT_LABELS[activeSession.operating_context] || activeSession.operating_context;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-[rgba(245,168,0,0.3)] bg-[rgba(245,168,0,0.12)] backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#F0E6FF] text-xs sm:text-sm">
          <Shield className="w-4 h-4 text-[#F5A800] shrink-0" />
          <span className="font-medium">
            You are operating in <span className="text-[#F5A800]">{label}</span> mode. Administrative actions are logged.
          </span>
        </div>
        <button
          onClick={async () => { await endSession('manual_exit'); navigate('/home'); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(240,230,255,0.08)] text-[#F0E6FF] text-xs hover:bg-[rgba(240,230,255,0.16)] transition-colors shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Return to Member mode
        </button>
      </div>
    </div>
  );
}