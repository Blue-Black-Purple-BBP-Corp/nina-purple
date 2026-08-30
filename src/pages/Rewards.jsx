import React from 'react';
import { Coins, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStaffSession } from '@/lib/StaffSessionContext';

// Rewards / Finance workspace. BBP rules, campaigns, ledger, redemptions, and
// fulfillment live here. The full console is reachable via the members admin
// tool; this workspace is the finance-staff entry point.
export default function Rewards() {
  const { activeSession } = useStaffSession();
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-[#F0E6FF]">Rewards &amp; Finance</h1>
        <p className="text-[#F0E6FF]/40 text-xs mt-1">
          BBP rules, campaigns, ledger, redemptions, and fulfillment. Operating as <span className="text-[#F5A800]">{activeSession?.active_role}</span>.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-[#F0E6FF]">
          <Coins className="w-5 h-5 text-[#F5A800]" />
          <h2 className="font-serif text-lg">BBP Rewards Console</h2>
        </div>
        <p className="text-[#F0E6FF]/50 text-sm">
          Manage reward rules, review the ledger, and fulfill redemptions. All changes are recorded in the append-only audit log.
        </p>
        <button
          onClick={() => navigate('/admin/members')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all"
        >
          Open Rewards Console <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}