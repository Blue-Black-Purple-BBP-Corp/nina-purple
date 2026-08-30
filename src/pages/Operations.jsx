import React from 'react';
import { Wrench } from 'lucide-react';
import { useStaffSession } from '@/lib/StaffSessionContext';

// Engineering / Operations workspace. Technical diagnostics and operational
// controls. Surface area is intentionally limited to non-sensitive operational
// tooling; member data and financial records are out of scope here.
export default function Operations() {
  const { activeSession } = useStaffSession();

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-[#F0E6FF]">Engineering &amp; Operations</h1>
        <p className="text-[#F0E6FF]/40 text-xs mt-1">
          Technical diagnostics and operational controls. Operating as <span className="text-[#F5A800]">{activeSession?.active_role}</span>.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8 text-center text-[#F0E6FF]/40 flex flex-col items-center gap-3">
        <Wrench className="w-8 h-8 text-[#F0E6FF]/20" />
        <p className="text-sm max-w-sm">
          Operational tooling will be surfaced here. This workspace is scoped to diagnostics only — member data, financial records, and safety cases are not accessible from this context.
        </p>
      </div>
    </div>
  );
}