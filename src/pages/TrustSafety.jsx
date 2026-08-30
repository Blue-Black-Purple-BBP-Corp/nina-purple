import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useStaffSession } from '@/lib/StaffSessionContext';
import ModerationQueue from '@/components/admin/ModerationQueue';

// Trust & Safety workspace. Renders the moderation queue (reports, warnings,
// suspensions). Access is gated by PrivilegedRoute (trust_safety context); the
// underlying actionModeration function re-checks the session and conflict of
// interest server-side.
export default function TrustSafety() {
  const { activeSession } = useStaffSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getAdminDashboard', {});
      setData(res.data || res);
    } catch (e) {
      console.error('TrustSafety load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-[#F0E6FF]">Trust &amp; Safety</h1>
        <p className="text-[#F0E6FF]/40 text-xs mt-1">
          Reports, warnings, suspensions, and appeals. Operating as <span className="text-[#F5A800]">{activeSession?.active_role}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
      ) : (data?.moderation?.length ? (
        <ModerationQueue items={data.moderation} onResolved={load} />
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-[#F0E6FF]/40 flex flex-col items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-[#F0E6FF]/20" />
          No pending moderation items.
        </div>
      ))}
    </div>
  );
}