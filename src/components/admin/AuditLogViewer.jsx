import React, { useEffect, useState } from 'react';
import { Loader2, ScrollText, Lock, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DateRangeSelector from './DateRangeSelector';

// Append-only audit log viewer. Super_admin only — a non-super_admin caller
// gets a clear access-restricted state rather than an empty list.
export default function AuditLogViewer({ isSuperAdmin, dateRange, onDateChange }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin, dateRange.from, dateRange.to]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getAdminAuditLog', {
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      });
      const data = res.data || res;
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('AuditLogViewer load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Lock className="w-8 h-8 mx-auto mb-3 text-[#F0E6FF]/30" />
        <h3 className="font-serif text-lg text-[#F0E6FF]">Audit log restricted</h3>
        <p className="text-[#F0E6FF]/40 text-sm mt-1 max-w-sm mx-auto">
          The audit log is visible to super admins only. Admins can act on verifications and moderation without reading the trail.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[#F5A800]" />
          <span className="text-[#F0E6FF]/60 text-sm">{total} entr{total !== 1 ? 'ies' : 'y'}</span>
        </div>
        <DateRangeSelector from={dateRange.from} to={dateRange.to} onChange={onDateChange} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
      ) : entries.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-[#F0E6FF]/40">No audit entries in this range.</div>
      ) : (
        <div className="space-y-2">
          {entries.map(e => {
            const isOpen = expanded === e.id;
            let changes = null;
            try { changes = e.changes ? JSON.parse(e.changes) : null; } catch (_) {}
            return (
              <div key={e.id} className="glass-card rounded-2xl p-3">
                <button
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <ChevronRight className={`w-4 h-4 text-[#F0E6FF]/30 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#F5A800] font-mono text-xs">{e.action}</span>
                      <span className="text-[#F0E6FF]/40 text-[11px]">{e.target_type}{e.target_id ? ` · ${e.target_id.slice(-8)}` : ''}</span>
                    </div>
                    <div className="text-[#F0E6FF]/50 text-[11px] mt-0.5">
                      {new Date(e.created_date).toLocaleString()} · by {e.actor_role} ({(e.actor_admin_id || '').slice(-8)})
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-3 pl-7 space-y-2 border-t border-[#F0E6FF]/10 pt-3">
                    {e.reason && <p className="text-[#F0E6FF]/70 text-xs"><span className="text-[#F0E6FF]/40">Reason:</span> {e.reason}</p>}
                    {changes && (
                      <pre className="text-[#F0E6FF]/50 text-[11px] bg-[#0B0510]/50 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(changes, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}