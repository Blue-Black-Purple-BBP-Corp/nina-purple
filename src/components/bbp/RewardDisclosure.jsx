import React from 'react';
import { Award, Clock, AlertCircle, Check } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function RewardDisclosure({ rewardAmount, qualification, pendingWindow, cancellationNote }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';

  if (!rewardAmount) return null;

  return (
    <div className="glass-card-gold rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-[#F5A800]" />
        <span className="text-[#F5A800] font-medium text-sm">
          {isFr ? `Récompense BBP: ${rewardAmount} BBP ($${rewardAmount})` : `BBP Reward: ${rewardAmount} BBP ($${rewardAmount})`}
        </span>
      </div>
      {qualification && (
        <div className="flex items-start gap-2 text-xs text-[#F0E6FF]/60 leading-relaxed">
          <Check className="w-3 h-3 text-[#F5A800]/60 shrink-0 mt-0.5" />
          <span>{isFr ? qualification.fr : qualification.en}</span>
        </div>
      )}
      {pendingWindow && (
        <div className="flex items-start gap-2 text-xs text-[#F0E6FF]/60 leading-relaxed">
          <Clock className="w-3 h-3 text-[#F5A800]/60 shrink-0 mt-0.5" />
          <span>{isFr ? pendingWindow.fr : pendingWindow.en}</span>
        </div>
      )}
      {cancellationNote && (
        <div className="flex items-start gap-2 text-xs text-[#F0E6FF]/50 leading-relaxed">
          <AlertCircle className="w-3 h-3 text-[#F0E6FF]/30 shrink-0 mt-0.5" />
          <span>{isFr ? cancellationNote.fr : cancellationNote.en}</span>
        </div>
      )}
    </div>
  );
}