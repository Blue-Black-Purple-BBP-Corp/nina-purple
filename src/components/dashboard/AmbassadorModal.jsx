import React, { useState } from 'react';
import { Heart, Loader2, Sparkles, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Modal for the Nina Purple Ambassador ("Ambassador for humanity") opt-in.
// On confirm, calls the becomeAmbassador backend function which sets the flag
// server-side, notifies admins by email, and logs an admin notification.
export default function AmbassadorModal({ isOpen, onClose, lang, onDone }) {
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);
  if (!isOpen) return null;

  const isFr = lang === 'fr';

  const handleConfirm = async () => {
    setSigning(true);
    try {
      await base44.functions.invoke('becomeAmbassador', {});
      setDone(true);
      onDone?.();
      setTimeout(() => { setDone(false); onClose(); }, 1800);
    } catch (e) {
      console.error('becomeAmbassador failed:', e.message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-0 md:px-6"
      style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-[#1F1026] rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-[#7B2FBE]" />
            </div>
            <h2 className="font-serif text-lg text-[#F0E6FF]">
              {isFr ? 'Ambassadeur Nina Purple' : 'Nina Purple Ambassador'}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] text-xl">✕</button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(123,47,190,0.2)] flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#7B2FBE]" />
            </div>
            <h3 className="font-serif text-xl text-[#F0E6FF] mb-2">
              {isFr ? 'Bienvenue dans le mouvement' : 'Welcome to the movement'}
            </h3>
            <p className="text-[#F0E6FF]/50 text-sm">
              {isFr
                ? "Merci de porter l'amour conscient plus loin. Nous vous contacterons bientôt."
                : 'Thank you for carrying conscious love further. We will be in touch soon.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[#F0E6FF]/70 text-sm leading-relaxed mb-4">
              {isFr
                ? "Les ambassadeurs sont le cœur battant de Nina Purple. Vous croyez que les relations saines sont une expérience vécue, et vous voulez que d'autres en bénéficient."
                : 'Ambassadors are the beating heart of Nina Purple. You believe healthy relationships are a lived experience, and you want others to benefit too.'}
            </p>
            <div className="space-y-2.5 mb-5">
              {[
                isFr ? 'Inviter des personnes alignées sur nos valeurs' : 'Invite people aligned with our values',
                isFr ? 'Partager votre expérience en toute authenticité' : 'Share your experience authentically',
                isFr ? 'Aider la communauté à grandir en profondeur' : 'Help the community grow in depth',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[#F0E6FF]/65 text-sm">
                  <Sparkles className="w-4 h-4 text-[#F5A800] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-[rgba(245,168,0,0.06)] border border-[rgba(245,168,0,0.15)] mb-5">
              <p className="text-[#F0E6FF]/50 text-xs leading-relaxed text-center">
                {isFr ? '❤️ Ambassadeur pour l' + "'humanité" : '❤️ Ambassador for humanity'}
              </p>
            </div>
            <button onClick={handleConfirm} disabled={signing}
              className="w-full py-3.5 bg-[#7B2FBE] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#6929a8] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {signing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Inscription...' : 'Signing up...'}</>
                : (isFr ? 'Devenir ambassadeur' : 'Become an Ambassador')}
            </button>
            <button onClick={onClose}
              className="w-full mt-2 py-2.5 text-[#F0E6FF]/40 text-xs hover:text-[#F0E6FF]/60 transition-colors">
              {isFr ? 'Peut-être plus tard' : 'Maybe later'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}