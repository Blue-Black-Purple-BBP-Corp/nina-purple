import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Upload, Star } from 'lucide-react';
import NinaSpeech from '@/components/NinaSpeech';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

const STEPS = ['intro', 'age', 'guidelines', 'profile', 'archetype', 'photos', 'questions', 'subscription', 'complete'];

const QUESTIONS_21 = [
  { id: 'q1', key: 'q1_ethnicity', required: false, en: 'Ethnic origin: Please specify your ethnicity.', fr: 'Origine ethnique : Veuillez préciser votre origine.', options_en: ['Afro descendant', 'Mixed Afro descendant', 'Hispanic or Latino', 'First Nation/Indigenous', 'Asian', 'Caucasian', 'Mixed Others', 'Other'], options_fr: ['Afro-descendant', 'Métis afro-descendant', 'Hispanique ou Latino', 'Première Nation/Autochtone', 'Asiatique', 'Caucasien', 'Mixte autre', 'Autre'] },
  { id: 'q2', key: 'q2_education', required: false, en: 'Education: Highest degree completed?', fr: 'Éducation : Niveau d\'études le plus élevé ?', options_en: ['High school', 'Some college', 'Trade/Vocational', "Associate's degree", "Bachelor's degree", "Master's degree", 'Doctorate'], options_fr: ['Lycée', 'Quelques cours universitaires', 'Formation professionnelle', 'Baccalauréat', 'Licence', 'Master', 'Doctorat'] },
  { id: 'q3', key: 'q3_children', required: false, en: 'Children: Are children important in your life?', fr: 'Enfants : Les enfants sont-ils importants dans votre vie ?', multi: true, options_en: ['I have children', 'I might have more one day', "I can't wait to have children", "I don't know currently"], options_fr: ['J\'ai des enfants', 'J\'en aurai peut-être un jour', 'J\'ai hâte d\'en avoir', 'Je ne sais pas actuellement'] },
  { id: 'q4', key: 'q4_religion', required: false, en: 'Religion: How do you identify?', fr: 'Religion : Comment vous identifiez-vous ?', options_en: ['Agnostic', 'Buddhist', 'Catholic', 'Christian', 'Spiritual', 'Muslim', 'Jewish', 'Sikh', 'Rastafari', 'Other'], options_fr: ['Agnostique', 'Bouddhiste', 'Catholique', 'Chrétien', 'Spirituel', 'Musulman', 'Juif', 'Sikh', 'Rastafari', 'Autre'] },
  { id: 'q5', key: 'q5_employment', required: false, en: 'Employment: Are you currently...?', fr: 'Emploi : Êtes-vous actuellement... ?', options_en: ['Employed', 'Self-employed', 'Looking for work', 'Student', 'Homemaker', 'Retired', 'Other'], options_fr: ['Employé(e)', 'Travailleur indépendant', 'En recherche d\'emploi', 'Étudiant(e)', 'Au foyer', 'Retraité(e)', 'Autre'] },
  { id: 'q6', key: 'q6_smoking', required: false, en: 'Tobacco: Do you smoke?', fr: 'Tabac : Fumez-vous ?', options_en: ['Yes', 'Yes, tobacco and cannabis', 'Occasionally', 'No', 'No, but cannabis occasionally'], options_fr: ['Oui', 'Oui, tabac et cannabis', 'Occasionnellement', 'Non', 'Non, mais cannabis occasionnellement'] },
  { id: 'q7', key: 'q7_alcohol', required: false, en: 'Alcohol: Do you drink?', fr: 'Alcool : Buvez-vous ?', options_en: ['Yes', 'No', 'Occasionally'], options_fr: ['Oui', 'Non', 'Occasionnellement'] },
  { id: 'q8', key: 'q8_nutrition', required: false, en: 'Nutrition: What does your regular diet look like?', fr: 'Nutrition : Quel est votre régime alimentaire ?', options_en: ['Omnivorous', 'Vegetarian', 'Vegan', 'Pescatarian', 'Plant-Based', 'Keto', 'Alkaline', 'Other'], options_fr: ['Omnivore', 'Végétarien', 'Végétalien', 'Pescatarien', 'Végétal', 'Keto', 'Alcalin', 'Autre'] },
  { id: 'q9', key: 'q9_long_distance', required: false, en: 'Are you open to long-distance relationships?', fr: 'Êtes-vous ouvert(e) aux relations à distance ?', options_en: ['Yes', 'No', 'Maybe'], options_fr: ['Oui', 'Non', 'Peut-être'] },
  { id: 'q12', key: 'q12_marriage', required: false, en: 'How important is marriage to your overall happiness?', fr: "Quelle est l'importance du mariage pour votre bonheur ?", options_en: ["It's crucial", "I'm open to it", "Not on my radar", "I don't want to marry"], options_fr: ['C\'est crucial', 'Je suis ouvert(e)', 'Pas dans mes plans', 'Je ne veux pas me marier'] },
  { id: 'q13', key: 'q13_spirituality', required: false, en: 'How important is your spirituality to you?', fr: 'Quelle est l\'importance de votre spiritualité ?', options_en: ['Extremely important', 'Quite important', 'Important', 'Not very important', 'Not important'], options_fr: ['Extrêmement important', 'Très important', 'Important', 'Peu important', 'Pas important'] },
  { id: 'q21', key: 'q21_love_language', required: false, en: "Most important way your partner expresses love?", fr: 'La façon la plus importante dont votre partenaire exprime son amour ?', options_en: ['Words of affirmation', 'Acts of service', 'Thoughtful gifts', 'Quality time', 'Physical touch'], options_fr: ['Paroles d\'affirmation', 'Actes de service', 'Cadeaux attentionnés', 'Temps de qualité', 'Contact physique'] },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { t } = useTranslation(lang);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState({ display_name: '', city: '', birthdate: '', sexual_orientation: '', gender_pronoun: '', relationship_status: '' });
  const [archetype, setArchetype] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('solar');
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const goPrev = () => setStep(s => Math.max(s - 1, 0));

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const archetypes = [
    { id: 'blue', color: '#60A5FA', name: t('onboarding.blue_name'), desc: t('onboarding.blue_desc') },
    { id: 'black', color: '#9CA3AF', name: t('onboarding.black_name'), desc: t('onboarding.black_desc') },
    { id: 'purple', color: '#A855F7', name: t('onboarding.purple_name'), desc: t('onboarding.purple_desc') },
  ];

  const plans = [
    { id: 'solar', name: t('plans.solar'), price: t('plans.free'), desc: t('plans.solar_desc'), color: '#F0E6FF' },
    { id: 'lunar', name: t('plans.lunar'), price: '$10', desc: t('plans.lunar_desc'), color: '#7B2FBE' },
    { id: 'stellar', name: t('plans.stellar'), price: '$15', desc: t('plans.stellar_desc'), color: '#A855F7' },
    { id: 'galactic', name: t('plans.galactic'), price: '$20', desc: t('plans.galactic_desc'), color: '#F5A800' },
  ];

  const handleComplete = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (user) {
        await base44.entities.UserProfile.create({
          user_id: user.id,
          display_name: profile.display_name || user.full_name,
          city: profile.city,
          birthdate: profile.birthdate,
          sexual_orientation: profile.sexual_orientation,
          gender_pronoun: profile.gender_pronoun,
          relationship_status: profile.relationship_status,
          dating_archetype: archetype,
          subscription_tier: selectedPlan,
          credit_balance: 0,
          onboarding_complete: true,
          age_verified: true,
          guidelines_accepted: true,
          language: lang,
          profile_completeness: 60,
        });
        await base44.entities.MatchingAnswers.create({ user_id: user.id, ...answers, questions_answered: Object.keys(answers).length });
      }
    } catch (e) {
      // proceed anyway for demo
    }
    setLoading(false);
    goNext();
  };

  const pageVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-[#0B0510] flex flex-col">
      {/* Progress bar */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-[rgba(240,230,255,0.05)]">
          <motion.div
            className="h-full bg-[#F5A800]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* INTRO */}
          {currentStep === 'intro' && (
            <motion.div key="intro" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-8 text-center">
              <img src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/c077be419_CopyofLogoNPIsoWoman.png"
                alt="Nina" className="w-40 mx-auto drop-shadow-[0_0_40px_rgba(123,47,190,0.4)]" />
              <NinaSpeech message={`${t('onboarding.welcome')} ${t('onboarding.nina_intro')}`} />
              <NinaSpeech message={lang === 'fr'
                ? "Cette communauté élimine le balayage et les photos pour que vous puissiez vraiment apprendre à connaître la personne que vous souhaitez rencontrer."
                : "This community takes swiping and photos out of the equation so you can truly get to know the person you want to connect with."} />
              <button onClick={goNext}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.3)]">
                {t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* AGE */}
          {currentStep === 'age' && (
            <motion.div key="age" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-8">
              <NinaSpeech message={t('onboarding.age_question')} />
              <p className="text-[#F0E6FF]/50 text-sm text-center">{t('onboarding.age_required')}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={goNext}
                  className="py-4 glass-card-gold rounded-2xl text-[#F5A800] font-bold text-lg hover:bg-[rgba(245,168,0,0.08)] transition-all">
                  {t('onboarding.yes')}
                </button>
                <button
                  className="py-4 glass-card rounded-2xl text-[#F0E6FF]/50 font-medium text-lg cursor-not-allowed">
                  {t('onboarding.no')}
                </button>
              </div>
            </motion.div>
          )}

          {/* GUIDELINES */}
          {currentStep === 'guidelines' && (
            <motion.div key="guidelines" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <NinaSpeech message={t('onboarding.guidelines_intro')} />
              <h2 className="font-serif text-2xl text-[#F0E6FF]">{t('onboarding.guidelines_title')}</h2>
              {[t('onboarding.honest'), t('onboarding.respectful'), t('onboarding.conscious')].map((g, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 flex items-start gap-3 border-[rgba(245,168,0,0.15)]">
                  <div className="w-6 h-6 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5 text-[#F5A800]" />
                  </div>
                  <p className="text-[#F0E6FF]/80 text-sm leading-relaxed">{g}</p>
                </div>
              ))}
              <button onClick={goNext}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all">
                {t('onboarding.accept_guidelines')}
              </button>
            </motion.div>
          )}

          {/* PROFILE */}
          {currentStep === 'profile' && (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <h2 className="font-serif text-3xl text-[#F0E6FF]">{t('onboarding.profile_title')}</h2>
              {[
                { label: t('onboarding.name_label'), key: 'display_name', type: 'text' },
                { label: t('onboarding.location_label'), key: 'city', type: 'text' },
                { label: t('onboarding.birthdate_label'), key: 'birthdate', type: 'date' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[#F0E6FF]/60 text-sm mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    value={profile[field.key]}
                    onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
                    placeholder={field.label}
                  />
                </div>
              ))}
              {[
                { label: t('onboarding.orientation_label'), key: 'sexual_orientation', options: lang === 'fr' ? ['Hétérosexuel(le)', 'Gay', 'Lesbienne', 'Bisexuel(le)', 'Asexuel(le)', 'Pansexuel(le)', 'Queer', 'Autre'] : ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Pansexual', 'Queer', 'Other'] },
                { label: t('onboarding.pronoun_label'), key: 'gender_pronoun', options: ['He/Him', 'She/Her', 'They/Them', 'Non-Binary', lang === 'fr' ? 'Autre' : 'Other'] },
                { label: t('onboarding.status_label'), key: 'relationship_status', options: lang === 'fr' ? ['Célibataire', 'Séparé(e)', 'Veuf/Veuve', 'Divorcé(e)', 'Relation ouverte', 'Autre'] : ['Single', 'Separated', 'Widowed', 'Divorced', 'Open Relationship', 'Other'] },
              ].map(sel => (
                <div key={sel.key}>
                  <label className="block text-[#F0E6FF]/60 text-sm mb-2">{sel.label}</label>
                  <select
                    value={profile[sel.key]}
                    onChange={e => setProfile(p => ({ ...p, [sel.key]: e.target.value }))}
                    className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] outline-none bg-[#1F1026] border border-[rgba(240,230,255,0.08)]"
                  >
                    <option value="">—</option>
                    {sel.options.map(o => <option key={o} value={o} className="bg-[#1F1026]">{o}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={goNext}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all">
                {t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* ARCHETYPE */}
          {currentStep === 'archetype' && (
            <motion.div key="archetype" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <NinaSpeech message={t('onboarding.archetype_intro')} />
              <h2 className="font-serif text-3xl text-[#F0E6FF]">{t('onboarding.archetype_title')}</h2>
              {archetypes.map(a => (
                <button key={a.id} onClick={() => setArchetype(a.id)}
                  className={`w-full glass-card rounded-2xl p-5 text-left transition-all duration-300 ${archetype === a.id ? 'border-opacity-100 shadow-lg' : 'hover:border-opacity-40'}`}
                  style={{ borderColor: archetype === a.id ? a.color : 'rgba(240,230,255,0.08)', boxShadow: archetype === a.id ? `0 0 20px ${a.color}30` : '' }}>
                  <div className="font-serif text-xl mb-1" style={{ color: a.color }}>{a.name}</div>
                  <div className="text-[#F0E6FF]/60 text-sm leading-relaxed">{a.desc}</div>
                </button>
              ))}
              <button onClick={goNext} disabled={!archetype}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest transition-all ${archetype ? 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400' : 'bg-[rgba(240,230,255,0.05)] text-[rgba(240,230,255,0.2)] cursor-not-allowed'}`}>
                {t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* PHOTOS */}
          {currentStep === 'photos' && (
            <motion.div key="photos" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <h2 className="font-serif text-3xl text-[#F0E6FF]">{t('onboarding.photos_title')}</h2>
              <NinaSpeech message={t('onboarding.photos_desc')} />
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`aspect-square glass-card rounded-2xl flex items-center justify-center cursor-pointer hover:border-[rgba(245,168,0,0.3)] transition-all ${i < 3 ? 'border-[rgba(245,168,0,0.15)]' : ''}`}>
                    <div className="text-center">
                      <Upload className={`w-6 h-6 mx-auto mb-1 ${i < 3 ? 'text-[#F5A800]' : 'text-[rgba(240,230,255,0.2)]'}`} />
                      {i < 3 && <div className="text-[8px] text-[#F5A800]/60">{t('onboarding.required_badge')}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[#F0E6FF]/40 text-sm text-center">{t('onboarding.photos_required')}</p>
              <div className="flex gap-3">
                <button onClick={goNext} className="flex-1 py-3 border border-[rgba(240,230,255,0.1)] text-[#F0E6FF]/60 rounded-full text-sm hover:opacity-80 transition-all">
                  {t('common.skip')}
                </button>
                <button onClick={goNext} className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all">
                  {t('onboarding.continue')}
                </button>
              </div>
            </motion.div>
          )}

          {/* QUESTIONS */}
          {currentStep === 'questions' && (
            <motion.div key={`q-${currentQ}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5 }}
              className="w-full space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[#F0E6FF]/40 text-sm">
                  {currentQ + 1} / {QUESTIONS_21.length}
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[rgba(240,230,255,0.05)] text-xs">{t('onboarding.optional_badge')}</span>
                </span>
              </div>
              <h2 className="font-serif text-2xl text-[#F0E6FF] leading-relaxed">
                {lang === 'fr' ? QUESTIONS_21[currentQ].fr : QUESTIONS_21[currentQ].en}
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(lang === 'fr' ? QUESTIONS_21[currentQ].options_fr : QUESTIONS_21[currentQ].options_en).map((opt, i) => {
                  const qKey = QUESTIONS_21[currentQ].key;
                  const selected = QUESTIONS_21[currentQ].multi
                    ? (answers[qKey] || []).includes(opt)
                    : answers[qKey] === opt;
                  return (
                    <button key={i} onClick={() => {
                      if (QUESTIONS_21[currentQ].multi) {
                        const cur = answers[qKey] || [];
                        handleAnswer(qKey, selected ? cur.filter(v => v !== opt) : [...cur, opt]);
                      } else {
                        handleAnswer(qKey, opt);
                      }
                    }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${selected ? 'bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.4)] text-[#F5A800]' : 'glass-card hover:border-[rgba(245,168,0,0.2)] text-[#F0E6FF]/80'}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                {currentQ > 0 && (
                  <button onClick={() => setCurrentQ(q => q - 1)}
                    className="px-6 py-3 glass-card rounded-full text-[#F0E6FF]/60 hover:opacity-80 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentQ < QUESTIONS_21.length - 1 ? (
                  <button onClick={() => setCurrentQ(q => q + 1)}
                    className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                    {t('onboarding.next')} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={goNext}
                    className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all">
                    {t('onboarding.continue')}
                  </button>
                )}
              </div>
              <button onClick={goNext} className="w-full text-center text-[#F0E6FF]/30 text-sm hover:text-[#F0E6FF]/60 transition-colors">
                {t('common.skip')} →
              </button>
            </motion.div>
          )}

          {/* SUBSCRIPTION */}
          {currentStep === 'subscription' && (
            <motion.div key="subscription" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <NinaSpeech message={t('onboarding.subscription_intro')} />
              <h2 className="font-serif text-3xl text-[#F0E6FF]">{t('onboarding.subscription_title')}</h2>
              {plans.map(plan => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full glass-card rounded-2xl p-5 text-left flex items-center justify-between transition-all duration-300 ${selectedPlan === plan.id ? 'border-opacity-100' : 'hover:border-opacity-30'}`}
                  style={{ borderColor: selectedPlan === plan.id ? plan.color : 'rgba(240,230,255,0.08)', boxShadow: selectedPlan === plan.id ? `0 0 20px ${plan.color}20` : '' }}>
                  <div>
                    <div className="font-serif text-xl" style={{ color: plan.color }}>{plan.name}</div>
                    <div className="text-[#F0E6FF]/50 text-sm">{plan.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#F0E6FF]">{plan.price}</div>
                    {plan.id !== 'solar' && <div className="text-[#F0E6FF]/40 text-xs">{t('plans.per_month')}</div>}
                  </div>
                </button>
              ))}
              <button onClick={handleComplete} disabled={loading}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50">
                {loading ? t('common.loading') : t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* COMPLETE */}
          {currentStep === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
              className="w-full space-y-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-[rgba(245,168,0,0.08)] animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <img src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/c077be419_CopyofLogoNPIsoWoman.png"
                  alt="Nina" className="w-40 mx-auto relative z-10 drop-shadow-[0_0_40px_rgba(245,168,0,0.5)]" />
              </div>
              <div>
                <h1 className="font-serif text-4xl text-[#F0E6FF] mb-3">{t('onboarding.complete')}</h1>
                <p className="text-[#F0E6FF]/60 leading-relaxed">{t('onboarding.complete_desc')}</p>
              </div>
              <button onClick={() => navigate('/home')}
                className="w-full py-5 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_40px_rgba(245,168,0,0.4)] text-lg">
                {t('onboarding.go_home')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button */}
        {step > 1 && step < STEPS.length - 1 && (
          <button onClick={goPrev} className="mt-6 flex items-center gap-1 text-[#F0E6FF]/30 text-sm hover:text-[#F0E6FF]/60 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {t('common.back')}
          </button>
        )}
      </div>
    </div>
  );
}