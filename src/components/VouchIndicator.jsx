import React from 'react';
import { ShieldCheck } from 'lucide-react';

// Simple "Vouched for by N members" indicator — no badges, no scoring, no points.
export default function VouchIndicator({ count, lang }) {
  if (!count || count < 1) return null;
  const isFr = lang === 'fr';
  const label = count === 1
    ? (isFr ? 'Garanti par 1 membre' : 'Vouched for by 1 member')
    : (isFr ? `Garanti par ${count} membres` : `Vouched for by ${count} members`);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-[rgba(123,47,190,0.25)] bg-[rgba(123,47,190,0.08)] text-[#7B2FBE]">
      <ShieldCheck className="w-3 h-3" />
      {label}
    </div>
  );
}