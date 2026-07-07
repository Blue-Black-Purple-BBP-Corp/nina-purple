import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Mail, Loader2, Check, Info } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function CoupleSegmentation({ profileType, setProfileType, partnerEmail, setPartnerEmail, onContinue, isFr }) {
  const [checking, setChecking] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleContinue = async () => {
    if (profileType === 'couple') {
      if (!partnerEmail.trim() || !partnerEmail.includes('@')) {
        setEmailError(isFr ? 'Veuillez entrer un courriel valide.' : 'Please enter a valid email.');
        return;
      }
    }
    onContinue();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.6 }}
      className="w-full space-y-6">
      <div className="text-center">
        <h2 className="font-serif text-3xl text-foreground mb-2">
          {isFr ? 'Comment explorez-vous ?' : 'How are you exploring?'}
        </h2>
        <p className="text-foreground/50 text-sm">
          {isFr
            ? 'Nina Purple accompagne les individus ET les couples. Choisissez votre parcours.'
            : 'Nina Purple supports individuals AND couples. Choose your journey.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setProfileType('individual')}
          className={`p-6 rounded-2xl text-left transition-all ${profileType === 'individual' ? 'border-2 border-[#F5A800] bg-[rgba(245,168,0,0.08)]' : 'glass-card border-2 border-transparent'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: profileType === 'individual' ? 'rgba(245,168,0,0.15)' : 'rgba(240,230,255,0.05)' }}>
            <User className="w-6 h-6" style={{ color: profileType === 'individual' ? '#F5A800' : 'rgba(240,230,255,0.4)' }} />
          </div>
          <h3 className="font-serif text-lg text-foreground mb-1">{isFr ? 'Seul·e' : 'Individual'}</h3>
          <p className="text-foreground/50 text-xs leading-relaxed">
            {isFr ? 'Je crée ce profil pour moi, pour le matching conscient et la communauté.' : 'I am creating this profile for myself, for conscious matching and community.'}
          </p>
          {profileType === 'individual' && <Check className="w-4 h-4 text-[#F5A800] mt-2" />}
        </button>

        <button onClick={() => setProfileType('couple')}
          className={`p-6 rounded-2xl text-left transition-all ${profileType === 'couple' ? 'border-2 border-[#7B2FBE] bg-[rgba(123,47,190,0.08)]' : 'glass-card border-2 border-transparent'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: profileType === 'couple' ? 'rgba(123,47,190,0.15)' : 'rgba(240,230,255,0.05)' }}>
            <Users className="w-6 h-6" style={{ color: profileType === 'couple' ? '#7B2FBE' : 'rgba(240,230,255,0.4)' }} />
          </div>
          <h3 className="font-serif text-lg text-foreground mb-1">{isFr ? 'En couple' : 'As a Couple'}</h3>
          <p className="text-foreground/50 text-xs leading-relaxed">
            {isFr ? 'Je crée ce profil avec mon/ma partenaire pour l\'expérience Nina Purple.' : 'I am creating this profile with my partner for the Nina Purple Experience.'}
          </p>
          {profileType === 'couple' && <Check className="w-4 h-4 text-[#7B2FBE] mt-2" />}
        </button>
      </div>

      {profileType === 'couple' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
          <div className="p-4 rounded-xl bg-[rgba(123,47,190,0.08)] border border-[rgba(123,47,190,0.2)]">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" />
              <p className="text-foreground/60 text-xs leading-relaxed">
                {isFr
                  ? "Si votre partenaire a déjà un compte Nina Purple, nous lui enverrons une demande de liaison dans son tableau de bord. S'il n'a pas encore de compte, nous lui enverrons une invitation par courriel pour en créer un."
                  : "If your partner already has a Nina Purple account, we'll send them a link-up request in their dashboard. If they don't have an account yet, we'll send them an email invite to create one."}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-foreground/60 text-sm mb-2">
              {isFr ? 'Courriel de votre partenaire' : 'Your partner\'s email'} <span className="text-[#F5A800]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
              <input
                type="email"
                value={partnerEmail}
                onChange={e => { setPartnerEmail(e.target.value); setEmailError(''); }}
                className="w-full glass-card rounded-xl pl-10 pr-4 py-3 text-foreground outline-none focus:border-[rgba(123,47,190,0.4)] transition-all bg-transparent"
                placeholder="partner@example.com"
              />
            </div>
            {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
          </div>
        </motion.div>
      )}

      <button onClick={handleContinue} disabled={!profileType}
        className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {isFr ? 'Continuer' : 'Continue'}
      </button>
    </motion.div>
  );
}