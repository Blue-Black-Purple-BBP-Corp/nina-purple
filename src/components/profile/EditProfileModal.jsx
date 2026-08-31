import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { QUESTIONS_21 } from '@/pages/Onboarding';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import RequestChangeModal from './RequestChangeModal';
import { getActiveArchetypes, getArchetypeLabel, getArchetypeDescription } from '@/lib/archetypes';

export default function EditProfileModal({ isOpen, onClose, userProfile, matchingAnswers, onUpdate, onAnswersUpdate, lang, initialTab }) {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({});
  const [archetype, setArchetype] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [changeField, setChangeField] = useState(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setProfile({
        full_name: userProfile.full_name || '',
        display_name: userProfile.display_name || '',
        city: userProfile.city || '',
        phone: userProfile.phone || '',
        birthdate: userProfile.birthdate || '',
        sexual_orientation: userProfile.sexual_orientation || '',
        gender_pronoun: userProfile.gender_pronoun || '',
        relationship_status: userProfile.relationship_status || '',
      });
      setArchetype(userProfile.dating_archetype || '');
      setAnswers(matchingAnswers || {});
      setTab(initialTab || 'profile');
      setCurrentQ(0);
      base44.auth.me().then(u => setEmail(u?.email || '')).catch(() => {});
    }
  }, [isOpen, userProfile, matchingAnswers]);

  if (!isOpen) return null;

  const archetypes = getActiveArchetypes();

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    if (currentQ < QUESTIONS_21.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 250);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const completeness = calcCompleteness();
    await base44.functions.invoke('updateProfile', {
      ...profile,
      dating_archetype: archetype,
      profile_completeness: completeness,
    });
    if (matchingAnswers?.id) {
      const answeredCount = Object.keys(answers).filter(k => answers[k] && QUESTIONS_21.some(q => q.key === k)).length;
      await base44.entities.MatchingAnswers.update(matchingAnswers.id, {
        ...answers,
        questions_answered: answeredCount,
      });
    }
    onUpdate({ ...userProfile, ...profile, dating_archetype: archetype, profile_completeness: completeness });
    if (onAnswersUpdate) onAnswersUpdate({ ...matchingAnswers, ...answers });
    setSaving(false);
    onClose();
  };

  const calcCompleteness = () => {
    let score = 0;
    if (profile.full_name) score += 5;
    if (profile.display_name) score += 5;
    if (profile.city) score += 10;
    if (profile.birthdate) score += 10;
    if (profile.sexual_orientation) score += 10;
    if (profile.gender_pronoun) score += 10;
    if (profile.relationship_status) score += 10;
    if (archetype) score += 10;
    const photoCount = (userProfile?.photos || []).length;
    if (photoCount >= 1) score += 5;
    if (photoCount >= 3) score += 5;
    if (photoCount >= 6) score += 5;
    const answeredQ = Object.keys(answers).filter(k => answers[k] && QUESTIONS_21.some(q => q.key === k)).length;
    score += Math.round((answeredQ / 21) * 15);
    return Math.min(100, score);
  };

  const inputClass = "w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] bg-transparent";
  const labelClass = "block text-[#F0E6FF]/50 text-xs uppercase tracking-wide mb-1.5";

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">
              {lang === 'fr' ? 'Modifier mon profil' : 'Edit My Profile'}
            </h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {['profile', 'archetype', 'questions'].map(t => (
              <button key={t} onClick={() => { setTab(t); setCurrentQ(0); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60'}`}>
                {t === 'profile' ? (lang === 'fr' ? 'Infos' : 'Info')
                  : t === 'archetype' ? (lang === 'fr' ? 'Archétype' : 'Archetype')
                  : (lang === 'fr' ? '21 Questions' : '21 Questions')}
              </button>
            ))}
          </div>

          {/* TAB: Profile Info */}
          {tab === 'profile' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>{lang === 'fr' ? 'Nom' : 'Name'}</label>
                  <button onClick={() => setChangeField('full_name')} className="text-[#F5A800] text-xs hover:underline">
                    {lang === 'fr' ? 'Demander un changement' : 'Request change'}
                  </button>
                </div>
                <input value={profile.full_name} readOnly className={`${inputClass} opacity-60`} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>{lang === 'fr' ? 'Courriel' : 'Email'}</label>
                  <button onClick={() => setChangeField('email')} className="text-[#F5A800] text-xs hover:underline">
                    {lang === 'fr' ? 'Demander un changement' : 'Request change'}
                  </button>
                </div>
                <input value={email} readOnly className={`${inputClass} opacity-60`} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'fr' ? 'Nom affiché' : 'Display name'}</label>
                <input value={profile.display_name} onChange={e => set('display_name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>{lang === 'fr' ? 'Téléphone' : 'Phone number'}</label>
                  <button onClick={() => setChangeField('phone')} className="text-[#F5A800] text-xs hover:underline">
                    {lang === 'fr' ? 'Demander un changement' : 'Request change'}
                  </button>
                </div>
                <input value={profile.phone || (lang === 'fr' ? 'Non défini' : 'Not set')} readOnly className={`${inputClass} opacity-60`} />
                <p className="text-[#F0E6FF]/30 text-xs mt-1">
                  {lang === 'fr'
                    ? 'Les changements de numéro nécessitent une vérification par SMS (bientôt disponible).'
                    : 'Phone changes require SMS verification (coming soon).'}
                </p>
              </div>
              <div>
                <label className={labelClass}>{lang === 'fr' ? 'Ville' : 'City'}</label>
                <LocationAutocomplete value={profile.city} onChange={val => set('city', val)}
                  placeholder={lang === 'fr' ? 'Rechercher une ville…' : 'Search a city…'} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>{lang === 'fr' ? 'Date de naissance' : 'Birthdate'}</label>
                  <button onClick={() => setChangeField('birthdate')} className="text-[#F5A800] text-xs hover:underline">
                    {lang === 'fr' ? 'Demander un changement' : 'Request change'}
                  </button>
                </div>
                <input type="date" value={profile.birthdate} readOnly className={`${inputClass} opacity-60`} />
              </div>
              {[
                { key: 'sexual_orientation', label: lang === 'fr' ? 'Orientation' : 'Orientation', opts: lang === 'fr' ? ['Hétérosexuel(le)', 'Gay', 'Lesbienne', 'Bisexuel(le)', 'Asexuel(le)', 'Pansexuel(le)', 'Queer', 'Autre'] : ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Pansexual', 'Queer', 'Other'] },
                { key: 'gender_pronoun', label: lang === 'fr' ? 'Pronom' : 'Pronoun', opts: ['He/Him', 'She/Her', 'They/Them', 'Non-Binary', 'Other'] },
                { key: 'relationship_status', label: lang === 'fr' ? 'Statut' : 'Status', opts: lang === 'fr' ? ['Célibataire', 'Séparé(e)', 'Veuf/Veuve', 'Divorcé(e)', 'Relation ouverte', 'Autre'] : ['Single', 'Separated', 'Widowed', 'Divorced', 'Open Relationship', 'Other'] },
              ].map(sel => (
                <div key={sel.key}>
                  <label className={labelClass}>{sel.label}</label>
                  <select value={profile[sel.key]} onChange={e => set(sel.key, e.target.value)}
                    className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none bg-[#1F1026] border border-[rgba(240,230,255,0.08)]">
                    <option value="">—</option>
                    {sel.opts.map(o => <option key={o} value={o} className="bg-[#1F1026]">{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* TAB: Archetype */}
          {tab === 'archetype' && (
            <div className="space-y-3" role="radiogroup" aria-label={lang === 'fr' ? 'Choisissez votre archétype de rencontre' : 'Select your dating archetype'}>
              <p className="text-[#F0E6FF]/50 text-sm">{lang === 'fr' ? 'Sélectionnez votre archétype de rencontre' : 'Select your dating archetype'}</p>
              {archetypes.map(a => {
                const selected = archetype === a.code;
                return (
                  <button key={a.code} onClick={() => setArchetype(a.code)}
                    role="radio"
                    aria-checked={selected}
                    aria-label={getArchetypeLabel(a.code, lang)}
                    className="w-full rounded-2xl p-4 text-left transition-all duration-300"
                    style={{
                      background: selected ? `${a.color}18` : 'rgba(31,16,38,0.7)',
                      border: `2px solid ${selected ? a.color : 'rgba(240,230,255,0.08)'}`,
                      boxShadow: selected ? `0 0 20px ${a.color}30` : 'none',
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif text-lg" style={{ color: a.color }}>{getArchetypeLabel(a.code, lang)}</span>
                      {selected && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="sr-only">{lang === 'fr' ? 'Sélectionné' : 'Selected'}</span>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: a.color }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="#0B0510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-[#F0E6FF]/60">{getArchetypeDescription(a.code, lang)}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB: 21 Questions */}
          {tab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[#F0E6FF]/40 text-sm">{currentQ + 1} / {QUESTIONS_21.length}</span>
                <div className="flex-1 h-1 rounded-full bg-[rgba(240,230,255,0.05)] overflow-hidden">
                  <div className="h-full bg-[#F5A800] rounded-full transition-all" style={{ width: `${((currentQ + 1) / QUESTIONS_21.length) * 100}%` }} />
                </div>
              </div>
              <p className="text-[#F0E6FF] font-serif text-lg leading-relaxed">
                {lang === 'fr' ? QUESTIONS_21[currentQ].fr : QUESTIONS_21[currentQ].en}
              </p>
              <div className="space-y-2">
                {(lang === 'fr' ? QUESTIONS_21[currentQ].options_fr : QUESTIONS_21[currentQ].options_en).map((label, i) => {
                  const qKey = QUESTIONS_21[currentQ].key;
                  const optKey = QUESTIONS_21[currentQ].opt_keys[i];
                  const selected = answers[qKey] === optKey;
                  return (
                    <button key={i} onClick={() => handleAnswer(qKey, optKey)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${selected ? 'bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.4)] text-[#F5A800]' : 'glass-card hover:border-[rgba(245,168,0,0.2)] text-[#F0E6FF]/70'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                  className="px-4 py-2 glass-card rounded-full text-[#F0E6FF]/40 disabled:opacity-20 hover:text-[#F0E6FF]/70">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentQ(q => Math.min(QUESTIONS_21.length - 1, q + 1))} disabled={currentQ === QUESTIONS_21.length - 1}
                  className="px-4 py-2 glass-card rounded-full text-[#F0E6FF]/40 disabled:opacity-20 hover:text-[#F0E6FF]/70">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'fr' ? 'Enregistrer' : 'Save Changes'}
          </button>
        </div>
      </div>

      {changeField && (
        <RequestChangeModal
          isOpen={!!changeField}
          field={changeField}
          currentValue={changeField === 'email' ? email : profile[changeField] || ''}
          lang={lang}
          onClose={() => setChangeField(null)}
          onSubmitted={() => setChangeField(null)}
        />
      )}
    </>
  );
}