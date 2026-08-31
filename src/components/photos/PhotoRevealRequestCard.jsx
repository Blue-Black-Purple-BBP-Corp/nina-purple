import React, { useState } from 'react';
import { Camera, Check, X, Loader2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Owner-facing card for an incoming photo-reveal request. Shows the viewer's
// display name and a neutral message. The owner can approve or decline without
// giving a reason. The owner never sees the viewer's wallet balance, payment
// source, or internal notes. Approval creates a viewer-specific entitlement;
// decline releases the viewer's reserved credits.
export default function PhotoRevealRequestCard({ request, viewerName, onResolved }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRespond = async (decision) => {
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('respondPhotoReveal', {
        request_id: request.request_id,
        decision,
      });
      if (res.data?.success) {
        if (onResolved) onResolved(request.request_id, decision);
      } else {
        setError(res.data?.reason || (isFr ? 'Une erreur est survenue.' : 'Something went wrong.'));
      }
    } catch (e) {
      setError(e?.message || (isFr ? 'Une erreur est survenue.' : 'Something went wrong.'));
    }
    setBusy(false);
  };

  const expiresAt = request.expires_at ? new Date(request.expires_at) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="glass-card-orchid rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
          <Camera className="w-5 h-5 text-[#7B2FBE]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-medium">
            {isFr
              ? `${viewerName || (isFr ? 'Un membre' : 'A member')} souhaite révéler vos photos privées.`
              : `${viewerName || 'A member'} would like to reveal your private photos.`}
          </p>
          <p className="text-foreground/50 text-xs mt-1 leading-relaxed">
            {isFr
              ? 'Vous décidez de les partager ou non. L\'approbation ne crée pas de connexion, de permission de message ni d\'obligation d\'interagir.'
              : 'You decide whether to share them. Approval does not create a connection, message permission, or any obligation to interact.'}
          </p>
        </div>
      </div>

      {daysLeft !== null && (
        <div className="flex items-center gap-1.5 text-foreground/40 text-xs">
          <Clock className="w-3 h-3" />
          {isFr
            ? `Expire dans ${daysLeft} jour${daysLeft !== 1 ? 's' : ''}`
            : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleRespond('approve')}
          disabled={busy}
          className="flex-1 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-full text-xs font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {isFr ? 'Approuver' : 'Approve photo reveal'}
        </button>
        <button
          onClick={() => handleRespond('decline')}
          disabled={busy}
          className="flex-1 py-2.5 glass-card rounded-full text-foreground/60 text-xs font-bold hover:text-foreground transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          {isFr ? 'Refuser' : 'Decline'}
        </button>
      </div>
    </div>
  );
}