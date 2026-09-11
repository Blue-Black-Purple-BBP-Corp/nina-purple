import React, { useState } from 'react';
import { X, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Reusable modal for submitting a peer vouch.
// method = "event" (cross-checks EventAttendance) or "contact" (email/phone lookup).
export default function PeerVouchModal({ isOpen, onClose, method = 'contact', eventId = null, eventTitle = null }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const isEventMethod = method === 'event';

  const handleSubmit = async () => {
    if (!identifier.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = { method };
      // Treat the input as email if it contains '@', otherwise phone.
      const trimmed = identifier.trim();
      if (trimmed.includes('@')) {
        payload.contact_email = trimmed;
      } else {
        payload.contact_phone = trimmed;
      }
      if (isEventMethod && eventId) {
        payload.event_id = eventId;
      }
      await base44.functions.invoke('submitPeerVouch', payload);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setIdentifier('');
      }, 1500);
    } catch (e) {
      setError(e.message || (isFr ? 'Une erreur est survenue' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIdentifier('');
    onClose();
  };

  const inputClass = "w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] bg-transparent placeholder-[rgba(240,230,255,0.25)]";

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={handleClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-purple-500/30 flex flex-col pointer-events-auto animate-fade-in-up">

          <div className="px-5 pt-5 pb-4 border-b border-purple-900/50 flex justify-between items-center bg-[#2D1B36] rounded-t-3xl shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7B2FBE]" />
              <h2 className="text-lg font-serif text-[#F0E6FF]">
                {isFr ? 'Garantir un membre' : 'Vouch for a member'}
              </h2>
            </div>
            <button onClick={handleClose} className="text-purple-300 hover:text-white transition-colors p-2 -mr-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {success ? (
              <div className="text-center py-8">
                <ShieldCheck className="w-12 h-12 text-[#7B2FBE] mx-auto mb-3" />
                <p className="text-[#F0E6FF] font-medium">
                  {isFr ? 'Garantie enregistrée !' : 'Vouch submitted!'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[#F0E6FF]/60 text-sm leading-relaxed">
                  {isEventMethod
                    ? (isFr
                      ? `Confirmez que vous avez bien rencontré cette personne à "${eventTitle || 'cet événement'}". Entrez son email ou son numéro de téléphone pour l'identifier.`
                      : `Confirm you met this person at "${eventTitle || 'this event'}". Enter their email or phone number to identify them.`)
                    : (isFr
                      ? "Entrez l'email ou le numéro de téléphone d'un membre que vous connaissez personnellement pour garantir qu'il s'agit d'une vraie personne."
                      : "Enter the email or phone number of a member you know personally to vouch they are a real person.")}
                </p>

                <div>
                  <label className="block text-[#F0E6FF]/50 text-xs uppercase tracking-wide mb-1">
                    {isFr ? 'Email ou téléphone du membre' : 'Member email or phone'}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className={inputClass}
                    placeholder={isFr ? 'email@exemple.com ou +1234567890' : 'email@example.com or +1234567890'}
                    disabled={submitting}
                    onKeyDown={e => { if (e.key === 'Enter' && !submitting) handleSubmit(); }}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !identifier.trim()}
                  className="w-full py-3.5 bg-[#7B2FBE] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#9236d8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {submitting
                    ? (isFr ? 'Envoi…' : 'Submitting…')
                    : (isFr ? 'Garantir' : 'Vouch')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}