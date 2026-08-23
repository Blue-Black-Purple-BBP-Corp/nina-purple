import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, UserPlus, CheckCircle, AlertCircle, Mail, User, MapPin, Phone, Calendar, Heart } from 'lucide-react';

export default function MigrationForm({ onCreated }) {
  const [form, setForm] = useState({
    email: '',
    display_name: '',
    full_name: '',
    city: '',
    birthdate: '',
    phone: '',
    language: 'en',
    profile_type: 'individual',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!form.email.trim() || !form.display_name.trim()) {
      setError('Email and display name are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('createMigratedProfile', form);
      setSuccess({
        email: form.email,
        alreadyExisted: res.data?.userAlreadyExisted,
      });
      setForm({
        email: '', display_name: '', full_name: '', city: '',
        birthdate: '', phone: '', language: 'en', profile_type: 'individual',
      });
      if (onCreated) onCreated();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Migration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full glass-card rounded-xl px-4 py-3 text-foreground text-sm outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl text-[#F0E6FF] mb-1">Migrate an Account</h2>
        <p className="text-[#F0E6FF]/50 text-sm leading-relaxed">
          Create a profile from an existing account. The user receives a confirmation email
          to set up their password and complete their profile on first login.
        </p>
      </div>

      {success && (
        <div className="glass-card rounded-2xl p-4 border-[rgba(34,197,94,0.3)] flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="text-[#F0E6FF] font-medium">
              Profile created for {success.email}
            </div>
            <div className="text-[#F0E6FF]/50 text-xs mt-1">
              {success.alreadyExisted
                ? 'A user account already existed for this email — profile linked to it.'
                : 'A new user account was invited. The user will receive a password setup email.'}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card rounded-2xl p-4 border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#F0E6FF]/60 text-sm mb-2">Email <span className="text-[#F5A800]">*</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30 pointer-events-none" />
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="member@example.com" className={`${inputClass} pl-10`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#F0E6FF]/60 text-sm mb-2">Display name <span className="text-[#F5A800]">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30 pointer-events-none" />
              <input type="text" required value={form.display_name} onChange={e => set('display_name', e.target.value)}
              placeholder="Jane Doe" className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className="block text-[#F0E6FF]/60 text-sm mb-2">Full legal name</label>
            <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
              placeholder="Jane Marie Doe" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#F0E6FF]/60 text-sm mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30 pointer-events-none" />
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Montréal" className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className="block text-[#F0E6FF]/60 text-sm mb-2">Birthdate</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30 pointer-events-none" />
              <input type="date" value={form.birthdate} onChange={e => set('birthdate', e.target.value)}
                className={`${inputClass} pl-10`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#F0E6FF]/60 text-sm mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30 pointer-events-none" />
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+1 514 555 0123" className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className="block text-[#F0E6FF]/60 text-sm mb-2">Language</label>
            <select value={form.language} onChange={e => set('language', e.target.value)}
              className="w-full glass-card rounded-xl px-4 py-3 text-foreground text-sm outline-none bg-card border border-border">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[#F0E6FF]/60 text-sm mb-2">Profile type</label>
          <div className="flex gap-3">
            {[
              { id: 'individual', label: 'Individual', icon: User, color: '#F5A800' },
              { id: 'couple', label: 'Couple', icon: Heart, color: '#7B2FBE' },
            ].map(opt => {
              const selected = form.profile_type === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => set('profile_type', opt.id)}
                  className="flex-1 rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-medium transition-all"
                  style={{
                    background: selected ? `${opt.color}18` : 'rgba(31,16,38,0.7)',
                    border: `1.5px solid ${selected ? opt.color : 'rgba(240,230,255,0.08)'}`,
                    color: selected ? opt.color : 'rgba(240,230,255,0.5)',
                  }}>
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={loading || !form.email || !form.display_name}
          className="w-full py-3.5 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,168,0,0.25)]">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Migrating…</> : <><UserPlus className="w-4 h-4" /> Migrate & Send Confirmation</>}
        </button>
      </form>
    </div>
  );
}