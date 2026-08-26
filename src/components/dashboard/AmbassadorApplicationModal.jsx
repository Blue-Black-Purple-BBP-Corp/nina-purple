import React, { useState } from 'react';
import { Heart, Loader2, Sparkles, Check, Award, Clock, Users, Gift, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Full-transparency application modal. Shows exactly what being a Nina Purple
// Ambassador entails (role, commitment, benefits, process, what we look for)
// before the user commits to applying. On submit, calls the backend function
// which creates the application and notifies admins.
export default function AmbassadorApplicationModal({ isOpen, onClose, lang, onDone }) {
  const [step, setStep] = useState('info'); // 'info' | 'form' | 'success'
  const [form, setForm] = useState({
    motivation: '',
    weekly_availability: '',
    social_presence: '',
    references: '',
    preferred_interview: 'video',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;
  const isFr = lang === 'fr';

  const handleClose = () => {
    setStep('info');
    setForm({ motivation: '', weekly_availability: '', social_presence: '', references: '', preferred_interview: 'video' });
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.motivation.trim()) {
      setError(isFr ? 'Veuillez expliquer votre motivation.' : 'Please explain your motivation.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await base44.functions.invoke('submitAmbassadorApplication', form);
      setStep('success');
      onDone?.();
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('active application')) {
        setError(isFr ? 'Vous avez déjà une candidature en cours.' : 'You already have an active application.');
      } else if (msg.includes('already_ambassador')) {
        setError(isFr ? 'Vous êtes déjà ambassadeur.' : 'You are already an ambassador.');
      } else {
        setError(msg || (isFr ? "Échec de l'envoi. Réessayez." : 'Submission failed. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const infoSections = [
    {
      icon: Heart,
      title: isFr ? 'Le rôle' : 'The Role',
      color: '#7B2FBE',
      items: isFr
        ? ['Être le visage local de Nina Purple dans votre ville', 'Animer 1 à 2 rencontres communautaires par trimestre', 'Parrainer des nouveaux membres alignés sur nos valeurs', 'Accompagner les nouveaux membres de votre région']
        : ['Be the local face of Nina Purple in your city', 'Host 1-2 community meetups per quarter', 'Refer aligned new members', 'Welcome and guide new members in your region'],
    },
    {
      icon: Clock,
      title: isFr ? "L'engagement" : 'The Commitment',
      color: '#F5A800',
      items: isFr
        ? ['Minimum 6 mois', '2 à 4 heures par semaine', 'Participer aux rencontres trimestrielles des ambassadeurs']
        : ['Minimum 6 months', '2-4 hours per week', 'Attend quarterly ambassador check-ins'],
    },
    {
      icon: Gift,
      title: isFr ? 'Les avantages' : 'The Benefits',
      color: '#A855F7',
      items: isFr
        ? ['Badge ambassadeur vérifié sur votre profil', '50 BBP par filleul vérifié, 100 BBP par événement animé', 'Accès gratuit aux Expériences Nina Purple', 'Ligne directe avec l\'équipe Nina Purple']
        : ['Verified ambassador badge on your profile', '50 BBP per verified referral, 100 BBP per hosted event', 'Free access to Nina Purple Experiences', 'Direct line to the Nina Purple team'],
    },
  ];

  const processSteps = isFr
    ? ['Soumettez votre candidature (ci-dessous)', 'Nous examinons sous 5 jours ouvrables', 'Entrevue vidéo ou téléphonique de 20 minutes', 'Décision sous 2 jours ouvrables']
    : ['Submit your application (below)', 'We review within 5 business days', '20-minute video or phone interview', 'Decision within 2 business days of interview'];

  const weLookFor = isFr
    ? ['Alignement avec les valeurs Nina Purple (conscience, authenticité, respect)', 'Présence communautaire active', 'Fiabilité et suivi des engagements', 'Intelligence émotionnelle']
    : ['Alignment with Nina Purple values (consciousness, authenticity, respect)', 'Active community presence', 'Reliability and follow-through', 'Emotional intelligence'];

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-0 md:px-6"
      style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="w-full max-w-lg bg-[#1F1026] rounded-t-3xl md:rounded-3xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 sticky top-0 bg-[#1F1026] pb-3 -mt-6 pt-6 z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-[#7B2FBE]" />
            </div>
            <h2 className="font-serif text-lg text-[#F0E6FF]">
              {isFr ? 'Ambassadeur Nina Purple' : 'Nina Purple Ambassador'}
            </h2>
          </div>
          <button onClick={handleClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] text-xl">✕</button>
        </div>

        {step === 'info' && (
          <>
            <p className="text-[#F0E6FF]/70 text-sm leading-relaxed mb-5">
              {isFr
                ? "Les ambassadeurs sont le cœur battant de Nina Purple. Ils portent l'amour conscient plus loin, une ville à la fois. Voici exactement ce que cela implique."
                : 'Ambassadors are the beating heart of Nina Purple. They carry conscious love further, one city at a time. Here is exactly what that entails.'}
            </p>

            {/* Transparency sections */}
            <div className="space-y-4 mb-5">
              {infoSections.map((section, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(11,5,16,0.4)', border: `1px solid ${section.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${section.color}15` }}>
                      <section.icon className="w-4 h-4" style={{ color: section.color }} />
                    </div>
                    <span className="font-serif text-sm text-[#F0E6FF]">{section.title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-[#F0E6FF]/60 text-xs leading-relaxed">
                        <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: section.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Process */}
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)' }}>
              <p className="text-[#F5A800] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isFr ? 'Le processus' : 'The process'}
              </p>
              <div className="space-y-2">
                {processSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[#F0E6FF]/65 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center text-[#F5A800] font-bold text-[10px] shrink-0">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* What we look for */}
            <div className="mb-5">
              <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider mb-2">
                {isFr ? 'Ce que nous recherchons' : 'What we look for'}
              </p>
              <div className="flex flex-wrap gap-2">
                {weLookFor.map((trait, i) => (
                  <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(123,47,190,0.1)] text-[#F0E6FF]/60 border border-[rgba(123,47,190,0.15)]">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('form')}
              className="w-full py-3.5 bg-[#7B2FBE] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#6929a8] transition-all flex items-center justify-center gap-2">
              {isFr ? 'Postuler maintenant' : 'Apply now'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {step === 'form' && (
          <>
            <button onClick={() => setStep('info')} className="text-[#F0E6FF]/40 text-xs mb-4 hover:text-[#F0E6FF]/60 transition-colors">
              ← {isFr ? 'Retour aux informations' : 'Back to info'}
            </button>

            <div className="space-y-4">
              <div>
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Pourquoi voulez-vous devenir ambassadeur ?' : 'Why do you want to become an ambassador?'} <span className="text-[#F5A800]">*</span>
                </label>
                <textarea
                  value={form.motivation}
                  onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                  rows={4}
                  maxLength={2000}
                  placeholder={isFr
                    ? "Racontez-nous votre histoire, votre lien avec Nina Purple, et ce que vous espérez apporter à votre communauté locale..."
                    : "Tell us your story, your connection to Nina Purple, and what you hope to bring to your local community..."}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent resize-none placeholder-[rgba(240,230,255,0.2)]"
                />
                <p className="text-[#F0E6FF]/30 text-[10px] mt-1">{form.motivation.length}/2000</p>
              </div>

              <div>
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Disponibilité hebdomadaire' : 'Weekly availability'}
                </label>
                <input
                  type="text"
                  value={form.weekly_availability}
                  onChange={e => setForm(f => ({ ...f, weekly_availability: e.target.value }))}
                  placeholder={isFr ? 'ex: 3-5 heures par semaine' : 'e.g. 3-5 hours per week'}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent placeholder-[rgba(240,230,255,0.2)]"
                />
              </div>

              <div>
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Présence sociale (optionnel)' : 'Social presence (optional)'}
                </label>
                <input
                  type="text"
                  value={form.social_presence}
                  onChange={e => setForm(f => ({ ...f, social_presence: e.target.value }))}
                  placeholder={isFr ? 'Instagram, LinkedIn, ou autres liens' : 'Instagram, LinkedIn, or other links'}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent placeholder-[rgba(240,230,255,0.2)]"
                />
              </div>

              <div>
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Références communautaires (optionnel)' : 'Community references (optional)'}
                </label>
                <textarea
                  value={form.references}
                  onChange={e => setForm(f => ({ ...f, references: e.target.value }))}
                  rows={2}
                  maxLength={1000}
                  placeholder={isFr ? 'Des personnes qui peuvent témoigner de votre engagement...' : 'People who can vouch for your engagement...'}
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent resize-none placeholder-[rgba(240,230,255,0.2)]"
                />
              </div>

              <div>
                <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                  {isFr ? 'Entrevue préférée' : 'Preferred interview format'}
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'video', label: isFr ? 'Vidéo' : 'Video' },
                    { key: 'phone', label: isFr ? 'Téléphone' : 'Phone' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setForm(f => ({ ...f, preferred_interview: opt.key }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.preferred_interview === opt.key
                        ? 'bg-[rgba(123,47,190,0.2)] text-[#7B2FBE] border border-[rgba(123,47,190,0.4)]'
                        : 'glass-card text-[#F0E6FF]/50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting || !form.motivation.trim()}
                className="w-full py-3.5 bg-[#7B2FBE] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#6929a8] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Envoi...' : 'Submitting...'}</>
                  : (isFr ? 'Soumettre ma candidature' : 'Submit my application')}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(123,47,190,0.2)] flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#7B2FBE]" />
            </div>
            <h3 className="font-serif text-xl text-[#F0E6FF] mb-2">
              {isFr ? 'Candidature envoyée' : 'Application submitted'}
            </h3>
            <p className="text-[#F0E6FF]/50 text-sm leading-relaxed mb-4">
              {isFr
                ? "Merci de vouloir porter l'amour conscient plus loin. Nous examinerons votre candidature et vous contacterons sous 5 jours ouvrables. Vous pouvez suivre le statut de votre candidature sur votre tableau de bord."
                : 'Thank you for wanting to carry conscious love further. We will review your application and reach out within 5 business days. You can track your application status on your dashboard.'}
            </p>
            <p className="text-[#F0E6FF]/40 text-xs mb-4">
              {isFr ? '❤️ Ambassadeur pour l' + "'humanité" : '❤️ Ambassador for humanity'}
            </p>
            <button onClick={handleClose}
              className="px-8 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all">
              {isFr ? 'Retour au tableau de bord' : 'Back to dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}