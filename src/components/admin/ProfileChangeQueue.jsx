import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, X, Check, AlertCircle, Mail, User, Phone, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FIELD_ICON = { email: Mail, full_name: User, phone: Phone, birthdate: Calendar };

const STATUS_LABEL = {
  pending_review: { en: 'Pending review', fr: 'En attente' },
  pending_verification_unavailable: { en: 'Verification unavailable', fr: 'Vérification indisponible' },
  under_review: { en: 'Under review', fr: 'En cours' },
  approved: { en: 'Approved', fr: 'Approuvée' },
  completed: { en: 'Completed', fr: 'Complétée' },
  rejected: { en: 'Rejected', fr: 'Rejetée' },
  cancelled: { en: 'Cancelled', fr: 'Annulée' },
};

// Staff review queue for ProfileChangeRequest records. Fetches its own data
// (masked sensitive values) via getProfileChangeRequests?scope=staff. Approve
// applies full_name/birthdate; email approve → platform-support completion;
// phone cannot be approved (OTP unavailable). All actions audit-logged server-side.
export default function ProfileChangeQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getProfileChangeRequests', { scope: 'staff' });
      setItems(res.data?.items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const review = async (id, decision) => {
    setError('');
    if (decision === 'reject' && !reason.trim()) { setError('A reason is required to reject.'); return; }
    setActing(id);
    try {
      await base44.functions.invoke('reviewProfileChange', { request_id: id, decision, reason: reason.trim() || undefined });
      setReason('');
      await load();
    } catch (e) { setError(e.message); }
    finally { setActing(null); }
  };

  const complete = async (id) => {
    setError('');
    setActing(id);
    try {
      await base44.functions.invoke('completeProfileChange', { request_id: id, completion_notes: 'Email updated via platform support.' });
      await load();
    } catch (e) { setError(e.message); }
    finally { setActing(null); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>;

  const open = items.filter(i => ['pending_review', 'pending_verification_unavailable', 'under_review', 'approved'].includes(i.status));

  return (
    <div className="space-y-4">
      {error && <div className="flex items-start gap-2 text-red-400 text-xs glass-card rounded-xl p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
      {open.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-[#F5A800]/40 mx-auto mb-2" />
          <p className="text-[#F0E6FF]/50 text-sm">No pending profile change requests.</p>
        </div>
      ) : open.map(item => {
        const Icon = FIELD_ICON[item.field_name] || User;
        const sl = STATUS_LABEL[item.status] || { en: item.status, fr: item.status };
        return (
          <div key={item.id} className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#7B2FBE]" />
                </div>
                <div>
                  <p className="text-[#F0E6FF] font-medium text-sm">{item.member_display_name}</p>
                  <p className="text-[#F0E6FF]/40 text-xs capitalize">{item.field_name.replace('_', ' ')}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(245,168,0,0.12)] text-[#F5A800] border border-[rgba(245,168,0,0.25)]">{sl.en}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="glass-card rounded-lg px-3 py-2">
                <p className="text-[#F0E6FF]/40 uppercase tracking-wide text-[10px] mb-0.5">Current</p>
                <p className="text-[#F0E6FF]/70 truncate">{item.current_value || '—'}</p>
              </div>
              <div className="glass-card rounded-lg px-3 py-2">
                <p className="text-[#F0E6FF]/40 uppercase tracking-wide text-[10px] mb-0.5">Requested</p>
                <p className="text-[#F5A800] truncate">{item.requested_value || '—'}</p>
              </div>
            </div>
            {item.status === 'approved' && item.field_name === 'email' && (
              <div className="flex items-start gap-2 text-[#F0E6FF]/50 text-xs glass-card rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F5A800]" />
                <span>Email update must be completed via platform support. Mark completed once the auth email is updated.</span>
              </div>
            )}
            {item.field_name === 'phone' && (
              <div className="flex items-start gap-2 text-[#F0E6FF]/50 text-xs glass-card rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Phone changes require SMS verification (not yet available). Reject invalid requests; valid ones remain held.</span>
              </div>
            )}
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (required to reject)"
              className="w-full glass-card rounded-xl px-3 py-2 text-[#F0E6FF] text-xs outline-none focus:border-[rgba(245,168,0,0.4)]" />
            <div className="flex gap-2">
              {item.status !== 'approved' && item.field_name !== 'phone' && (
                <button onClick={() => review(item.request_id, 'approve')} disabled={acting === item.request_id}
                  className="flex-1 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-xs font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                  {acting === item.request_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Approve</>}
                </button>
              )}
              {item.status === 'approved' && item.field_name === 'email' && (
                <button onClick={() => complete(item.request_id)} disabled={acting === item.request_id}
                  className="flex-1 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-xs font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                  {acting === item.request_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Mark completed</>}
                </button>
              )}
              <button onClick={() => review(item.request_id, 'reject')} disabled={acting === item.request_id}
                className="flex-1 py-2 glass-card text-red-400 rounded-full text-xs font-bold hover:border-red-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                {acting === item.request_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Reject</>}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}