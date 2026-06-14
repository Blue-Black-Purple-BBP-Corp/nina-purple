import React, { useState } from 'react';
import { X, Copy, Check, Mail } from 'lucide-react';

export default function ReferralModal({ isOpen, onClose, userProfile, lang }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralLink = `https://www.NinaPurple.love/onboarding?ref=${userProfile?.user_id?.slice(-8) || 'friend'}`;

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Inviter des amis' : 'Invite Friends'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          <div className="glass-card-gold rounded-2xl p-4 text-center space-y-1">
            <p className="text-[#F5A800] font-serif text-2xl font-bold">+50 BBP</p>
            <p className="text-[#F0E6FF]/60 text-sm">
              {lang === 'fr' ? 'par ami qui complète son profil' : 'per friend who completes their profile'}
            </p>
          </div>

          <div>
            <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">{lang === 'fr' ? 'Votre lien' : 'Your link'}</p>
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-[#F0E6FF]/60 text-xs truncate flex-1">{referralLink}</span>
              <button onClick={copy} className="shrink-0 text-[#F5A800] hover:opacity-80 transition-opacity">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a href={`mailto:?subject=Join me on Nina Purple&body=I think you'd love this — ${referralLink}`}
            className="w-full py-3 glass-card rounded-full flex items-center justify-center gap-2 text-[#F0E6FF]/70 hover:text-[#F5A800] transition-colors text-sm">
            <Mail className="w-4 h-4" />
            {lang === 'fr' ? 'Inviter par courriel' : 'Invite by email'}
          </a>
        </div>
      </div>
    </>
  );
}