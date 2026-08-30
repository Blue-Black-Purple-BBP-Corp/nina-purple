import React, { useState } from 'react';
import { Loader2, Flag, Ban, AlertTriangle, XCircle, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TYPE_LABEL = {
  reported_profile: 'Reported Profile',
  reported_message: 'Reported Message',
  reported_photo: 'Reported Photo',
};

// Queue of pending ModerationItems with dismiss / warn / suspend actions.
// Suspend is time-bound and non-destructive: the member can still log in to
// view the notice and appeal.
export default function ModerationQueue({ items, onResolved }) {
  const [busy, setBusy] = useState(null);
  const [reasons, setReasons] = useState({});
  const [suspendDays, setSuspendDays] = useState({});

  const submit = async (id, action) => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      alert('A reason is required for every moderation action.');
      return;
    }
    setBusy(id);
    try {
      await base44.functions.invoke('actionModeration', {
        item_id: id,
        action,
        reason,
        suspension_days: action === 'suspend' ? (suspendDays[id] || undefined) : undefined,
      });
      setReasons(prev => { const n = { ...prev }; delete n[id]; return n; });
      setSuspendDays(prev => { const n = { ...prev }; delete n[id]; return n; });
      onResolved?.(id);
    } catch (e) {
      alert(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  if (!items.length) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-[#F0E6FF]/40">
        <Flag className="w-8 h-8 mx-auto mb-2 text-[#F0E6FF]/30" />
        No pending moderation items.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(m => (
        <div key={m.id} className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-[#F0E6FF] font-medium text-sm flex items-center gap-2">
                  <User className="w-3 h-3 text-[#F0E6FF]/40" />
                  {m.target_display_name || 'Unknown member'}
                  {m.priority > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                      {m.priority} report{m.priority !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="text-[#F0E6FF]/40 text-xs mt-0.5">
                  {TYPE_LABEL[m.item_type] || m.item_type} · {new Date(m.created_date).toLocaleString()}
                </div>
                {m.reason && <div className="text-[#F0E6FF]/50 text-xs mt-1 italic">"{m.reason}"</div>}
              </div>
            </div>
          </div>
          <input
            value={reasons[m.id] || ''}
            onChange={(e) => setReasons(prev => ({ ...prev, [m.id]: e.target.value }))}
            placeholder="Reason / justification (required, logged to audit trail)"
            className="w-full glass-card rounded-xl px-3 py-2 text-[#F0E6FF] text-xs outline-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-[#F0E6FF]/40 text-xs shrink-0">Suspend for</span>
            <input
              type="number"
              min="0"
              value={suspendDays[m.id] ?? ''}
              onChange={(e) => setSuspendDays(prev => ({ ...prev, [m.id]: e.target.value ? Number(e.target.value) : undefined }))}
              placeholder="blank = indefinite"
              className="w-32 glass-card rounded-lg px-2 py-1.5 text-[#F0E6FF] text-xs outline-none"
            />
            <span className="text-[#F0E6FF]/40 text-xs">days</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => submit(m.id, 'dismiss')}
              disabled={busy === m.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F0E6FF]/5 text-[#F0E6FF]/60 border border-[#F0E6FF]/10 text-xs font-medium hover:bg-[#F0E6FF]/10 transition-all disabled:opacity-50"
            >
              {busy === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Dismiss
            </button>
            <button
              onClick={() => submit(m.id, 'warn')}
              disabled={busy === m.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              {busy === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Warn
            </button>
            <button
              onClick={() => submit(m.id, 'suspend')}
              disabled={busy === m.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {busy === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Suspend
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}