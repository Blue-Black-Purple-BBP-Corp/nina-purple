import React, { useState } from 'react';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ManagePhotosModal({ isOpen, onClose, userProfile, onUpdate, lang }) {
  const [photos, setPhotos] = useState(userProfile?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const next = [...photos, file_url];
    setPhotos(next);
    setUploading(false);
    e.target.value = '';
  };

  const handleRemove = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    const newCompleteness = calcCompleteness(photos.length);
    await base44.entities.UserProfile.update(userProfile.id, { photos, profile_completeness: newCompleteness });
    onUpdate({ ...userProfile, photos, profile_completeness: newCompleteness });
    setSaving(false);
    onClose();
  };

  const calcCompleteness = (photoCount) => {
    let score = 0;
    if (userProfile?.display_name) score += 10;
    if (userProfile?.city) score += 10;
    if (userProfile?.birthdate) score += 10;
    if (userProfile?.sexual_orientation) score += 10;
    if (userProfile?.gender_pronoun) score += 10;
    if (userProfile?.relationship_status) score += 10;
    if (userProfile?.dating_archetype) score += 10;
    if (photoCount >= 1) score += 5;
    if (photoCount >= 3) score += 5;
    if (photoCount >= 6) score += 5;
    score += 15;
    return score;
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Gérer mes photos' : 'Manage Photos'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute inset-0 bg-[#0B0510]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 bg-[#F5A800] text-[#0B0510] rounded font-bold">
                    {lang === 'fr' ? 'Principale' : 'Main'}
                  </span>
                )}
              </div>
            ))}

            {photos.length < 6 && (
              <label className="aspect-square rounded-2xl glass-card border-dashed flex items-center justify-center cursor-pointer hover:border-[rgba(245,168,0,0.3)] transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {uploading ? <Loader2 className="w-5 h-5 text-[#F5A800] animate-spin" /> : <Upload className="w-5 h-5 text-[#F0E6FF]/30" />}
              </label>
            )}
          </div>

          <p className="text-[#F0E6FF]/30 text-xs text-center">
            {lang === 'fr' ? 'La première photo est votre photo principale.' : 'The first photo is your main profile photo.'}
          </p>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'fr' ? 'Enregistrer' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}