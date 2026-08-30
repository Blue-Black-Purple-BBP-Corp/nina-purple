import React from 'react';
import { Crown } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

// Permanent Founding Member badge — violet, distinct from plan/tier indicators.
// Shown on profile cards, the user's own profile, and message threads.
export default function FoundingMemberBadge({ variant = 'icon' }) {
  const { lang } = useLang();
  const label = lang === 'fr' ? 'Membre Fondateur' : 'Founding Member';

  if (variant === 'full') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{
          background: 'rgba(123,47,190,0.15)',
          border: '1px solid rgba(123,47,190,0.45)',
          color: '#A855F7',
          boxShadow: '0 0 12px rgba(123,47,190,0.15)',
        }}
        title={label}
      >
        <Crown className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  }

  // icon variant — compact, for card rows
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{
        background: 'rgba(123,47,190,0.15)',
        border: '1px solid rgba(123,47,190,0.4)',
        color: '#A855F7',
      }}
      title={label}
    >
      <Crown className="w-3 h-3" />
      {lang === 'fr' ? 'Fondateur' : 'Founding'}
    </span>
  );
}