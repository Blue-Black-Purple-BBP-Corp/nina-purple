import React, { useState } from 'react';
import { Heart, Check, Loader2, Clock, AlertCircle } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

export default function MeetupConfirmationButton({ connectionId, userId, otherUserId }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [status, setStatus] = useState('idle'); // idle, submitting, confirmed, pending, error
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setStatus('submitting');
    setError('');
    try {
      const res = await base44.functions.invoke('submitMeetupConfirmation', {
        connection_id: connectionId,
        reporter_native_user_id: userId,
        counterpart_native_user_id: otherUserId,
      });
      if (res.data?.mutual_confirmed) {
        setStatus('confirmed');
      } else if (res.data?.reporter_status === 'confirmed') {
        setStatus('pending');
      } else {
        setError(res.data?.reason || (isFr ? 'Erreur inconnue.' : 'Unknown error.'));
        setStatus('error');
      }
    } catch (e) {
      setError(e.message || (isFr ? 'Erreur lors de la confirmation.' : 'Error during confirmation.'));
      setStatus('error');
    }
  };

  if (status === 'confirmed') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs">
        <Check className="w-3.5 h-3.5" />
        {isFr ? 'Rencontre confirmée mutuellement' : 'Meetup mutually confirmed'}
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A800]/10 border border-[#F5A800]/30 text-[#F5A800] text-xs">
        <Clock className="w-3.5 h-3.5" />
        {isFr ? 'En attente de la confirmation de l\'autre membre' : 'Waiting for the other member to confirm'}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </div>
      )}
      <button
        onClick={handleConfirm}
        disabled={status === 'submitting'}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(123,47,190,0.1)] border border-[rgba(123,47,190,0.3)] text-[#7B2FBE] text-xs font-medium hover:bg-[rgba(123,47,190,0.2)] transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className="w-3.5 h-3.5" />}
        {isFr ? 'On s\'est rencontrés' : 'We\'ve met'}
      </button>
    </div>
  );
}