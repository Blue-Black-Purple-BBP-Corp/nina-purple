import React, { useState } from 'react';
import { Shield, Loader2, X, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useStaffSession } from '@/lib/StaffSessionContext';
import { CONTEXT_LABELS } from './PrivilegedModeBanner';
import GoogleIcon from '@/components/GoogleIcon';
import AppleIcon from '@/components/AppleIcon';
import MicrosoftIcon from '@/components/MicrosoftIcon';

const SSO_METHODS = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
  { id: 'apple', label: 'Apple', Icon: AppleIcon },
];

// Auth-method-aware step-up modal for privileged-mode activation.
//
// Shows only the sign-in methods the member has actually used (from their
// self-declared auth_methods): password re-entry for password accounts, a
// "Continue with [Provider]" button for SSO accounts, and a choice when both.
// A local password field is never shown to a member whose recorded methods do
// not include "password". If no method is recorded yet (e.g. the account signed
// in before this feature shipped), it falls back to offering all methods with a
// note — the platform does not expose linked identities, so we cannot be
// selective until the member signs in once after this feature ships.
//
// SSO step-up is platform-mediated (loginWithProvider redirect). The app does
// not validate the provider token; assurance is recorded as
// "platform_sso_reauth" server-side.
export default function ReauthModal({ context, onClose, onSuccess }) {
  const { user } = useAuth();
  const { activate, activating, authMethods, activateSSO } = useStaffSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const label = CONTEXT_LABELS[context] || context;
  const recorded = Array.isArray(authMethods) && authMethods.length > 0;
  const methods = recorded ? authMethods : ['password', 'google', 'microsoft', 'apple'];
  const hasPassword = methods.includes('password');
  const ssoOptions = SSO_METHODS.filter((m) => methods.includes(m.id));

  const submitPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) { setError('Please enter your password.'); return; }
    const res = await activate(context, password);
    if (res.success) {
      onSuccess(res.session);
    } else {
      setError(res.error || 'Re-authentication failed.');
    }
  };

  const startSSO = (provider) => {
    setError('');
    setRedirecting(true);
    activateSSO(context, provider);
    // loginWithProvider redirects away. If it returns without redirecting
    // (e.g. popup blocked), surface a neutral error.
    setTimeout(() => setRedirecting(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0510]/80 backdrop-blur-sm px-4">
      <div className="glass-card-gold rounded-3xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F5A800]" />
            <h3 className="font-serif text-lg text-[#F0E6FF]">Activate {label} mode</h3>
          </div>
          <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[#F0E6FF]/50 text-sm mb-4">
          For your security, confirm your identity. Administrative actions in this workspace are logged.
        </p>

        <div className="mb-4 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-[#F0E6FF]/40">Signed in as</div>
          <div className="text-[#F0E6FF]/70 text-sm">{user?.email}</div>
        </div>

        {!recorded && (
          <div className="flex items-start gap-2 text-[#F0E6FF]/40 text-xs mb-4 glass-card rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>We could not detect your sign-in method. Choose the method you normally use to sign in.</span>
          </div>
        )}

        {hasPassword && (
          <form onSubmit={submitPassword} className="space-y-3 mb-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#F0E6FF]/40 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full glass-card rounded-xl px-4 py-2.5 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)]"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={activating}
              className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {activating ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</> : <><KeyRound className="w-4 h-4" /> Enter {label} workspace</>}
            </button>
          </form>
        )}

        {ssoOptions.length > 0 && (
          <div>
            {hasPassword && (
              <div className="text-center text-[10px] uppercase text-[#F0E6FF]/30 my-3">or</div>
            )}
            <div className="space-y-2">
              {ssoOptions.map(({ id, label: pLabel, Icon }) => (
                <button
                  key={id}
                  type="button"
                  disabled={redirecting}
                  onClick={() => startSSO(id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 glass-card rounded-xl text-[#F0E6FF] text-sm font-medium hover:border-[rgba(245,168,0,0.3)] transition-all disabled:opacity-50"
                >
                  {redirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  Continue with {pLabel}
                </button>
              ))}
            </div>
            {error && !hasPassword && (
              <div className="flex items-start gap-2 text-red-400 text-xs mt-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 text-[#F0E6FF]/40 hover:text-[#F0E6FF]/70 text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}