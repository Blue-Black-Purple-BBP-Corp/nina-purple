import React, { useState, useEffect } from 'react';
import { Heart, Loader2, Sparkles, Check, ChevronLeft, Award, Clock, Video, Phone, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Ambassador application modal — a real application process, not a toggle.
// Step 1: Full transparency on what being an ambassador entails (commitment,
//         responsibilities, the selection process).
// Step 2: Application form (motivation, experience, availability, languages).
// Step 3: Confirmation — application received, pending review.
//
// If the user already has an active application or is already an ambassador,
// the modal shows their status instead of the form.
export default function AmbassadorModal({ isOpen, onClose, lang, onDone }) {
  const [step, setStep] = useState(0); // 0 = transparency, 1 = form, 2 = confirmation
  const [existingApp, setExistingApp] = useState(null);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    motivation: '',
    relevant_experience: '',
    availability_hours_week: 3,
    languages: [],
    community_involvement: '',
  });

  const isFr = lang === 'fr';

  // Check for existing application / ambassador status on open
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const [profiles, apps] = await Promise.all([
          base44.entities.UserProfile.filter({ user_id: user.id }),
          base44.entities.AmbassadorApplication.filter({ user_id: user.id }, '-submitted_at', 10),
        ]);
        if (!active) return;
        setIsAmbassador(!!profiles[0]?.is_ambassador);
        const activeStatuses = ['pending', 'under_review', 'interview_scheduled'];
        const active = apps.find(a => activeStatuses.includes(a.status));
        setExistingApp(active || apps[0] || null);
        if (active || profiles[0]?.is_ambassador) {
          setStep(3); // status view
        }
      } catch (e) {
        console.error('AmbassadorModal load failed:', e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (form.motivation.trim().length < 20) {
      setError(isFr ? 'Veuillez décrire votre motivation (au moins 20 caractères).' : 'Please describe your motivation (at least 20 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await base44.functions.invoke('submitAmbassadorApplication', form);
      setStep(2);
      onDone?.();
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('application_already_active')) {
        setStep(3);
      } else {
        setError(msg || (isFr ? "Échec de l'envoi. Réessayez." : 'Submission failed. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const responsibilities = isFr ? [
    'Inviter des personnes alignées sur nos valeurs',
    'Partager votre expérience en toute authenticité',
    'Aider la communauté à grandir en profondeur',
    'Représenter Nina Purple avec intégrité',
  ] : [
    'Invite people aligned with our values',
    'Share your experience authentically',
    'Help the community grow in depth',
    'Represent Nina Purple with integrity',
  ];

  const processSteps = isFr ? [
    { label: 'Candidature', desc: 'Vous soumettez ce formulaire' },
    { label: 'Révision', desc: 'Notre équipe examine votre candidature (5-7 jours)' },
    { label: 'Entrevue', desc: 'Appel vidéo ou téléphonique de 20-30 min' },
    { label: 'Décision', desc: 'Approbation ou non, avec retour' },
  ] : [
    { label: 'Application', desc: 'You submit this form' },
    { label: 'Review', desc: 'Our team reviews your application (5-7 days)' },
    { label: 'Interview', desc: '20-30 min video or phone call' },
    { label: 'Decision', desc: 'Approval or not, with feedback' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-0 md:px-6"
      style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-[#1F1026] rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-[rgba(240,230,255,0.08)] bg-[#1F1026] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 1 && (
              <button onClick={() => setStep(0)} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-[#7B2FBE]" />
            </div>
            <h2 className="font-serif text-lg text-[#F0E6FF]">
              {isFr ? 'Ambassadeur Nina Purple' : 'Nina Purple Ambassador'}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#7B2FBE] animate-spin" />
            </div>
          ) : isAmbassador ? (
            // Already an ambassador
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-[#F5A800]" />
              </div>
              <h3 className="font-serif text-xl text-[#F0E6FF] mb-2">
                {isFr ? 'Vous êtes ambassadeur' : "You're an Ambassador"}
              </h3>
              <p className="text-[#F0E6FF]/50 text-sm">
                {isFr
                  ? "Merci de porter l'amour conscient plus loin. Votre badge est visible sur votre profil."
                  : 'Thank you for carrying conscious love further. Your badge is visible on your profile.'}
              </p>
            </div>
          ) : existingApp && step === 3 ? (
            // Existing application — show status
            <AmbassadorStatusView application={existingApp} isFr={isFr} onWithdraw={() => onDone?.()} onClose={onClose} />
          ) : step === 0 ? (
            // Step 1: Transparency — what it entails
            <>
              <p className="text-[#F0E6FF]/70 text-sm leading-relaxed mb-4">
                {isFr
                  ? "Les ambassadeurs sont le cœur battant de Nina Purple. Vous croyez que les relations saines sont une expérience vécue, et vous voulez que d'autres en bénéficient."
                  : 'Ambassadors are the beating heart of Nina Purple. You believe healthy relationships are a lived experience, and you want others to benefit too.'}
              </p>

              {/* Responsibilities */}
              <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">
                {isFr ? 'Ce que cela implique' : 'What it entails'}
              </p>
              <div className="space-y-2 mb-5">
                {responsibilities.map((point, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[#F0E6FF]/65 text-sm">
                    <Sparkles className="w-4 h-4 text-[#F5A800] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Process */}
              <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">
                {isFr ? 'Le processus' : 'The process'}
              </p>
              <div className="space-y-2 mb-5">
                {processSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0 text-[#7B2FBE] text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-[#F0E6FF] text-sm font-medium">{s.label}</div>
                      <div className="text-[#F0E6FF]/40 text-xs">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commitment */}
              <div className="p-3 rounded-xl bg-[rgba(245,168,0,0.06)] border border-[rgba(245,168,0,0.15)] mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#F5A800]" />
                  <span className="text-[#F0E6FF] text-xs font-semibold">
                    {isFr ? 'Engagement attendu' : 'Expected commitment'}
                  </span>
                </div>
                <p className="text-[#F0E6FF]/50 text-xs leading-relaxed">
                  {isFr
                    ? 'Quelques heures par semaine, selon votre disponibilité. Vous choisissez votre niveau d\'implication.'
                    : 'A few hours per week, based on your availability. You choose your level of involvement.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[rgba(123,47,190,0.08)] border border-[rgba(123,47,190,0.2)] mb-5 text-center">
                <p className="text-[#F0E6FF]/60 text-xs">❤️ {isFr ? 'Ambassadeur pour l\'humanité' : 'Ambassador for humanity'}</p>
              </div>

              <button onClick={() => setStep(1)}
                className="w-full py-3.5 bg-[#7B2FBE] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#6929a8] transition-all">
                {isFr ? 'Postuler' : 'Apply now'}
              </button>
              <button onClick={onClose}
                className="w-full mt-2 py-2.5 text-[#F0E6FF]/40 text-xs hover:text-[#F0E6FF]/60 transition-colors">
                {isFr ? 'Peut-être plus tard' : 'Maybe later'}
              </button>
            </>
          ) : step === 1 ? (
            // Step 2: Application form
            <>
              {error && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Motivation */}
              <div className="mb-4">
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Pourquoi voulez-vous devenir ambassadeur ?' : 'Why do you want to become an ambassador?'} <span className="text-[#F5A800]">*</span>
                </label>
                <textarea
                  value={form.motivation}
                  onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                  rows={4}
                  maxLength={2000}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent resize-none"
                  placeholder={isFr ? 'Partagez votre motivation...' : 'Share your motivation...'} />
                <p className="text-[#F0E6FF]/30 text-[10px] mt-1">{form.motivation.length}/2000</p>
              </div>

              {/* Relevant experience */}
              <div className="mb-4">
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Expérience pertinente (bénévolat, communauté, animation...)' : 'Relevant experience (volunteering, community, facilitation...)'}
                </label>
                <textarea
                  value={form.relevant_experience}
                  onChange={e => setForm(f => ({ ...f, relevant_experience: e.target.value }))}
                  rows={3}
                  maxLength={2000}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent resize-none"
                  placeholder={isFr ? 'Décrivez votre expérience...' : 'Describe your experience...'} />
              </div>

              {/* Availability */}
              <div className="mb-4">
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Disponibilité (heures/semaine)' : 'Availability (hours/week)'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 10].map(h => (
                    <button key={h} onClick={() => setForm(f => ({ ...f, availability_hours_week: h }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.availability_hours_week === h ? 'bg-[#7B2FBE] text-white' : 'glass-card text-[#F0E6FF]/50'}`}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="mb-4">
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Langues parlées' : 'Languages spoken'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Français', 'Español', 'Other'].map(l => (
                    <button key={l} onClick={() => toggleLanguage(l)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.languages.includes(l) ? 'bg-[#7B2FBE] text-white' : 'glass-card text-[#F0E6FF]/50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Community involvement */}
              <div className="mb-5">
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Comment êtes-vous impliqué(e) dans votre communauté ?' : 'How are you involved in your community?'}
                </label>
                <textarea
                  value={form.community_involvement}
                  onChange={e => setForm(f => ({ ...f, community_involvement: e.target.value }))}
                  rows={2}
                  maxLength={1000}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent resize-none"
                  placeholder={isFr ? 'Décrivez votre implication...' : 'Describe your involvement...'} />
              </div>

              <button onClick={handleSubmit} disabled={submitting || form.motivation.trim().length < 20}
                className="w-full py-3.5 bg-[#7B2FBE] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#6929a8] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Envoi...' : 'Submitting...'}</>
                  : (isFr ? 'Soumettre ma candidature' : 'Submit my application')}
              </button>
            </>
          ) : step === 2 ? (
            // Step 3: Confirmation
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(123,47,190,0.2)] flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#7B2FBE]" />
              </div>
              <h3 className="font-serif text-xl text-[#F0E6FF] mb-2">
                {isFr ? 'Candidature reçue' : 'Application received'}
              </h3>
              <p className="text-[#F0E6FF]/50 text-sm leading-relaxed mb-4">
                {isFr
                  ? "Merci ! Notre équipe examinera votre candidature et vous contactera dans les 5-7 jours prochains. Vous pouvez suivre le statut depuis votre tableau de bord."
                  : 'Thank you! Our team will review your application and contact you within 5-7 days. You can track the status from your dashboard.'}
              </p>
              <button onClick={onClose}
                className="w-full py-3 bg-[#7B2FBE] text-white rounded-full font-bold text-sm hover:bg-[#6929a8] transition-all">
                {isFr ? 'Fermer' : 'Close'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Status view shown when the user already has an active application
function AmbassadorStatusView({ application, isFr, onWithdraw, onClose }) {
  const [withdrawing, setWithdrawing] = useState(false);

  const statusConfig = {
    pending: { color: '#A855F7', label: isFr ? 'En attente de révision' : 'Pending review', icon: Clock },
    under_review: { color: '#A855F7', label: isFr ? 'En cours de révision' : 'Under review', icon: Clock },
    interview_scheduled: { color: '#F5A800', label: isFr ? 'Entrevue planifiée' : 'Interview scheduled', icon: Video },
    approved: { color: '#F5A800', label: isFr ? 'Approuvé' : 'Approved', icon: Award },
    rejected: { color: '#EF4444', label: isFr ? 'Non retenu' : 'Not selected', icon: X },
    withdrawn: { color: '#6B7280', label: isFr ? 'Retirée' : 'Withdrawn', icon: X },
  };

  const cfg = statusConfig[application.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await base44.functions.invoke('withdrawAmbassadorApplication', { application_id: application.id });
      onWithdraw?.();
      onClose?.();
    } catch (e) {
      console.error('Withdraw failed:', e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw = ['pending', 'under_review', 'interview_scheduled'].includes(application.status);

  return (
    <div className="py-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
          <StatusIcon className="w-6 h-6" style={{ color: cfg.color }} />
        </div>
        <div>
          <h3 className="font-serif text-lg text-[#F0E6FF]">{cfg.label}</h3>
          <p className="text-[#F0E6FF]/40 text-xs">
            {isFr ? 'Soumise le' : 'Submitted'} {new Date(application.submitted_at).toLocaleDateString(isFr ? 'fr-CA' : 'en-CA')}
          </p>
        </div>
      </div>

      {/* Interview details */}
      {application.status === 'interview_scheduled' && application.interview_scheduled_at && (
        <div className="p-3 rounded-xl bg-[rgba(245,168,0,0.08)] border border-[rgba(245,168,0,0.2)] mb-4">
          <div className="flex items-center gap-2 mb-2">
            {application.interview_type === 'video' ? <Video className="w-4 h-4 text-[#F5A800]" /> : <Phone className="w-4 h-4 text-[#F5A800]" />}
            <span className="text-[#F0E6FF] text-sm font-medium">
              {isFr ? 'Entrevue planifiée' : 'Interview scheduled'}
            </span>
          </div>
          <p className="text-[#F0E6FF]/70 text-sm mb-1">
            {new Date(application.interview_scheduled_at).toLocaleString(isFr ? 'fr-CA' : 'en-CA', { timeZone: 'America/Toronto', dateStyle: 'full', timeStyle: 'short' })} (ET)
          </p>
          <p className="text-[#F0E6FF]/50 text-xs mb-1">
            {isFr ? 'Type' : 'Type'}: {application.interview_type === 'video' ? (isFr ? 'Appel vidéo' : 'Video call') : (isFr ? 'Appel téléphonique' : 'Phone call')}
          </p>
          {application.interview_link && (
            <a href={application.interview_link} target="_blank" rel="noopener noreferrer"
              className="text-[#F5A800] text-xs underline break-all">
              {application.interview_link}
            </a>
          )}
          {application.interview_notes && (
            <p className="text-[#F0E6FF]/50 text-xs mt-2 pt-2 border-t border-[rgba(245,168,0,0.15)]">
              {application.interview_notes}
            </p>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {application.status === 'rejected' && application.rejection_reason && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
          <p className="text-[#F0E6FF]/60 text-xs leading-relaxed">{application.rejection_reason}</p>
        </div>
      )}

      {/* Your application */}
      <div className="p-3 rounded-xl bg-[rgba(240,230,255,0.03)] border border-[rgba(240,230,255,0.08)] mb-4">
        <p className="text-[#F0E6FF]/40 text-xs uppercase tracking-wider mb-1">{isFr ? 'Votre motivation' : 'Your motivation'}</p>
        <p className="text-[#F0E6FF]/70 text-sm leading-relaxed">{application.motivation}</p>
      </div>

      {canWithdraw && (
        <button onClick={handleWithdraw} disabled={withdrawing}
          className="w-full py-2.5 text-[#F0E6FF]/40 hover:text-red-400 text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
          {withdrawing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          {isFr ? 'Retirer ma candidature' : 'Withdraw my application'}
        </button>
      )}
    </div>
  );
}