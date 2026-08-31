import React, { useState } from 'react';
import { X, Loader2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PrivacySettingsModal({ isOpen, onClose, userProfile, onUpdate, lang }) {
  const [showInListings, setShowInListings] = useState(userProfile?.show_in_listings ?? true);
  const [allowMessages, setAllowMessages] = useState(userProfile?.allow_messages_all ?? true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await base44.functions.invoke('updateProfile', {
      show_in_listings: showInListings,
      allow_messages_all: allowMessages,
    });
    onUpdate({ ...userProfile, show_in_listings: showInListings, allow_messages_all: allowMessages });
    setSaving(false);
    onClose();
  };

  const Toggle = ({ value, onChange, label, desc }) => (
    <div className="flex items-center justify-between py-4 border-b border-[rgba(240,230,255,0.06)] last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-[#F0E6FF] text-sm font-medium">{label}</p>
        <p className="text-[#F0E6FF]/40 text-xs mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-all duration-300 shrink-0"
        style={{ background: value ? '#7B2FBE' : 'rgba(240,230,255,0.1)' }}>
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
          style={{ left: value ? '26px' : '4px' }} />
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Confidentialité' : 'Privacy Settings'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          <div className="glass-card rounded-2xl px-4 py-3 mb-3">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" />
              <p className="text-[#F0E6FF]/60 text-xs leading-relaxed">
                {lang === 'fr'
                  ? "Vos photos restent privées par défaut. Les autres membres peuvent demander l\u2019accès, mais vous devez approuver chaque demande avant que vos photos leur soient montrées."
                  : 'Your photos remain private by default. Other members can request access, but you must approve each request before your photos are shown to them.'}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl px-4">
            <Toggle
              value={showInListings}
              onChange={setShowInListings}
              label={lang === 'fr' ? 'Apparaître dans les connexions' : 'Show in Connections'}
              desc={lang === 'fr' ? 'Votre profil peut être découvert par d\'autres membres' : 'Your profile can be discovered by other members'}
            />
            <Toggle
              value={allowMessages}
              onChange={setAllowMessages}
              label={lang === 'fr' ? 'Messages ouverts' : 'Open Messages'}
              desc={lang === 'fr' ? 'Permettre aux membres non-connectés de vous envoyer des messages' : 'Allow non-connected members to send you messages'}
            />
          </div>

          <div className="glass-card rounded-2xl px-4 py-4 space-y-2">
            <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider">{lang === 'fr' ? 'Garanties' : 'Guarantees'}</p>
            {[
              {
                label: lang === 'fr' ? 'Profil basé sur la compatibilité' : 'Compatibility-based matching',
                desc: lang === 'fr' ? 'Votre profil est visible selon votre score de compatibilité' : 'Your profile visibility depends on compatibility scores'
              },
              {
                label: lang === 'fr' ? 'Protection des données' : 'Data protection',
                desc: lang === 'fr' ? 'Vos données ne sont jamais vendues ni partagées pour la publicité' : 'Your data is never sold or shared for advertising'
              },
              {
                label: lang === 'fr' ? 'Aucun tracking tiers' : 'No third-party tracking',
                desc: lang === 'fr' ? 'Nous ne suivons pas votre activité en dehors de la plateforme' : 'We do not track your activity outside the platform'
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-[#7B2FBE] mt-1.5 shrink-0" />
                <div>
                  <p className="text-[#F0E6FF]/70 text-sm">{item.label}</p>
                  <p className="text-[#F0E6FF]/30 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'fr' ? 'Enregistrer' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}