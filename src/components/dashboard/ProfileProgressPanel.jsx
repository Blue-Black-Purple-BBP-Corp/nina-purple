import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Sparkles, MessageCircle, Award, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { computeChecklist, computeNewSinceReview, getCompletedFieldKeys } from '@/lib/profileChecklist';
import AmbassadorStatusCard from '@/components/dashboard/AmbassadorStatusCard';

// Dashboard panel showing profile completeness, what changed since the last
// review, key fields still to complete (with NEW badges on recently-added
// platform fields), and optional activities (community conversation + the
// Nina Purple Ambassador program). Every action triggers a refresh so the
// panel always reflects the latest state — the 360° feedback loop.
export default function ProfileProgressPanel({ profile, lang, onRefresh, onOpenEdit, onOpenPhotos }) {
  const navigate = useNavigate();
  const isFr = lang === 'fr';
  const [marking, setMarking] = useState(false);
  const [communityPostCount, setCommunityPostCount] = useState(null);

  const { incomplete, completeness } = computeChecklist(profile);
  const newSinceReview = computeNewSinceReview(profile);
  const hasReviewed = !!profile?.last_profile_review_date;

  // Fetch whether the user has started a community conversation (1 post is enough)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const posts = await base44.entities.ChatPost.filter({ author_id: user.id }, '-created_date', 1);
        if (active) setCommunityPostCount(posts.length);
      } catch {
        if (active) setCommunityPostCount(0);
      }
    })();
    return () => { active = false; };
  }, [profile?.id, profile?.updated_date]);

  const handleItemAction = (item) => {
    if (item.action?.modal === 'edit') onOpenEdit?.();
    else if (item.action?.modal === 'photos') onOpenPhotos?.();
    else if (item.action?.to) navigate(item.action.to);
  };

  const handleMarkReviewed = async () => {
    setMarking(true);
    try {
      const completedKeys = getCompletedFieldKeys(profile);
      await base44.functions.invoke('updateProfile', {
        last_profile_review_date: new Date().toISOString(),
        reviewed_fields: completedKeys,
      });
      onRefresh?.();
    } catch (e) {
      console.error('markReviewed failed:', e.message);
    } finally {
      setMarking(false);
    }
  };

  const communityDone = communityPostCount != null && communityPostCount > 0;
  // Ambassador is an opt-in program, not a profile field — don't block celebration on it
  const allDone = incomplete.length === 0 && communityDone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass-card rounded-2xl p-4 space-y-4"
    >
      {/* Header + progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-serif text-sm text-[#F0E6FF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F5A800]" />
            {isFr ? 'Votre parcours de profil' : 'Your Profile Journey'}
          </span>
          <span className="text-[#F5A800] font-bold text-sm">{completeness}%</span>
        </div>
        <div className="w-full bg-[rgba(240,230,255,0.05)] rounded-full h-1.5">
          <motion.div className="h-1.5 rounded-full bg-[#F5A800]"
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.8 }}
            style={{ boxShadow: '0 0 8px rgba(245,168,0,0.5)' }} />
        </div>
      </div>

      {allDone ? (
        <div className="text-center py-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[rgba(245,168,0,0.12)] flex items-center justify-center mb-2">
            <Check className="w-6 h-6 text-[#F5A800]" />
          </div>
          <p className="text-[#F0E6FF] text-sm font-medium">
            {isFr ? 'Votre profil est à jour' : 'Your profile is up to date'}
          </p>
          <p className="text-[#F0E6FF]/40 text-xs mt-1">
            {isFr ? 'Merci de cultiver une présence consciente.' : 'Thank you for cultivating a conscious presence.'}
          </p>
        </div>
      ) : (
        <>
          {/* Changes since last review — positive feedback loop */}
          {hasReviewed && newSinceReview.length > 0 && (
            <div>
              <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Check className="w-3 h-3 text-[#7B2FBE]" />
                {isFr ? 'Depuis votre dernière révision' : 'Since your last review'}
              </p>
              <div className="space-y-1.5">
                <AnimatePresence>
                  {newSinceReview.map(item => (
                    <motion.div key={item.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded-full bg-[rgba(123,47,190,0.2)] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#7B2FBE]" />
                      </div>
                      <span className="text-[#F0E6FF]/70">{isFr ? item.label_fr : item.label_en}</span>
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-[#7B2FBE] bg-[rgba(123,47,190,0.12)] px-1.5 py-0.5 rounded-full">
                        {isFr ? 'Nouveau' : 'New'}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Key things to complete */}
          {incomplete.length > 0 && (
            <div>
              <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">
                {isFr ? 'À compléter pour un profil à jour' : 'Complete for an up-to-date profile'}
              </p>
              <div className="space-y-1.5">
                {incomplete.map(item => (
                  <button key={item.key} onClick={() => handleItemAction(item)}
                    className="w-full flex items-center gap-2 text-left rounded-lg p-1.5 hover:bg-[rgba(240,230,255,0.04)] transition-all group">
                    <div className="w-4 h-4 rounded-full border border-[rgba(240,230,255,0.2)] shrink-0" />
                    <span className="text-[#F0E6FF]/65 text-xs flex-1">{isFr ? item.label_fr : item.label_en}</span>
                    {item.isNew && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[#F5A800] bg-[rgba(245,168,0,0.12)] px-1.5 py-0.5 rounded-full">
                        {isFr ? 'Nouveau' : 'New'}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional activities */}
          <div>
            <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">
              {isFr ? 'Activités optionnelles' : 'Optional activities'}
            </p>
            <div className="space-y-1.5">
              {/* Community conversation */}
              <button onClick={() => navigate('/community')}
                className="w-full flex items-center gap-2.5 text-left rounded-lg p-2 hover:bg-[rgba(240,230,255,0.04)] transition-all group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${communityDone ? 'bg-[rgba(123,47,190,0.2)]' : 'bg-[rgba(123,47,190,0.08)]'}`}>
                  {communityDone
                    ? <Check className="w-3.5 h-3.5 text-[#7B2FBE]" />
                    : <MessageCircle className="w-3.5 h-3.5 text-[#7B2FBE]" />}
                </div>
                <div className="flex-1">
                  <span className="text-[#F0E6FF]/70 text-xs block">
                    {isFr ? 'Lancer une conversation dans la communauté' : 'Start a conversation in the community'}
                  </span>
                  {communityDone && <span className="text-[#7B2FBE]/60 text-[10px]">{isFr ? 'Merci !' : 'Thank you!'}</span>}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#F0E6FF]/20 group-hover:text-[#7B2FBE] transition-colors" />
              </button>

              {/* Ambassador program — self-contained status card */}
              <AmbassadorStatusCard profile={profile} lang={lang} onRefresh={onRefresh} />
            </div>
          </div>

          {/* Mark as reviewed — resets the "since last review" feedback loop */}
          {(newSinceReview.length > 0 || incomplete.some(i => i.isNew)) && (
            <button onClick={handleMarkReviewed} disabled={marking}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[#F0E6FF]/40 hover:text-[#F0E6FF]/70 text-xs transition-colors disabled:opacity-50">
              {marking
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
              {isFr ? "J'ai revu mon profil" : "I've reviewed my profile"}
            </button>
          )}
        </>
      )}

    </motion.div>
  );
}