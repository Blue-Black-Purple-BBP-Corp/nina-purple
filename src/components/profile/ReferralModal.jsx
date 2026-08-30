import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Mail, Users, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ReferralModal({ isOpen, onClose, userProfile, lang }) {
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    base44.functions.invoke('getReferralCode', {})
      .then((res) => { if (active) setData(res.data || res); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const code = data?.code || '•••';
  const link = data?.link || '';
  const reward = data?.reward_bbp || 5;
  const stats = data?.stats || { total: 0, rewarded: 0, pending: 0, points_earned: 0 };
  const isFr = lang === 'fr';

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Inviter des amis' : 'Invite Friends'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          <div className="glass-card-gold rounded-2xl p-4 text-center space-y-1">
            <p className="text-[#F5A800] font-serif text-2xl font-bold">+{reward} BBP</p>
            <p className="text-[#F0E6FF]/60 text-sm">
              {isFr ? `($${reward} USD) par ami qui complète son inscription` : `($${reward} USD) per friend who completes signup`}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card rounded-xl p-3 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-[#7B2FBE]" />
              <p className="text-[#F0E6FF] font-serif text-lg font-bold">{stats.total}</p>
              <p className="text-[#F0E6FF]/40 text-[10px]">{isFr ? 'Invités' : 'Invited'}</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <Check className="w-4 h-4 mx-auto mb-1 text-[#F5A800]" />
              <p className="text-[#F0E6FF] font-serif text-lg font-bold">{stats.rewarded}</p>
              <p className="text-[#F0E6FF]/40 text-[10px]">{isFr ? 'Récompensés' : 'Rewarded'}</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <Award className="w-4 h-4 mx-auto mb-1 text-[#A855F7]" />
              <p className="text-[#F0E6FF] font-serif text-lg font-bold">{stats.points_earned}</p>
              <p className="text-[#F0E6FF]/40 text-[10px]">{isFr ? 'BBP gagnés' : 'BBP earned'}</p>
            </div>
          </div>

          {/* Referral code */}
          <div>
            <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">{isFr ? 'Votre code' : 'Your code'}</p>
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-[#F5A800] font-serif font-bold text-lg tracking-wider flex-1">{loading ? '…' : code}</span>
            </div>
          </div>

          {/* Link */}
          <div>
            <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">{isFr ? 'Votre lien' : 'Your link'}</p>
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-[#F0E6FF]/60 text-xs truncate flex-1">{loading ? '…' : link}</span>
              <button onClick={copy} disabled={!link} className="shrink-0 text-[#F5A800] hover:opacity-80 transition-opacity disabled:opacity-40">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a href={`mailto:?subject=${encodeURIComponent(isFr ? 'Rejoins-moi sur Nina Purple' : 'Join me on Nina Purple')}&body=${encodeURIComponent((isFr ? 'Je pense que tu aimerais ça — ' : "I think you'd love this — ") + link)}`}
            className="w-full py-3 glass-card rounded-full flex items-center justify-center gap-2 text-[#F0E6FF]/70 hover:text-[#F5A800] transition-colors text-sm">
            <Mail className="w-4 h-4" />
            {isFr ? 'Inviter par courriel' : 'Invite by email'}
          </a>

          <p className="text-[#F0E6FF]/30 text-xs text-center leading-relaxed">
            {isFr
              ? `Votre ami doit compléter son inscription pour déclencher la récompense. Vous gagnez ${reward} BBP ($${reward}) pour chaque inscription complétée.`
              : `Your friend must complete signup to trigger the reward. You earn ${reward} BBP ($${reward}) for each completed signup.`}
          </p>
        </div>
      </div>
    </>
  );
}