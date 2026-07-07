import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Check, Loader2, Heart, MapPin, Users, Compass } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { ninaHorizontal, ninaIcon } from '@/lib/images';
import { MARTINIQUE_HERO_VIDEO, MARTINIQUE_GALLERY } from '@/lib/martiniqueMedia';
import { base44 } from '@/api/base44Client';

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const GOALS_EN = [
  { key: 'self_discovery', label: 'Self-discovery' },
  { key: 'healing', label: 'Healing' },
  { key: 'relationship_prep', label: 'Relationship preparation' },
  { key: 'communication', label: 'Communication' },
  { key: 'reconnection', label: 'Reconnection' },
  { key: 'emotional_resilience', label: 'Emotional resilience' },
  { key: 'life_transition', label: 'Life transition' },
  { key: 'other', label: 'Other' },
];
const GOALS_FR = [
  { key: 'self_discovery', label: 'Connaissance de soi' },
  { key: 'healing', label: 'Guérison' },
  { key: 'relationship_prep', label: 'Préparation relationnelle' },
  { key: 'communication', label: 'Communication' },
  { key: 'reconnection', label: 'Reconnexion' },
  { key: 'emotional_resilience', label: 'Résilience émotionnelle' },
  { key: 'life_transition', label: 'Transition de vie' },
  { key: 'other', label: 'Autre' },
];

