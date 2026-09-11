import React from 'react';
import { ATTACHMENT_META, BIG5_TRAITS, traitLevel, LEVEL_LABEL } from '@/lib/compatibilityQuiz';

// Compact summary of the member's attachment style + Big Five results.
// Shown directly on the Profile page inside the Compatibility Profile card,
// so members see their results without navigating to a separate page.
export default function CompatibilitySummaryCard({ profile, lang }) {
  const isFr = lang === 'fr';
  const hasAttachment = !!profile?.attachment_style;
  const hasBig5 = profile?.big5_openness != null;

  if (!hasAttachment && !hasBig5) return null;

  const attachmentMeta = hasAttachment ? ATTACHMENT_META[profile.attachment_style] : null;

  return (
    <div className="space-y-3">
      {attachmentMeta && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#F0E6FF]/40 shrink-0">
            {isFr ? 'Attachement' : 'Attachment'}
          </span>
          <span className="text-sm font-medium" style={{ color: attachmentMeta.color }}>
            {isFr ? attachmentMeta.fr : attachmentMeta.en}
          </span>
        </div>
      )}
      {hasBig5 && (
        <div className="space-y-1.5">
          {BIG5_TRAITS.map(t => {
            const score = profile?.[`big5_${t.key}`] ?? 0;
            const lvl = traitLevel(score);
            return (
              <div key={t.key} className="flex items-center gap-2">
                <span className="text-[10px] w-20 shrink-0 text-[#F0E6FF]/50">{isFr ? t.fr : t.en}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[rgba(240,230,255,0.06)] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7B2FBE] to-[#F5A800]" style={{ width: `${(score / 5) * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold w-14 text-right text-[#F5A800]">{LEVEL_LABEL[lvl][isFr ? 'fr' : 'en']}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}