import React, { useState } from 'react';
import { Shield, Loader2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useStaffSession } from '@/lib/StaffSessionContext';
import { CONTEXT_LABELS } from './PrivilegedModeBanner';

// Re-authentication modal. Privileged mode activation requires the user to
// re-enter their password, which is verified server-side before a
// PrivilegedSession is created.
export default function ReauthModal({ context, onClose, onSuccess }) {
  const { user } = useAuth();
  const { activate, activating } = useStaffSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
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

  const label = CONTEXT_LABELS[context] || context;

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
          For your security, re-enter your password to confirm it's you. Administrative actions in this workspace are logged.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#F0E6FF]/40 mb-1">Account</label>
            <div className="text-[#F0E6FF]/70 text-sm">{user?.email}</div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#F0E6FF]/40 mb-1">Password *</label>
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
            {activating ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</> : `Enter ${label} workspace`}
          </button>
        </form>
      </div>
    </div>
  );
}