// ── Experience Profile Form ──────────────────────────────────────────────────
function ExperienceProfileForm({ lang }) {
  const isFr = lang === 'fr';
  const MONTHS = isFr ? MONTHS_FR : MONTHS_EN;
  const GOALS = isFr ? GOALS_FR : GOALS_EN;

  const [section, setSection] = useState(0); // 0–6 + success
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', country: '', preferred_language: lang,
    experience_type: '', attending_with_partner: false, relationship_length: '',
    goals: [], goals_freetext: '',
    earliest_month: '', preferred_months: [], flexible_dates: false,
    preferred_duration: '', availability_plan: '',
    budget_band: '', accommodation_pref: '',
    attended_retreat_before: false, working_with_therapist: null, notes: '',
    consent_marketing: false,
    _trap: '', // honeypot
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleGoal = (key) => setForm(f => ({
    ...f, goals: f.goals.includes(key) ? f.goals.filter(g => g !== key) : [...f.goals, key],
  }));
  const toggleMonth = (m) => setForm(f => ({
    ...f, preferred_months: f.preferred_months.includes(m) ? f.preferred_months.filter(x => x !== m) : [...f.preferred_months, m],
  }));

  const sections = isFr
    ? ['À propos de vous', 'Votre intérêt', 'Vos objectifs', 'Disponibilité', 'Budget', 'Hébergement', 'Quelques questions']
    : ['About You', 'Your Interest', 'Your Goals', 'Availability', 'Budget', 'Accommodation', 'A Few More Questions'];

  const canAdvance = () => {
    if (section === 0) return form.full_name.trim() && form.email.trim().includes('@');
    if (section === 1) return !!form.experience_type;
    if (section === 3) return !!form.preferred_duration;
    if (section === 4) return !!form.budget_band;
    return true;
  };

  const handleSubmit = async () => {
    if (form._trap) return; // bot
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('submitExperienceLead', form);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setError(res.data?.error || (isFr ? 'Une erreur est survenue.' : 'Something went wrong.'));
      }
    } catch (e) {
      setError(isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 py-12">
        <div className="w-20 h-20 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-[#F5A800]" />
        </div>
        <h3 className="font-serif text-2xl text-foreground">
          {isFr ? 'Merci pour votre profil.' : 'Thank you for sharing your profile.'}
        </h3>
        <p className="text-foreground/60 text-sm max-w-sm mx-auto leading-relaxed">
          {isFr
            ? 'Notre équipe vous contactera pour discuter de l\'expérience qui correspond le mieux à vos objectifs et à votre disponibilité. Un courriel de confirmation vous a été envoyé.'
            : 'Our team will reach out to discuss the experience that best aligns with your goals and availability. A confirmation email has been sent.'}
        </p>
        <div className="golden-thread w-16 mx-auto" />
        <p className="text-foreground/50 text-sm">
          {isFr ? 'La Nina Purple Experience est une extension de la communauté Nina Purple. Toutes les participantes et participants rejoignent d\'abord la communauté.' : 'The Nina Purple Experience is an extension of the Nina Purple community. All participants first join the community.'}
        </p>
        <Link to="/onboarding"
          className="inline-block px-8 py-3.5 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all text-sm">
          {isFr ? 'Rejoindre Nina Purple' : 'Join Nina Purple'}
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-foreground/50 text-xs">{sections[section]}</span>
          <span className="text-foreground/30 text-xs">{section + 1} / {sections.length}</span>
        </div>
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-[#F5A800] rounded-full transition-all duration-500"
            style={{ width: `${((section + 1) / sections.length) * 100}%` }} />
        </div>
      </div>

      {/* Honeypot (hidden) */}
      <input type="text" name="_trap" value={form._trap} onChange={e => set('_trap', e.target.value)}
        style={{ position: 'absolute', left: '-9999px', opacity: 0 }} tabIndex={-1} autoComplete="off" />

      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-4">

          {/* Section 0 — About You */}
          {section === 0 && (
            <div className="space-y-4">
              <Field label={isFr ? 'Nom complet' : 'Full Name'} required>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  className="form-input" placeholder={isFr ? 'Votre nom' : 'Your name'} />
              </Field>
              <Field label={isFr ? 'Adresse courriel' : 'Email'} required>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="form-input" placeholder="you@example.com" />
              </Field>
              <Field label={isFr ? 'Téléphone' : 'Phone'}>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="form-input" placeholder="+1 514 000 0000" />
              </Field>
              <Field label={isFr ? 'Pays de résidence' : 'Country of Residence'}>
                <input value={form.country} onChange={e => set('country', e.target.value)}
                  className="form-input" placeholder={isFr ? 'Votre pays' : 'Your country'} />
              </Field>
              <Field label={isFr ? 'Langue préférée' : 'Preferred Language'}>
                <select value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)} className="form-select">
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </Field>
            </div>
          )}

          {/* Section 1 — Interest */}
          {section === 1 && (
            <div className="space-y-4">
              <p className="text-foreground/60 text-sm">{isFr ? 'Quel type d\'expérience vous intéresse ?' : 'What type of experience interests you?'}</p>
              {[
                { key: 'singles', en: 'Singles Experience', fr: 'Expérience pour célibataires', desc_en: 'Small groups matched by values, goals, and compatibility', desc_fr: 'Petits groupes appariés selon les valeurs, objectifs et compatibilité' },
                { key: 'couples', en: 'Couples Experience', fr: 'Expérience pour couples', desc_en: 'Flexible scheduling tailored to your relationship', desc_fr: 'Planning flexible adapté à votre relation' },
              ].map(opt => (
                <button key={opt.key} onClick={() => set('experience_type', opt.key)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${form.experience_type === opt.key ? 'border-[#F5A800] bg-[rgba(245,168,0,0.08)]' : 'glass-card border-border'}`}>
                  <div className="font-semibold text-foreground">{isFr ? opt.fr : opt.en}</div>
                  <div className="text-sm text-foreground/50 mt-0.5">{isFr ? opt.desc_fr : opt.desc_en}</div>
                  {form.experience_type === opt.key && <Check className="w-4 h-4 text-[#F5A800] mt-2" />}
                </button>
              ))}
              {form.experience_type === 'couples' && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.attending_with_partner} onChange={e => set('attending_with_partner', e.target.checked)} className="w-4 h-4 accent-[#F5A800]" />
                    <span className="text-sm text-foreground/70">{isFr ? 'J\'assiste avec mon partenaire' : 'Attending with my partner'}</span>
                  </label>
                  <Field label={isFr ? 'Depuis combien de temps êtes-vous ensemble ?' : 'How long have you been together?'}>
                    <input value={form.relationship_length} onChange={e => set('relationship_length', e.target.value)}
                      className="form-input" placeholder={isFr ? 'Ex : 3 ans' : 'e.g. 3 years'} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* Section 2 — Goals */}
          {section === 2 && (
            <div className="space-y-4">
              <Field label={isFr ? 'Qu\'aimeriez-vous retirer de cette expérience ?' : 'What would you most like to gain from this experience?'}>
                <textarea value={form.goals_freetext} onChange={e => set('goals_freetext', e.target.value)}
                  rows={3} className="form-input resize-none"
                  placeholder={isFr ? 'Partagez librement…' : 'Share freely…'} />
              </Field>
              <p className="text-foreground/50 text-xs">{isFr ? 'Sélectionnez tout ce qui s\'applique :' : 'Select all that apply:'}</p>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => {
                  const selected = form.goals.includes(g.key);
                  return (
                    <button key={g.key} onClick={() => toggleGoal(g.key)}
                      className={`text-left px-3 py-2 rounded-xl text-sm transition-all border ${selected ? 'border-[#F5A800] bg-[rgba(245,168,0,0.1)] text-[#F5A800]' : 'glass-card text-foreground/60'}`}>
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3 — Availability */}
          {section === 3 && (
            <div className="space-y-5">
              <Field label={isFr ? 'Mois de départ le plus tôt possible' : 'Earliest departure month'}>
                <select value={form.earliest_month} onChange={e => set('earliest_month', e.target.value)} className="form-select">
                  <option value="">—</option>
                  {MONTHS.map((m, i) => <option key={m} value={MONTHS_EN[i]}>{m}</option>)}
                </select>
              </Field>
              <div>
                <p className="text-foreground/60 text-sm mb-2">{isFr ? 'Mois préférés (plusieurs choix)' : 'Preferred travel months (multiple)'}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m, i) => {
                    const val = MONTHS_EN[i];
                    const sel = form.preferred_months.includes(val);
                    return (
                      <button key={m} onClick={() => toggleMonth(val)}
                        className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${sel ? 'border-[#F5A800] bg-[rgba(245,168,0,0.1)] text-[#F5A800]' : 'glass-card text-foreground/50'}`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.flexible_dates} onChange={e => set('flexible_dates', e.target.checked)} className="w-4 h-4 accent-[#F5A800]" />
                <span className="text-sm text-foreground/70">{isFr ? 'Dates flexibles' : 'Flexible dates'}</span>
              </label>
              <div>
                <p className="text-foreground/60 text-sm mb-2">{isFr ? 'Durée préférée *' : 'Preferred duration *'}</p>
                {[{v:'2w', en:'2 weeks', fr:'2 semaines'},{v:'3w', en:'3 weeks', fr:'3 semaines'},{v:'flexible', en:'Flexible', fr:'Flexible'}].map(d => (
                  <button key={d.v} onClick={() => set('preferred_duration', d.v)}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full text-sm border transition-all ${form.preferred_duration === d.v ? 'border-[#F5A800] bg-[rgba(245,168,0,0.1)] text-[#F5A800]' : 'glass-card text-foreground/60'}`}>
                    {isFr ? d.fr : d.en}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-foreground/60 text-sm mb-2">{isFr ? 'Disponibilité pendant le séjour' : 'Availability during stay'}</p>
                {[
                  { v: 'work_along', en: 'Work Along Plan', fr: 'Plan partiel', desc_en: 'Integrate the program around existing commitments', desc_fr: 'Intégrez le programme autour de vos engagements' },
                  { v: 'dedicated', en: 'Dedicated Plan', fr: 'Plan dédié', desc_en: 'Fully present and immersed for the entire experience', desc_fr: 'Entièrement présent·e et immergé·e tout au long de l\'expérience' },
                ].map(p => (
                  <button key={p.v} onClick={() => set('availability_plan', p.v)}
                    className={`w-full text-left p-3 rounded-xl border mb-2 transition-all ${form.availability_plan === p.v ? 'border-[#7B2FBE] bg-[rgba(123,47,190,0.08)]' : 'glass-card border-border'}`}>
                    <div className="font-medium text-sm text-foreground">{isFr ? p.fr : p.en}</div>
                    <div className="text-xs text-foreground/50 mt-0.5">{isFr ? p.desc_fr : p.desc_en}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4 — Budget */}
          {section === 4 && (
            <div className="space-y-3">
              <p className="text-foreground/60 text-sm">{isFr ? 'Quel investissement envisagez-vous (hors vols) ?' : 'What investment range are you comfortable considering (excluding flights)?'}</p>
              {[
                { v: 'under_4k', label: '< €4,000' },
                { v: '4k_6k', label: '€4,000 – €6,000' },
                { v: '6k_8k', label: '€6,000 – €8,000' },
                { v: '8k_10k', label: '€8,000 – €10,000' },
                { v: '10k_plus', label: '€10,000+' },
                { v: 'discuss', label: isFr ? 'Je souhaite discuter des options' : 'I\'d like to discuss options' },
              ].map(b => (
                <button key={b.v} onClick={() => set('budget_band', b.v)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${form.budget_band === b.v ? 'border-[#F5A800] bg-[rgba(245,168,0,0.1)] text-[#F5A800]' : 'glass-card text-foreground/60'}`}>
                  {b.label}
                </button>
              ))}
            </div>
          )}

          {/* Section 5 — Accommodation */}
          {section === 5 && (
            <div className="space-y-3">
              <p className="text-foreground/60 text-sm">{isFr ? 'Préférence d\'hébergement' : 'Accommodation preference'}</p>
              {[
                { v: 'shared', en: 'Shared accommodation', fr: 'Hébergement partagé' },
                { v: 'private', en: 'Private room', fr: 'Chambre privée' },
                { v: 'premium_suite', en: 'Premium suite', fr: 'Suite premium' },
                { v: 'no_pref', en: 'No preference', fr: 'Sans préférence' },
              ].map(a => (
                <button key={a.v} onClick={() => set('accommodation_pref', a.v)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${form.accommodation_pref === a.v ? 'border-[#7B2FBE] bg-[rgba(123,47,190,0.08)] text-[#A855F7]' : 'glass-card text-foreground/60'}`}>
                  {isFr ? a.fr : a.en}
                </button>
              ))}
            </div>
          )}

          {/* Section 6 — More Questions */}
          {section === 6 && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.attended_retreat_before} onChange={e => set('attended_retreat_before', e.target.checked)} className="w-4 h-4 accent-[#F5A800]" />
                <span className="text-sm text-foreground/70">{isFr ? 'J\'ai déjà participé à un séjour de ce type' : 'I have previously attended a retreat'}</span>
              </label>
              <div>
                <p className="text-foreground/60 text-sm mb-2">{isFr ? 'Travaillez-vous actuellement avec un thérapeute ou un coach ? (facultatif)' : 'Are you currently working with a therapist or coach? (Optional)'}</p>
                {[{v: true, en: 'Yes', fr: 'Oui'},{v: false, en: 'No', fr: 'Non'}].map(o => (
                  <button key={String(o.v)} onClick={() => set('working_with_therapist', o.v)}
                    className={`mr-2 px-4 py-2 rounded-full text-sm border transition-all ${form.working_with_therapist === o.v ? 'border-[#F5A800] bg-[rgba(245,168,0,0.1)] text-[#F5A800]' : 'glass-card text-foreground/60'}`}>
                    {isFr ? o.fr : o.en}
                  </button>
                ))}
              </div>
              <Field label={isFr ? 'Y a-t-il autre chose que vous souhaitez nous faire savoir ?' : 'Is there anything you\'d like us to know before contacting you?'}>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={3} className="form-input resize-none" placeholder="…" />
              </Field>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.consent_marketing} onChange={e => set('consent_marketing', e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#F5A800]" />
                <span className="text-xs text-foreground/50 leading-relaxed">
                  {isFr ? 'J\'accepte de recevoir des communications de Nina Purple sur les prochaines expériences et événements.' : 'I agree to receive communications from Nina Purple about upcoming experiences and events.'}
                </span>
              </label>
              {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {section > 0 && (
          <button onClick={() => setSection(s => s - 1)} className="px-5 py-3 glass-card rounded-full text-foreground/60 hover:opacity-80 transition-all flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {section < sections.length - 1 ? (
          <button onClick={() => canAdvance() && setSection(s => s + 1)} disabled={!canAdvance()}
            className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isFr ? 'Continuer' : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 bg-[#7B2FBE] text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#9B4FDE] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Envoi…' : 'Sending…'}</> : (isFr ? 'Envoyer mon profil' : 'Submit my profile')}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-foreground/60 text-sm mb-1.5">
        {label}{required && <span className="text-[#F5A800] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Experiences() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [formOpen, setFormOpen] = useState(false);

  const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } };

  return (
    <div className="min-h-screen bg-[#0B0510] overflow-x-hidden">
      {/* Styles injected for form inputs */}
      <style>{`
        .form-input { width: 100%; background: transparent; border-radius: 0.75rem; padding: 0.75rem 1rem; color: var(--foreground, #F0E6FF); outline: none; transition: border-color 0.2s; }
        .form-input, .form-select { border: 1px solid rgba(240,230,255,0.12); background: rgba(31,16,38,0.6); backdrop-filter: blur(20px); border-radius: 0.75rem; padding: 0.75rem 1rem; color: var(--foreground, #F0E6FF); width: 100%; outline: none; }
        .form-input:focus, .form-select:focus { border-color: rgba(245,168,0,0.4); }
        .form-select option { background: #1F1026; color: #F0E6FF; }
        [data-theme="light"] .form-input, [data-theme="light"] .form-select { background: rgba(255,255,255,0.9); border-color: rgba(123,47,190,0.2); color: #1A0A2E; }
        [data-theme="light"] .form-select option { background: #ffffff; color: #1A0A2E; }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(11,5,16,0.9)', backdropFilter: 'blur(20px)' }}>
        <Link to="/">
          <img src={ninaHorizontal} alt="Nina Purple" className="h-8 object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <button onClick={() => setFormOpen(true)}
            className="hidden md:block px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold hover:bg-yellow-400 transition-all">
            {isFr ? 'Demander des informations' : 'Request Information'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          poster=""
        >
          <source src={MARTINIQUE_HERO_VIDEO} type="video/mp4" />
        </video>
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(11,5,16,0.6) 0%, rgba(11,5,16,0.85) 100%)' }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(123,47,190,0.12) 0%, transparent 70%)' }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-[#F5A800] border border-[rgba(245,168,0,0.3)] mb-2">
            2026 · Martinique · Caribbean
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-[#F0E6FF] leading-tight">
            {isFr ? 'Découvrez la relation la plus importante de votre vie.' : 'Discover the most important relationship of your life.'}
          </h1>
          <p className="font-serif text-xl md:text-2xl text-[#F5A800] italic">
            {isFr ? 'Celle que vous avez avec vous-même.' : 'The one you have with yourself.'}
          </p>
          <p className="text-[#F0E6FF]/60 text-lg leading-relaxed max-w-2xl mx-auto">
            {isFr
              ? 'Imaginez vous éloigner du bruit du quotidien pour entrer dans un environnement conçu pour vous reconnecter — à vous-même, aux autres, et à ce qui compte vraiment.'
              : 'Imagine stepping away from the noise of everyday life and into an environment designed to help you reconnect — with yourself, with others, and with what truly matters.'}
          </p>
          <p className="text-[#F0E6FF]/50 text-base">
            {isFr
              ? 'Célibataire ou en couple, chaque expérience Nina Purple est conçue pour favoriser la conscience de soi, la croissance émotionnelle et une transformation durable.'
              : 'Whether you\'re single or in a relationship, every Nina Purple Experience is thoughtfully designed to foster self-awareness, emotional growth, and lasting transformation.'}
          </p>
          <button onClick={() => setFormOpen(true)}
            className="inline-block px-10 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.3)]">
            {isFr ? 'Demander des informations' : 'Request Information'}
          </button>
        </motion.div>
        <motion.div animate={{ y: [0,8,0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8">
          <ChevronDown className="w-6 h-6 text-[#F0E6FF]/30" />
        </motion.div>
      </section>

      <div className="golden-thread w-full" />

      {/* A Different Kind */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <motion.div {...fadeUp} className="space-y-5">
          <h2 className="font-serif text-4xl text-[#F0E6FF]">{isFr ? 'Une expérience différente.' : 'A Different Kind of Experience.'}</h2>
          <p className="text-[#F0E6FF]/60 text-lg">{isFr ? 'Bien des séjours vous aident à vous déconnecter du travail.' : 'Many retreats help you disconnect from work.'}</p>
          <p className="text-[#F5A800] font-serif text-xl">{isFr ? 'Nous vous aidons à vous reconnecter à vous-même.' : 'We help you reconnect with yourself.'}</p>
          <p className="text-[#F0E6FF]/60 leading-relaxed">
            {isFr
              ? 'Chaque expérience Nina Purple associe un accompagnement thérapeutique professionnel, des conversations profondes, la nature et des expériences partagées pour favoriser des relations plus saines, bien au-delà de votre séjour en Martinique.'
              : 'Every Nina Purple Experience combines professional therapeutic guidance, meaningful conversations, nature, and shared experiences to help create healthier relationships that extend far beyond your time in Martinique.'}
          </p>
        </motion.div>
      </section>

      <div className="golden-thread w-full" />

      {/* Designed Around People */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="font-serif text-4xl text-[#F0E6FF] mb-4">{isFr ? 'Conçu pour les gens, pas pour les calendriers.' : 'Designed Around People, Not Calendars.'}</h2>
          <p className="text-[#F0E6FF]/60 max-w-2xl mx-auto">
            {isFr ? 'Contrairement aux séjours traditionnels avec des dates fixes, Nina Purple conçoit chaque expérience autour de ses participants.' : 'Unlike traditional retreats with fixed departure dates, Nina Purple builds each experience around its participants.'}
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: Heart, color: '#F5A800',
              title_en: 'Singles Experiences', title_fr: 'Expériences pour célibataires',
              body_en: 'We thoughtfully form small groups based on shared values, life stage, relationship goals, personal affinities, preferred travel periods, language preferences, and group compatibility.',
              body_fr: 'Nous formons de petits groupes en fonction des valeurs communes, de l\'étape de vie, des objectifs relationnels, des affinités, des périodes de voyage préférées, de la langue et de la compatibilité de groupe.',
            },
            {
              icon: Users, color: '#7B2FBE',
              title_en: 'Couples Experiences', title_fr: 'Expériences pour couples',
              body_en: 'Couples enjoy greater flexibility. Whether celebrating a new chapter, rebuilding after challenges, or simply investing in your relationship — your experience can be tailored to your needs.',
              body_fr: 'Les couples bénéficient d\'une plus grande flexibilité. Que vous célébriez un nouveau chapitre, reconstruisiez après des défis ou investissiez simplement dans votre relation.',
            },
          ].map((card, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1, duration: 0.7 }} className="glass-card rounded-3xl p-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                <card.icon className="w-7 h-7" style={{ color: card.color }} />
              </div>
              <h3 className="font-serif text-2xl text-[#F0E6FF] mb-3">{isFr ? card.title_fr : card.title_en}</h3>
              <p className="text-[#F0E6FF]/60 leading-relaxed text-sm">{isFr ? card.body_fr : card.body_en}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="golden-thread w-full" />

      {/* Your Journey */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="font-serif text-4xl text-[#F0E6FF]">{isFr ? 'Votre parcours.' : 'Your Journey.'}</h2>
        </motion.div>
        <div className="space-y-6">
          {[
            {
              phase: isFr ? 'Avant la Martinique' : 'Before Martinique',
              color: '#7B2FBE', icon: '🌱',
              body_en: 'Your experience begins well before departure. You\'ll complete an onboarding process, reflect on your goals, and participate in guided therapeutic preparation — establishing psychological safety and readiness several weeks in advance.',
              body_fr: 'Votre expérience commence bien avant le départ. Vous complétez un processus d\'accueil, réfléchissez à vos objectifs et participez à une préparation thérapeutique guidée — établissant sécurité psychologique et état de préparation plusieurs semaines à l\'avance.',
            },
            {
              phase: isFr ? 'En Martinique' : 'In Martinique',
              color: '#F5A800', icon: '🌊',
              body_en: 'Every day balances personal reflection, therapeutic support, experiential learning, relaxation, and genuine human connection. Your experience may include guided workshops, group therapy, relationship education, mindfulness, nature immersion, Caribbean exploration, shared meals, and meaningful conversations.',
              body_fr: 'Chaque journée équilibre réflexion personnelle, soutien thérapeutique, apprentissage expérientiel, détente et connexion humaine authentique — ateliers guidés, thérapie de groupe, éducation relationnelle, pleine conscience, immersion dans la nature, exploration caribéenne, repas partagés.',
            },
            {
              phase: isFr ? 'Retour à la maison' : 'Returning Home',
              color: '#A855F7', icon: '✨',
              body_en: 'Transformation doesn\'t end at the airport. Following your experience, ongoing therapeutic support and community connection help you integrate what you\'ve learned into everyday life, reinforcing the growth achieved during your stay.',
              body_fr: 'La transformation ne s\'arrête pas à l\'aéroport. Un soutien thérapeutique continu et les liens communautaires vous aident à intégrer ce que vous avez appris dans votre quotidien, renforçant la croissance accomplie pendant votre séjour.',
            },
          ].map((phase, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="glass-card rounded-3xl p-7 flex gap-5">
              <div className="text-3xl mt-1">{phase.icon}</div>
              <div>
                <h3 className="font-serif text-xl mb-2" style={{ color: phase.color }}>{phase.phase}</h3>
                <p className="text-[#F0E6FF]/60 text-sm leading-relaxed">{isFr ? phase.body_fr : phase.body_en}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="golden-thread w-full" />

      {/* Martinique in Motion — video gallery */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="font-serif text-4xl text-[#F0E6FF] mb-3">{isFr ? 'La Martinique en mouvement' : 'Martinique in Motion'}</h2>
          <p className="text-[#F0E6FF]/50 max-w-xl mx-auto text-sm">
            {isFr ? 'Un aperçu du paysage qui vous attend.' : 'A glimpse of the landscape that awaits you.'}
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MARTINIQUE_GALLERY.map((clip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className={`relative rounded-2xl overflow-hidden glass-card group ${i % 5 === 0 ? 'md:row-span-2 md:col-span-2 aspect-square md:aspect-auto' : 'aspect-square'}`}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
              >
                <source src={clip.url} type={clip.url.endsWith('.MOV') ? 'video/quicktime' : 'video/mp4'} />
              </video>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(11,5,16,0.7) 100%)' }} />
              <div className="absolute bottom-2 left-3 text-[#F0E6FF]/70 text-[10px] uppercase tracking-widest font-medium">
                {clip.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="golden-thread w-full" />

      {/* Why Martinique */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <motion.div {...fadeUp} className="space-y-5">
          <MapPin className="w-8 h-8 text-[#F5A800] mx-auto" />
          <h2 className="font-serif text-4xl text-[#F0E6FF]">{isFr ? 'Pourquoi la Martinique ?' : 'Why Martinique?'}</h2>
          <p className="text-[#F0E6FF]/60 text-lg">{isFr ? 'La Martinique offre quelque chose de plus en plus rare.' : 'Martinique offers something increasingly rare.'}</p>
          <div className="space-y-2 font-serif text-2xl text-[#F5A800]">
            <p>{isFr ? 'L\'espace.' : 'Space.'}</p>
            <p>{isFr ? 'L\'espace pour respirer.' : 'Space to breathe.'}</p>
            <p>{isFr ? 'L\'espace pour réfléchir.' : 'Space to reflect.'}</p>
            <p>{isFr ? 'L\'espace pour se reconnecter.' : 'Space to reconnect.'}</p>
          </div>
          <p className="text-[#F0E6FF]/50 leading-relaxed">
            {isFr
              ? 'Ses montagnes, ses forêts tropicales, ses plages et son rythme plus lent créent un environnement idéal pour une croissance personnelle et relationnelle profonde. Parfois, un nouveau paysage crée une nouvelle perspective.'
              : 'Its mountains, rainforests, beaches, and slower rhythm create an ideal environment for meaningful personal and relational growth. Sometimes a new landscape creates a new perspective.'}
          </p>
        </motion.div>
      </section>

      <div className="golden-thread w-full" />

      {/* Is This Right For You */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <motion.div {...fadeUp} className="glass-card-orchid rounded-3xl p-10 text-center space-y-6">
          <Compass className="w-8 h-8 text-[#7B2FBE] mx-auto" />
          <h2 className="font-serif text-3xl text-[#F0E6FF]">{isFr ? 'Est-ce fait pour vous ?' : 'Is This Experience Right for You?'}</h2>
          <p className="text-[#F0E6FF]/60">{isFr ? 'Vous êtes peut-être prêt·e si vous :' : 'You may be ready if you are'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {(isFr ? [
              'traversez une transition de vie', 'vous guérissez après une rupture',
              'cherchez des schémas relationnels plus sains', 'vous préparez à un partenariat durable',
              'souhaitez renforcer votre relation', 'cherchez une vraie connexion humaine',
              'êtes prêt·e à investir dans votre croissance personnelle',
            ] : [
              'navigating a life transition', 'healing after heartbreak',
              'seeking healthier relationship patterns', 'preparing for a lasting partnership',
              'wanting to strengthen your relationship', 'looking for genuine human connection',
              'ready to invest in your personal growth',
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[#F0E6FF]/70">
                <Check className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" /> {item}
              </div>
            ))}
          </div>
          <button onClick={() => setFormOpen(true)}
            className="inline-block px-10 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.2)]">
            {isFr ? 'Demander des informations' : 'Request Information'}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(240,230,255,0.06)] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={ninaHorizontal} alt="Nina Purple" className="h-8 object-contain opacity-60" />
          <div className="text-[#F0E6FF]/30 text-sm text-center">
            © 2026 Nina Purple
            <span className="mx-2">·</span>
            <Link to="/" className="underline hover:text-[#F5A800]">{isFr ? 'Accueil' : 'Home'}</Link>
            <span className="mx-2">·</span>
            <Link to="/privacy" className="underline hover:text-[#F5A800]">{isFr ? 'Confidentialité' : 'Privacy'}</Link>
            <span className="mx-2">·</span>
            <Link to="/terms" className="underline hover:text-[#F5A800]">{isFr ? 'Conditions' : 'Terms'}</Link>
          </div>
        </div>
      </footer>

      {/* Experience Profile Modal */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-0 md:px-6"
            style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setFormOpen(false); }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.4 }}
              className="w-full max-w-lg bg-[#1F1026] rounded-t-3xl md:rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Votre profil d\'expérience' : 'Your Experience Profile'}</h2>
                  <p className="text-[#F0E6FF]/40 text-xs mt-0.5">{isFr ? 'Confidentiel · Examiné par notre équipe' : 'Confidential · Reviewed by our team'}</p>
                </div>
                <button onClick={() => setFormOpen(false)} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] text-xl leading-none">✕</button>
              </div>
              <ExperienceProfileForm lang={lang} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}