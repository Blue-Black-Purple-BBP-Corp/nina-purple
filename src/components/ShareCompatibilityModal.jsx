import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Check, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Sends the member's attachment-style result to an existing unlocked connection
// via the existing sendMessage backend function. No public/external sharing —
// only connections the member has already unlocked can receive the message.
export default function ShareCompatibilityModal({ isOpen, onClose, attachment, displayName }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [connections, setConnections] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null); // connection id being sent to
  const [sent, setSent] = useState(null); // connection id that succeeded
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const user = await base44.auth.me();
        const conns = await base44.entities.Connection.filter({ from_user_id: user.id });
        // Only unlocked, non-blocked connections can receive a message
        const eligible = conns.filter(c => c.is_unlocked && c.status !== 'blocked');
        setConnections(eligible);
        if (eligible.length > 0) {
          const toIds = [...new Set(eligible.map(c => c.to_user_id))];
          try {
            const res = await base44.functions.invoke('getConnectionProfiles', { user_ids: toIds });
            setProfileMap(res.data?.profiles || {});
          } catch (e) {
            console.warn('getConnectionProfiles failed:', e.message);
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const styleLabels = {
    secure: isFr ? 'Sécurisé' : 'Secure',
    anxious: isFr ? 'Anxieux' : 'Anxious',
    avoidant: isFr ? 'Évitant' : 'Avoidant',
    fearful: isFr ? 'Craintif' : 'Fearful',
  };

  const buildMessage = () => {
    const styleLabel = styleLabels[attachment?.style] || attachment?.style || '—';
    const anxiety = attachment?.anxiety != null ? attachment.anxiety.toFixed(1) : '—';
    const avoidance = attachment?.avoidance != null ? attachment.avoidance.toFixed(1) : '—';
    if (isFr) {
      return `Je souhaite partager mon profil de compatibilité avec vous.\n\nMon style d'attachement : ${styleLabel}\nAnxiété : ${anxiety}/7 · Évitement : ${avoidance}/7\n\n— ${displayName || ''}`.trim();
    }
    return `I'd like to share my compatibility profile with you.\n\nMy attachment style: ${styleLabel}\nAnxiety: ${anxiety}/7 · Avoidance: ${avoidance}/7\n\n— ${displayName || ''}`.trim();
  };

  const handleSend = async (conn) => {
    setSending(conn.id);
    setError('');
    try {
      await base44.functions.invoke('sendMessage', {
        conversation_id: conn.id,
        to_user_id: conn.to_user_id,
        content: buildMessage(),
      });
      setSent(conn.id);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('membership_required') || msg.includes('membership')) {
        setError(isFr ? 'Une adhésion active est requise pour envoyer des messages.' : 'An active membership is required to send messages.');
      } else if (msg.includes('insufficient') || msg.includes('credits')) {
        setError(isFr ? 'Crédits insuffisants pour démarrer cette conversation.' : 'Insufficient credits to start this conversation.');
      } else {
        setError(msg || (isFr ? "Échec de l'envoi." : 'Failed to send.'));
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-[#1F1026] w-full sm:max-w-md max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[rgba(123,47,190,0.3)] flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-[rgba(123,47,190,0.2)] flex justify-between items-center shrink-0">
            <div>
              <h2 className="font-serif text-lg text-[#F0E6FF]">
                {isFr ? 'Partager avec une connexion' : 'Share with a connection'}
              </h2>
              <p className="text-[#F0E6FF]/50 text-xs mt-0.5">
                {isFr ? 'Envoie votre style d\u2019attachement par message privé' : 'Sends your attachment style via private message'}
              </p>
            </div>
            <button onClick={onClose} className="text-[#F0E6FF]/50 hover:text-[#F0E6FF] transition-colors p-2 -mr-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Lock className="w-8 h-8 text-[#F0E6FF]/30 mx-auto" />
                <p className="text-[#F0E6FF]/50 text-sm leading-relaxed">
                  {isFr
                    ? "Vous n'avez pas encore de connexion déverrouillée. Déverrouillez d'abord un profil pour partager vos résultats."
                    : "You don't have an unlocked connection yet. Unlock a profile first to share your results."}
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {connections.map(conn => {
                  const prof = profileMap[conn.to_user_id];
                  const name = prof?.display_name || prof?.full_name || '—';
                  const isSent = sent === conn.id;
                  const isSending = sending === conn.id;
                  return (
                    <div key={conn.id}
                      className="glass-card rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
                        <span className="text-[#F0E6FF] text-sm font-medium">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F0E6FF] text-sm font-medium truncate">{name}</p>
                        <p className="text-[#F0E6FF]/40 text-xs">
                          {isFr ? 'Connexion déverrouillée' : 'Unlocked connection'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSend(conn)}
                        disabled={isSent || isSending}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          isSent
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400'
                        }`}>
                        {isSent ? (
                          <><Check className="w-3.5 h-3.5" /> {isFr ? 'Envoyé' : 'Sent'}</>
                        ) : isSending ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> …</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" /> {isFr ? 'Envoyer' : 'Send'}</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[rgba(123,47,190,0.2)] shrink-0">
            <button onClick={onClose}
              className="w-full py-3 glass-card rounded-full text-[#F0E6FF]/70 text-sm font-medium hover:text-[#F0E6FF] transition-colors">
              {isFr ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}