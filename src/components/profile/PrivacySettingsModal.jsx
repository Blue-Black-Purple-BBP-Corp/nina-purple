import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PrivacySettingsModal({ isOpen, onClose, userProfile, onUpdate, lang }) {
  const [photosPrivate, setPhotosPrivate] = useState(userProfile?.photos_private ?? true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.UserProfile.update(userProfile.id, { photos_private: photosPrivate });
    onUpdate({ ...userProfile, photos_private: photosPrivate });
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

          <div className="glass-card rounded-2xl px-4">
            <Toggle
              value={photosPrivate}
              onChange={setPhotosPrivate}
              label={lang === 'fr' ? 'Photos privées' : 'Private Photos'}
              desc={lang === 'fr' ? 'Vos photos sont cachées jusqu\'à déverrouillage du profil' : 'Your photos are hidden until a profile is unlocked'}
            />
          </div>

          <div className="glass-card rounded-2xl px-4 py-4 space-y-2">
            <p className="text-[#F0E6FF]/50 text-xs uppercase tracking-wider">{lang === 'fr' ? 'Toujours actif' : 'Always On'}</p>
            {[
              {
                label: lang === 'fr' ? 'Profil basé sur la compatibilité' : 'Compatibility-based profile',
                desc: lang === 'fr' ? 'Votre profil est visible selon votre score' : 'Your profile is shown based on match scores'
              },
              {
                label: lang === 'fr' ? 'Protection des données' : 'Data protection',
                desc: lang === 'fr' ? 'Vos données ne sont jamais vendues' : 'Your data is never sold or shared for ads'
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