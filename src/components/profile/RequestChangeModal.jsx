import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Shield, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GoogleIcon from '@/components/GoogleIcon';
import AppleIcon from '@/components/AppleIcon';
import MicrosoftIcon from '@/components/MicrosoftIcon';

const SSO_METHODS = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
  { id: 'apple', label: 'Apple', Icon: AppleIcon },
];

const FIELD_LABELS = {
  email: { en: 'Email', fr: 'Courriel', type: 'email', placeholder: 'you@example.com' },
  full_name: { en: 'Name', fr: 'Nom', type: 'text', placeholder: '' },
  phone: { en: 'Phone number', fr: 'Téléphone', type: 'tel', placeholder: '+1 514 555 0123' },
  birthdate: { en: 'Birthdate', fr: 'Date de naissance', type: 'date', placeholder: '' },
};

// Member-facing modal to request a change to a critical profile field
// (email/full_name/phone/birthdate). Requires fresh step-up authentication:
// password (server-verified) or SSO (platform-mediated redirect, resumed in
// AppLayout after the provider redirect-back).
export default function RequestChangeModal({ isOpen, field, currentValue, lang, onClose, onSubmitted }) {
  const [newValue, setNewValue] = useState('');
  const [authMethods, setAuthMethods] = useState([]);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const isFr = lang === 'fr';

  useEffect(() => {
    if (!isOpen) return;
    setNewValue('');
    setPassword('');
    setError('');
    setDone(false);
    (async () => {
      try {
        const u = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: u.id });
        setAuthMethods(Array.isArray(profiles[0]?.auth_methods) ? profiles[0].auth_methods : []);
      } catch { setAuthMethods([]); }
    })();
  }, [isOpen, field]);

  if (!isOpen) return null;

  const fl = FIELD_LABELS[field] || FIELD_LABELS.full_name;
  const recorded = authMethods.length > 0;
  const methods = recorded ? authMethods : ['password', 'google', 'microsoft', 'apple'];
  const hasPassword = methods.includes('password');
  const ssoOptions = SSO_METHODS.filter(m => methods.includes(m.id));

  const submitPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newValue.trim()) { setError(isFr ? 'Veuillez entrer une nouvelle valeur.' : 'Please enter a new value.'); return; }
    if (!password.trim()) { setError(isFr ? 'Veuillez entrer votre mot de passe.' : 'Please enter your password.'); return; }
    setSubmitting(true);
    try {
      await base44.functions.invoke('requestProfileChange', {
        field_name: field, requested_value: newValue.trim(), auth_method: 'password', reauth_password: password,
      });
      setDone(true);
      setTimeout(() => { onSubmitted?.(); }, 1200);
    } catch (err) {
      setError(err.message || (isFr ? 'Échec de la demande.' : 'Request failed.'));
    } finally { setSubmitting(false); }
  };

  const startSSO = (provider) => {
    setError('');
    if (!newValue.trim()) { setError(isFr ? 'Veuillez entrer une nouvelle valeur.' : 'Please enter a new value.'); return; }
    setRedirecting(true);
    sessionStorage.setItem('pending_profile_change', JSON.stringify({ field_name: field, requested_value: newValue.trim(), auth_method: provider }));
    base44.auth.loginWithProvider(provider, window.location.pathname);
    setTimeout(() => setRedirecting(false), 4000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-4 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F5A800]" />
              <h2 className="font-serif text-xl text-[#F0E6FF]">
                {isFr ? `Changer — ${fl.fr}` : `Change — ${fl.en}`}
              </h2>
            </div>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          {done ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6 text-[#F5A800]" />
              </div>
              <p className="text-[#F0E6FF] font-serif text-lg">{isFr ? 'Demande envoyée' : 'Request submitted'}</p>
              <p className="text-[#F0E6FF]/50 text-sm">
                {field === 'phone'
                  ? (isFr ? 'Votre demande est enregistrée. La vérification par SMS sera disponible prochainement.' : 'Your request is recorded. SMS verification will be available soon.')
                  : (isFr ? 'Votre demande sera examinée par notre équipe.' : 'Your request will be reviewed by our team.')}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[#F0E6FF]/50 text-xs uppercase tracking-wide mb-1.5">
                  {isFr ? 'Valeur actuelle' : 'Current value'}
                </label>
                <div className="glass-card rounded-xl px-4 py-3 text-[#F0E6FF]/60 text-sm truncate">{currentValue || (isFr ? 'Non défini' : 'Not set')}</div>
              </div>
              <div>
                <label className="block text-[#F0E6FF]/50 text-xs uppercase tracking-wide mb-1.5">
                  {isFr ? 'Nouvelle valeur' : 'New value'}
                </label>
                <input
                  type={fl.type}
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  placeholder={fl.placeholder}
                  autoFocus
                  className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)]"
                />
              </div>

              <div className="flex items-start gap-2 text-[#F0E6FF]/40 text-xs glass-card rounded-xl p-3">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#F5A800]" />
                <span>{isFr ? 'Pour votre sécurité, confirmez votre identité pour soumettre cette demande.' : 'For your security, confirm your identity to submit this request.'}</span>
              </div>

              {hasPassword && (
                <form onSubmit={submitPassword} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#F0E6FF]/40 mb-1">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full glass-card rounded-xl px-4 py-2.5 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)]"
                      placeholder="••••••••" />
                  </div>
                  {error && <div className="flex items-start gap-2 text-red-400 text-xs"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
                  <button type="submit" disabled={submitting}
                    className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Envoi…' : 'Submitting…'}</> : <>{isFr ? 'Soumettre la demande' : 'Submit request'}</>}
                  </button>
                </form>
              )}

              {ssoOptions.length > 0 && (
                <div>
                  {hasPassword && <div className="text-center text-[10px] uppercase text-[#F0E6FF]/30 my-2">or</div>}
                  <div className="space-y-2">
                    {ssoOptions.map(({ id, label, Icon }) => (
                      <button key={id} type="button" disabled={redirecting || submitting} onClick={() => startSSO(id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 glass-card rounded-xl text-[#F0E6FF] text-sm font-medium hover:border-[rgba(245,168,0,0.3)] transition-all disabled:opacity-50">
                        {redirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                        {isFr ? 'Continuer avec' : 'Continue with'} {label}
                      </button>
                    ))}
                  </div>
                  {error && !hasPassword && <div className="flex items-start gap-2 text-red-400 text-xs mt-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
                </div>
              )}

              <p className="text-[#F0E6FF]/30 text-xs text-center">
                {field === 'email'
                  ? (isFr ? 'Le courriel est mis à jour par notre équipe de support après vérification.' : 'Email is updated by our support team after review.')
                  : field === 'phone'
                  ? (isFr ? 'La vérification par SMS sera requise (bientôt disponible).' : 'SMS verification will be required (coming soon).')
                  : (isFr ? 'Les changements sont examinés par notre équipe.' : 'Changes are reviewed by our team.')}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}