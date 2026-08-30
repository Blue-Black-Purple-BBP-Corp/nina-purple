import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// Displays the stored Connection Brief (tiered conversation-starter questions)
// inside a conversation thread. Only renders when a brief exists, i.e. after
// mutual opt-in. Free of charge — a feature of matching, not a chargeable interaction.
export default function ConnectionBriefCard({ connectionId, lang }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!connectionId) return;
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getConnectionBrief', { connection_id: connectionId });
        if (active) setBrief(res.data?.brief || null);
      } catch (e) {
        console.warn('getConnectionBrief failed:', e.message);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [connectionId]);

  if (loading || !brief) return null;

  const tiers = [
    { key: 'critical', label_en: 'Foundational', label_fr: 'Essentielles', color: '#F5A800' },
    { key: 'moderate', label_en: 'Going Deeper', label_fr: 'À approfondir', color: '#A855F7' },
    { key: 'light', label_en: 'Icebreakers', label_fr: 'Brise-glace', color: '#7B2FBE' },
  ];

  return (
    <div className="px-4 py-2">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full glass-card-gold rounded-2xl px-4 py-3 flex items-center gap-2 text-left transition-all">
        <Sparkles className="w-4 h-4 text-[#F5A800] shrink-0" />
        <span className="text-[#F0E6FF] text-sm font-medium flex-1">
          {lang === 'fr' ? 'Votre guide de conversation' : 'Your conversation guide'}
        </span>
        <span className="text-[#F0E6FF]/40 text-xs">
          {lang === 'fr' ? 'Questions pour démarrer' : 'Starter questions'}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-[#F0E6FF]/40" /> : <ChevronDown className="w-4 h-4 text-[#F0E6FF]/40" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2.5">
          {tiers.map((tier) => {
            const qs = brief[tier.key] || [];
            if (qs.length === 0) return null;
            return (
              <div key={tier.key} className="glass-card rounded-2xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: tier.color }}>
                  {lang === 'fr' ? tier.label_fr : tier.label_en}
                </p>
                <ul className="space-y-2">
                  {qs.map((q, j) => (
                    <li key={j} className="text-[#F0E6FF]/70 text-sm leading-relaxed flex gap-2">
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `${tier.color}18`, color: tier.color }}>{j + 1}</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}