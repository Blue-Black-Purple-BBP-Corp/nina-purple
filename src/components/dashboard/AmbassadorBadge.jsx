import React from 'react';
import { Award } from 'lucide-react';

// Verified ambassador badge — shown on the profile page when is_ambassador is true.
// Small, elegant, with a tooltip explaining what it means.
export default function AmbassadorBadge({ lang }) {
  const isFr = lang === 'fr';
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(245,168,0,0.1)',
        border: '1px solid rgba(245,168,0,0.3)',
        boxShadow: '0 0 12px rgba(245,168,0,0.1)',
      }}
      title={isFr
        ? 'Ambassadeur vérifié Nina Purple — Ambassador for humanity'
        : 'Verified Nina Purple Ambassador — Ambassador for humanity'}
    >
      <Award className="w-3.5 h-3.5 text-[#F5A800]" />
      <span className="text-xs font-semibold text-[#F5A800]">
        {isFr ? 'Ambassadeur' : 'Ambassador'}
      </span>
      <span className="text-[10px] text-[#F5A800]/60">❤️</span>
    </div>
  );
}