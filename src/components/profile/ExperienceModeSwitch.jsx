import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Heart, Mail, Loader2, AlertTriangle, Check } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

// "Switch experience" control — moves a user between Single and Couple mode.
// Switching INTO Couple reuses the existing linkPartner 'link' flow (partner email).
// Switching to Single clears partner-specific data via switchExperienceMode.
// Existing matches / connections / messages are never cleared.
export default function ExperienceModeSwitch({ userProfile, onUpdate }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [open, setOpen] = useState(null); // 'couple' | 'single' | null
  const [partnerEmail, setPartnerEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // success message

  const isCouple = userProfile?.profile_type === 'couple';
  const isPaired = userProfile?.paired_status === 'paired';

  const handleSwitchToCouple = async () => {
    if (!partnerEmail.trim() || !partnerEmail.includes('@')) {
      setEmailError(isFr ? 'Veuillez entrer un courriel valide.' : 'Please enter a valid email.');
      return;
    }
    setBusy(true);
    setEmailError('');
    setDone(null);
    try {
      const res = await base44.functions.invoke('linkPartner', {
        action: 'link',
        partner_email: partnerEmail.trim().toLowerCase(),
        from_display_name: userProfile?.display_name || userProfile?.full_name,
      });
      if (res.data?.success) {
        setDone(isFr
          ? 'Demande de liaison envoyée. Votre profil est maintenant en mode Couple.'
          : 'Link request sent. Your profile is now in Couple mode.');
        if (onUpdate) onUpdate();
      } else {
        setEmailError(res.data?.error || (isFr ? 'Une erreur est survenue.' : 'Something went wrong.'));
      }
    } catch (e) {
      setEmailError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSwitchToSingle = async () => {
    setBusy(true);
    setDone(null);
    try {
      const res = await base44.functions.invoke('switchExperienceMode', { mode: 'single' });
      if (res.data?.success) {
        setDone(isFr ? 'Passé en mode Célibataire.' : 'Switched to Single mode.');
        if (onUpdate) onUpdate();
      } else {
        setEmailError(res.data?.error || (isFr ? 'Une erreur est survenue.' : 'Something went wrong.'));
      }
    } catch (e) {
      setEmailError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setOpen(null); setPartnerEmail(''); setEmailError(''); setDone(null); };

  return (
    <>
      {/* Section row */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0">
          {isCouple
            ? <Heart className="w-5 h-5 text-[#7B2FBE]" />
            : <User className="w-5 h-5 text-[#7B2FBE]" />}
        </div>
        <div className="flex-1">
          <p className="text-[#F0E6FF] text-sm font-medium">
            {isFr ? 'Mode d\'expérience' : 'Experience Mode'}
          </p>
          <p className="text-[#F0E6FF]/40 text-xs">
            {isCouple
              ? (isPaired
                ? (isFr ? 'En couple (lié)' : 'Couple (linked)')
                : (isFr ? 'En couple (en attente de partenaire)' : 'Couple (waiting for partner)'))
              : (isFr ? 'Célibataire' : 'Single')}
          </p>
        </div>
        {isCouple ? (
          <button onClick={() => setOpen('single')}
            className="text-xs px-3 py-1.5 rounded-full glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF] transition-all">
            {isFr ? 'Passer à Célibataire' : 'Switch to Single'}
          </button>
        ) : (
          <button onClick={() => setOpen('couple')}
            className="text-xs px-3 py-1.5 rounded-full bg-[rgba(123,47,190,0.15)] text-[#7B2FBE] hover:bg-[rgba(123,47,190,0.25)] transition-all">
            {isFr ? 'Passer à Couple' : 'Switch to Couple'}
          </button>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]"
              onClick={close} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-[70] p-4 md:inset-0 md:flex md:items-center md:justify-center">
              <div className="glass-card-gold rounded-3xl rounded-b-none md:rounded-3xl p-6 max-w-sm mx-auto w-full space-y-4">
                {open === 'couple' && (
                  <>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-[#7B2FBE]" />
                      </div>
                      <h3 className="font-serif text-xl text-[#F0E6FF]">
                        {isFr ? 'Passer en mode Couple' : 'Switch to Couple Mode'}
                      </h3>
                      <p className="text-[#F0E6FF]/50 text-xs mt-1 leading-relaxed">
                        {isFr
                          ? 'Entrez le courriel de votre partenaire. S\'il a déjà un compte, il recevra une demande de liaison. Sinon, il recevra une invitation.'
                          : 'Enter your partner\'s email. If they have an account, they\'ll get a link request. Otherwise, they\'ll get an invite.'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[#F0E6FF]/60 text-sm mb-2">
                        {isFr ? 'Courriel de votre partenaire' : 'Your partner\'s email'} <span className="text-[#F5A800]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30 pointer-events-none" />
                        <input
                          type="email"
                          value={partnerEmail}
                          onChange={e => { setPartnerEmail(e.target.value); setEmailError(''); }}
                          className="w-full glass-card rounded-xl pl-10 pr-4 py-3 text-[#F0E6FF] text-sm outline-none bg-transparent"
                          placeholder="partner@example.com"
                        />
                      </div>
                      {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                    </div>
                    {done && (
                      <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" /> {done}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={close} className="flex-1 py-3 glass-card rounded-xl text-[#F0E6FF]/60 text-sm hover:opacity-80 transition-all">
                        {isFr ? 'Fermer' : 'Close'}
                      </button>
                      <button onClick={handleSwitchToCouple} disabled={busy}
                        className="flex-1 py-3 bg-[#7B2FBE] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFr ? 'Envoyer' : 'Send')}
                      </button>
                    </div>
                  </>
                )}

                {open === 'single' && (
                  <>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="font-serif text-xl text-[#F0E6FF]">
                        {isFr ? 'Passer en mode Célibataire' : 'Switch to Single Mode'}
                      </h3>
                      <p className="text-[#F0E6FF]/50 text-xs mt-2 leading-relaxed">
                        {isFr
                          ? 'Cela supprimera les données de liaison de votre partenaire. Vos correspondances et messages existants ne sont PAS supprimés. Si vous étiez lié, votre partenaire passera aussi en mode Célibataire.'
                          : 'This will remove your partner-link data. Your existing matches and messages are NOT deleted. If you were linked, your partner will also be switched to Single.'}
                      </p>
                    </div>
                    {done && (
                      <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" /> {done}
                      </div>
                    )}
                    {emailError && <p className="text-red-400 text-xs">{emailError}</p>}
                    <div className="flex gap-3">
                      <button onClick={close} className="flex-1 py-3 glass-card rounded-xl text-[#F0E6FF]/60 text-sm hover:opacity-80 transition-all">
                        {isFr ? 'Annuler' : 'Cancel'}
                      </button>
                      <button onClick={handleSwitchToSingle} disabled={busy}
                        className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFr ? 'Confirmer' : 'Confirm')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}