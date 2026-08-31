import React, { useState } from 'react';
import { Camera, Clock, Check, X, Loader2, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Viewer-facing badge/card showing the status of an outgoing photo-reveal
// request. Uses neutral, member-safe language. The viewer can cancel a
// pending request (releases reserved credits). The viewer never sees the
// owner's private reason, internal safety flags, or staff notes.
const STATUS_META = {
  pending_owner_approval: { icon: Clock, color: '#F5A800', en: 'Pending', fr: 'En attente' },
  approved: { icon: Check, color: '#22C55E', en: 'Photos revealed', fr: 'Photos révélées' },
  declined: { icon: X, color: '#9CA3AF', en: 'Not approved', fr: 'Non approuvée' },
  expired: { icon: Clock, color: '#9CA3AF', en: 'Expired', fr: 'Expirée' },
  cancelled: { icon: Ban, color: '#9CA3AF', en: 'Cancelled', fr: 'Annulée' },
  refunded: { icon: X, color: '#9CA3AF', en: 'Refunded', fr: 'Remboursée' },
};

export default function PhotoRevealStatusBadge({ request, ownerName, onResolved }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [busy, setBusy] = useState(false);

  const meta = STATUS_META[request.request_status] || STATUS_META.pending_owner_approval;
  const Icon = meta.icon;
  const isPending = request.request_status === 'pending_owner_approval';

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('cancelPhotoReveal', { request_id: request.request_id });
      if (res.data?.success && onResolved) onResolved(request.request_id);
    } catch {}
    setBusy(false);
  };

  return (
    <div className="glass-card rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}15` }}>
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium truncate">
          {ownerName || (isFr ? 'Un membre' : 'A member')}
        </p>
        <p className="text-xs" style={{ color: meta.color }}>
          {isFr ? meta.fr : meta.en}
          {request.request_status === 'declined' && (isFr ? ' — aucun crédit utilisé' : ' — no credits used')}
          {request.request_status === 'expired' && (isFr ? ' — aucun crédit utilisé' : ' — no credits used')}
        </p>
      </div>
      {isPending && (
        <button
          onClick={handleCancel}
          disabled={busy}
          className="px-3 py-1.5 glass-card rounded-full text-foreground/50 text-xs hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          {isFr ? 'Annuler' : 'Cancel'}
        </button>
      )}
    </div>
  );
}