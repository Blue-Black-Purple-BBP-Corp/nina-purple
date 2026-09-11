import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Share2, Sparkles, Check, Edit3, Heart, RefreshCw, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';
import { ninaIcon } from '@/lib/images';
import CompatibilityResultCard from '@/components/CompatibilityResultCard';
import EditProfileModal from '@/components/profile/EditProfileModal';
import ShareCompatibilityModal from '@/components/ShareCompatibilityModal';
import { getArchetypeLabel } from '@/lib/archetypes';
import {
  ECRS_ITEMS, BIG5_ITEMS, LIKERT_7, LIKERT_5,
  scoreAttachment, scoreBigFive, traitLevel, LEVEL_LABEL, BIG5_TRAITS,
} from '@/lib/compatibilityQuiz';

const RAW_STORAGE_KEY = 'nina_compatibility_raw';

// Ordered quiz: ECR-S first, then Mini-IPIP
const QUIZ_ITEMS = [
  ...ECRS_ITEMS.map((i) => ({ ...i, scale: 'ecr' })),
  ...BIG5_ITEMS.map((i) => ({ ...i, scale: 'b5' })),
];

export default function CompatibilityProfile() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isFr = lang === 'fr';

  const [phase, setPhase] = useState('loading'); // loading | intro | quiz | results
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [result, setResult] = useState(null); // { attachment, big5 }
  const [userProfile, setUserProfile] = useState(null);
  const [matchingAnswers, setMatchingAnswers] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [retakeConfirm, setRetakeConfirm] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        const profile = profiles[0];
        if (profile) setUserProfile(profile);
        try {
          const ma = await base44.entities.MatchingAnswers.filter({ user_id: user.id });
          setMatchingAnswers(ma[0] || null);
        } catch (e) { /* non-fatal */ }
        if (profile?.display_name) setDisplayName(profile.display_name);
        if (profile?.attachment_style) {
          // Already completed — reconstruct results from stored tags
          setResult({
            attachment: { style: profile.attachment_style, anxiety: profile.attachment_anxiety, avoidance: profile.attachment_avoidance },
            big5: {
              openness: profile.big5_openness,
              conscientiousness: profile.big5_conscientiousness,
              extraversion: profile.big5_extraversion,
              agreeableness: profile.big5_agreeableness,
              neuroticism: profile.big5_neuroticism,
            },
          });
          setPhase('results');
        } else {
          setPhase('intro');
        }
      } catch (e) {
        setPhase('intro');
      }
    })();
  }, []);

  const handleAnswer = (value) => {
    const item = QUIZ_ITEMS[index];
    const next = { ...answers, [item.id]: value };
    setAnswers(next);
    if (index < QUIZ_ITEMS.length - 1) {
      setTimeout(() => setIndex((i) => i + 1), 220);
    } else {
      finish(next);
    }
  };

  const finish = async (allAnswers) => {
    setSyncing(true);
    const attachment = scoreAttachment(allAnswers);
    const big5 = scoreBigFive(allAnswers);

    // Store raw answers on-device only
    try {
      localStorage.setItem(RAW_STORAGE_KEY, JSON.stringify(allAnswers));
    } catch (e) { /* ignore quota errors */ }

    // Sync the derived tags + completion metadata to the profile
    const nowIso = new Date().toISOString();
    try {
      await base44.functions.invoke('updateProfile', {
        attachment_style: attachment.style,
        attachment_anxiety: attachment.anxiety,
        attachment_avoidance: attachment.avoidance,
        big5_openness: big5.openness,
        big5_conscientiousness: big5.conscientiousness,
        big5_extraversion: big5.extraversion,
        big5_agreeableness: big5.agreeableness,
        big5_neuroticism: big5.neuroticism,
        compatibility_updated_at: nowIso,
        compatibility_last_completed_at: nowIso,
        compatibility_edit_status: 'saved',
      });
    } catch (e) {
      console.error('updateProfile (compatibility) failed:', e.message);
    }

    setResult({ attachment, big5 });
    setSyncing(false);
    setPhase('results');
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0B0510', scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      // Try native share with image, else download
      if (navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'nina-compatibility-profile.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Nina Purple', text: isFr ? 'Mon profil de compatibilité' : 'My compatibility profile' });
            return;
          }
        } catch (e) { /* fall through to download */ }
      }
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'nina-compatibility-profile.png';
      a.click();
    } catch (e) {
      console.error('Share failed:', e.message);
    }
  };

  // Retake: permanently clears all compatibility results and restarts the quiz.
  // Requires a two-step confirmation — the first click opens the dialog, the
  // second click (inside the dialog) confirms the irreversible deletion.
  const handleRetake = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('updateProfile', {
        attachment_style: null,
        attachment_anxiety: null,
        attachment_avoidance: null,
        big5_openness: null,
        big5_conscientiousness: null,
        big5_extraversion: null,
        big5_agreeableness: null,
        big5_neuroticism: null,
        compatibility_updated_at: null,
        compatibility_last_completed_at: null,
        compatibility_edit_status: 'not_started',
      });
    } catch (e) {
      console.error('Retake: failed to clear results:', e.message);
    }
    try { localStorage.removeItem(RAW_STORAGE_KEY); } catch (e) {}
    setAnswers({});
    setIndex(0);
    setResult(null);
    setUserProfile(prev => prev ? {
      ...prev,
      attachment_style: null, attachment_anxiety: null, attachment_avoidance: null,
      big5_openness: null, big5_conscientiousness: null, big5_extraversion: null,
      big5_agreeableness: null, big5_neuroticism: null,
      compatibility_updated_at: null, compatibility_last_completed_at: null,
      compatibility_edit_status: 'not_started',
    } : prev);
    setSyncing(false);
    setRetakeConfirm(false);
    setPhase('intro');
  };

  const allAnswered = QUIZ_ITEMS.every((i) => answers[i.id] != null);
  const currentItem = QUIZ_ITEMS[index];
  const likert = currentItem?.scale === 'ecr' ? LIKERT_7 : LIKERT_5;
  const progress = (index / QUIZ_ITEMS.length) * 100;

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0510] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.5 }}
              className="w-full text-center space-y-6">
              <img src={ninaIcon} alt="Nina" className="w-20 h-20 mx-auto object-contain drop-shadow-[0_0_30px_rgba(123,47,190,0.5)]" />
              <div>
                <h1 className="font-serif text-3xl text-[#F0E6FF] mb-3">
                  {isFr ? 'Votre Profil de Compatibilité' : 'Your Compatibility Profile'}
                </h1>
                <p className="text-[#F0E6FF]/60 text-sm leading-relaxed max-w-md mx-auto">
                  {isFr
                    ? "Un exercice de découverte de soi en deux parties pour mieux vous comprendre. Ceci est pour votre propre réflexion — cela n'affecte pas vos correspondances."
                    : "A two-part self-discovery exercise to help you understand yourself better. This is for your own reflection — it does not affect your matches."}
                </p>
              </div>

              <div className="glass-card rounded-2xl p-4 text-left space-y-4 max-w-md mx-auto">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F5A800] shrink-0" />
                    <div className="text-[#F0E6FF] text-sm font-medium">
                      {isFr ? 'Partie 1 — Style d\u2019attachement (ECR-S)' : 'Part 1 — Attachment style (ECR-S)'}
                    </div>
                  </div>
                  <p className="text-[#F0E6FF]/50 text-xs leading-relaxed pl-6">
                    {isFr
                      ? "12 questions · échelle de 1 à 7. Révèle comment vous vous connectez, faites confiance et réagissez dans vos relations intimes."
                      : "12 questions · 1 to 7 scale. Reveals how you connect, trust, and respond in close relationships."}
                  </p>
                </div>
                <div className="h-px bg-[rgba(240,230,255,0.06)]" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7B2FBE] shrink-0" />
                    <div className="text-[#F0E6FF] text-sm font-medium">
                      {isFr ? 'Partie 2 — Personnalité (Mini-IPIP)' : 'Part 2 — Big Five personality (Mini-IPIP)'}
                    </div>
                  </div>
                  <p className="text-[#F0E6FF]/50 text-xs leading-relaxed pl-6">
                    {isFr
                      ? "20 questions · échelle de 1 à 5. Carte votre personnalité selon cinq dimensions : ouverture, conscience, extraversion, agréabilité et névrotisme."
                      : "20 questions · 1 to 5 scale. Maps your personality across five dimensions: openness, conscientiousness, extraversion, agreeableness, and neuroticism."}
                  </p>
                </div>
              </div>

              <div className="text-[#F0E6FF]/40 text-xs max-w-md mx-auto leading-relaxed">
                {isFr
                  ? "Ce n\u2019est pas un formulaire d\u2019admission obligatoire — c\u2019est un exercice réflexif que vous pouvez reprendre à tout moment. Vos réponses brutes restent sur votre appareil ; seuls les résultats dérivés sont enregistrés sur votre compte."
                  : "This is not a mandatory intake form — it's a reflective exercise you can revisit anytime. Your raw answers stay on your device; only the derived results are saved to your account."}
              </div>

              <button onClick={() => { setIndex(0); setPhase('quiz'); }}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.3)]">
                {isFr ? 'Commencer' : 'Begin'}
              </button>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === 'quiz' && (
            <motion.div key={`q-${index}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}
              className="w-full space-y-6">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <span className="text-[#F0E6FF]/40 text-sm shrink-0">{index + 1} / {QUIZ_ITEMS.length}</span>
                <div className="flex-1 h-1 rounded-full bg-[rgba(240,230,255,0.06)] overflow-hidden">
                  <div className="h-full bg-[#F5A800] rounded-full transition-all duration-300" style={{ width: `${((index + 1) / QUIZ_ITEMS.length) * 100}%` }} />
                </div>
              </div>

              {/* Section badge */}
              <div className="text-center">
                <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: currentItem.scale === 'ecr' ? '#7B2FBE' : '#F5A800' }}>
                  {currentItem.scale === 'ecr'
                    ? (isFr ? 'Attachement' : 'Attachment')
                    : (isFr ? 'Personnalité' : 'Personality')}
                </span>
              </div>

              {/* Question */}
              <h2 className="font-serif text-2xl text-[#F0E6FF] leading-relaxed text-center min-h-[5rem]">
                {isFr ? currentItem.fr : currentItem.en}
              </h2>

              {/* Likert scale */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  {Array.from({ length: likert.max }, (_, i) => i + 1).map((val) => {
                    const selected = answers[currentItem.id] === val;
                    return (
                      <button key={val} onClick={() => handleAnswer(val)}
                        className="flex-1 py-6 rounded-2xl font-serif text-lg font-bold transition-all"
                        style={{
                          background: selected ? '#F5A800' : 'rgba(31,16,38,0.7)',
                          color: selected ? '#0B0510' : 'rgba(240,230,255,0.65)',
                          border: `1.5px solid ${selected ? '#F5A800' : 'rgba(240,230,255,0.1)'}`,
                          boxShadow: selected ? '0 0 20px rgba(245,168,0,0.4)' : 'none',
                          backdropFilter: 'blur(40px)',
                        }}>
                        {val}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[#F0E6FF]/40 text-[10px] px-1">
                  <span className="max-w-[40%]">{isFr ? likert.labels_fr[0] : likert.labels_en[0]}</span>
                  <span className="max-w-[40%] text-right">{isFr ? likert.labels_fr[likert.max - 1] : likert.labels_en[likert.max - 1]}</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                {index > 0 ? (
                  <button onClick={() => setIndex((i) => i - 1)}
                    className="px-6 py-3 glass-card rounded-full text-[#F0E6FF]/60 hover:opacity-80 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={() => setPhase('intro')}
                    className="px-6 py-3 glass-card rounded-full text-[#F0E6FF]/60 hover:opacity-80 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {index < QUIZ_ITEMS.length - 1 && answers[currentItem.id] != null && (
                  <button onClick={() => setIndex((i) => i + 1)}
                    className="flex-1 py-3 glass-card rounded-full text-[#F0E6FF]/70 hover:opacity-80 transition-all flex items-center justify-center gap-1">
                    {isFr ? 'Suivant' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {index === QUIZ_ITEMS.length - 1 && allAnswered && (
                  <button onClick={() => finish(answers)} disabled={syncing}
                    className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                    {syncing ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Calcul…' : 'Scoring…'}</> : <>{isFr ? 'Voir mon profil' : 'See my profile'}</>}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {phase === 'results' && result && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <div className="text-center space-y-1">
                <h1 className="font-serif text-3xl text-[#F0E6FF]">
                  {isFr ? 'Votre Profil de Compatibilité' : 'Your Compatibility Profile'}
                </h1>
                <p className="text-[#F0E6FF]/50 text-sm">
                  {isFr ? 'Enregistré sur votre compte.' : 'Saved to your account.'}
                </p>
              </div>

              {/* Shareable card — kept off-screen (centered) for capture */}
              <div className="flex justify-center">
                <CompatibilityResultCard
                  ref={cardRef}
                  attachment={result.attachment}
                  big5={result.big5}
                  displayName={displayName}
                />
              </div>

              {/* Big Five breakdown */}
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <div className="text-[#F0E6FF]/60 text-xs font-semibold uppercase tracking-wider">
                  {isFr ? 'Détails des traits' : 'Trait breakdown'}
                </div>
                {BIG5_TRAITS.map((t) => {
                  const score = result.big5?.[t.key] ?? 0;
                  const lvl = traitLevel(score);
                  return (
                    <div key={t.key} className="flex items-center gap-3">
                      <span className="text-[#F0E6FF]/70 text-sm w-28 shrink-0">{isFr ? t.fr : t.en}</span>
                      <div className="flex-1 h-2 rounded-full bg-[rgba(240,230,255,0.06)] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#7B2FBE] to-[#F5A800]" style={{ width: `${(score / 5) * 100}%` }} />
                      </div>
                      <span className="text-[#F5A800] text-xs font-bold w-16 text-right">{LEVEL_LABEL[lvl][isFr ? 'fr' : 'en']} · {score.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dating archetype — quick edit path */}
              {userProfile?.dating_archetype && (
                <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-0.5">
                      {isFr ? 'Archétype de rencontre' : 'Dating archetype'}
                    </p>
                    <p className="text-[#F0E6FF] text-sm font-medium truncate">
                      {getArchetypeLabel(userProfile.dating_archetype, lang)}
                    </p>
                  </div>
                  <button onClick={() => setEditOpen(true)}
                    className="px-4 py-2 glass-card rounded-full text-[#F5A800] text-xs font-medium hover:border-[rgba(245,168,0,0.3)] transition-all flex items-center gap-1.5 shrink-0">
                    <Edit3 className="w-3 h-3" />
                    {isFr ? 'Modifier' : 'Update'}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button onClick={() => navigate('/home')}
                  className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {isFr ? 'Continuer vers l\u2019accueil' : 'Continue to Home'}
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setShareOpen(true)}
                    className="flex-1 py-3 glass-card-orchid rounded-full text-[#F0E6FF] font-bold hover:border-[rgba(123,47,190,0.4)] transition-all flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4 text-[#7B2FBE]" /> {isFr ? 'Partager à une connexion' : 'Share with a connection'}
                  </button>
                  <button onClick={handleShare}
                    className="flex-1 py-3 glass-card-gold rounded-full text-[#F5A800] font-bold hover:opacity-80 transition-all flex items-center justify-center gap-2">
                    {isFr ? <><Share2 className="w-4 h-4" /> Image</> : <><Share2 className="w-4 h-4" /> Image</>}
                  </button>
                </div>
                <button onClick={() => setRetakeConfirm(true)}
                  className="w-full py-3 text-[#F0E6FF]/40 text-sm hover:text-red-400 transition-colors flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> {isFr ? 'Repasser le test' : 'Retake test'}
                </button>
              </div>

              {/* Retake confirmation — two-step safety gate */}
              <AnimatePresence>
                {retakeConfirm && (
                  <motion.div key="retake-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] bg-[#0B0510]/80 backdrop-blur-md flex items-center justify-center px-6">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                      className="glass-card rounded-3xl p-6 max-w-sm w-full space-y-4 border-red-500/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-lg text-[#F0E6FF] mb-1">
                            {isFr ? 'Repasser le test ?' : 'Retake the test?'}
                          </h3>
                          <p className="text-[#F0E6FF]/60 text-sm leading-relaxed">
                            {isFr
                              ? 'Vos résultats actuels (style d\u2019attachement et Big Five) seront définitivement supprimés. Vous devrez répondre à nouveau à toutes les questions. Cette action est irréversible.'
                              : 'Your current results (attachment style and Big Five) will be permanently deleted. You will need to answer all questions again. This action cannot be undone.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleRetake} disabled={syncing}
                          className="flex-1 py-3 bg-red-500 text-white rounded-full font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {syncing ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Suppression…' : 'Deleting…'}</> : (isFr ? 'Oui, supprimer et repasser' : 'Yes, delete and retake')}
                        </button>
                        <button onClick={() => setRetakeConfirm(false)} disabled={syncing}
                          className="flex-1 py-3 glass-card rounded-full text-[#F0E6FF]/70 font-medium text-sm hover:text-[#F0E6FF] transition-colors">
                          {isFr ? 'Annuler' : 'Cancel'}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userProfile={userProfile}
        matchingAnswers={matchingAnswers}
        onUpdate={(updated) => setUserProfile(updated)}
        onAnswersUpdate={setMatchingAnswers}
        lang={lang}
        initialTab="archetype"
      />

      <ShareCompatibilityModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        attachment={result?.attachment}
        displayName={displayName}
      />
    </div>
  );
}