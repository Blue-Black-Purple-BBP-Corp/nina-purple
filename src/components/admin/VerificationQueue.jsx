import React, { useState } from 'react';
import { Loader2, ShieldCheck, CheckCircle, XCircle, Phone, UserCheck, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TYPE_META = {
  phone: { icon: Phone, label: 'Phone' },
  email: { icon: FileText, label: 'Email' },
  account_review: { icon: UserCheck, label: 'Account Review' },
  profile_completion: { icon: FileText, label: 'Profile Completion' },
  community_orientation: { icon: FileText, label: 'Community Orientation' },
  event_attendance: { icon: FileText, label: 'Event Attendance' },
  experience_attendance: { icon: FileText, label: 'Experience Attendance' },
  mutual_meetup_confirmation: { icon: FileText, label: 'Meetup Confirmation' },
  staff_exception: { icon: ShieldCheck, label: 'Staff Exception' },
};

// Queue of pending VerificationRequests with inline approve/reject.
export default function VerificationQueue({ items, onResolved }) {
  const [busy, setBusy] = useState(null);
  const [reasons, setReasons] = useState({});

  const submit = async (id, decision) => {
    const reason = reasons[id]?.trim();
    if (!reason) {
      alert('A reason is required for every verification decision.');
      return;
    }
    setBusy(id);
    try {
      await base44.functions.invoke('reviewVerification', {
        request_id: id,
        decision,
        reason,
        rejection_reason: decision === 'reject' ? reason : undefined,
      });
      setReasons(prev => { const n = { ...prev }; delete n[id]; return n; });
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
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400/60" />
        No pending verification requests.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(v => {
        const meta = TYPE_META[v.verification_type] || TYPE_META.staff_exception;
        const Icon = meta.icon;
        return (
          <div key={v.id} className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[rgba(245,168,0,0.1)] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#F5A800]" />
                </div>
                <div>
                  <div className="text-[#F0E6FF] font-medium text-sm">{v.display_name || 'Unknown member'}</div>
                  <div className="text-[#F0E6FF]/40 text-xs mt-0.5">
                    {meta.label} · {v.requested_at ? new Date(v.requested_at).toLocaleString() : ''}
                  </div>
                  {v.reason && <div className="text-[#F0E6FF]/50 text-xs mt-1 italic">"{v.reason}"</div>}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[rgba(245,168,0,0.1)] text-[#F5A800] shrink-0">
                {v.status}
              </span>
            </div>
            <input
              value={reasons[v.id] || ''}
              onChange={(e) => setReasons(prev => ({ ...prev, [v.id]: e.target.value }))}
              placeholder="Reason / justification (required, logged to audit trail)"
              className="w-full glass-card rounded-xl px-3 py-2 text-[#F0E6FF] text-xs outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => submit(v.id, 'approve')}
                disabled={busy === v.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/20 transition-all disabled:opacity-50"
              >
                {busy === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={() => submit(v.id, 'reject')}
                disabled={busy === v.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {busy === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}