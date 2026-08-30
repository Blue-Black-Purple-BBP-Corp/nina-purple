import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Loader2, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { usePhotoAccess } from '@/hooks/usePhotoAccess';

// Owner photo management. All uploads go to private storage (UploadPrivateFile
// + uploadPhoto); removal/reorder go through managePhotos. The owner views
// their own photos via getPhotoAccess (owner_access) signed URLs. No public
// URLs are created or stored. Maximum 6 photos.
export default function ManagePhotosModal({ isOpen, onClose, userProfile, onUpdate, lang }) {
  const ownerId = userProfile?.user_id;
  const { photoData, loading, refresh } = usePhotoAccess(ownerId ? [ownerId] : [], isOpen ? ownerId : '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isOpen) { setError(''); refresh(); } }, [isOpen]);

  if (!isOpen) return null;

  const photos = (photoData[ownerId]?.photos || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (photos.length >= 6) { setError(lang === 'fr' ? 'Maximum 6 photos.' : 'Maximum 6 photos.'); return; }
    setUploading(true);
    setError('');
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.functions.invoke('uploadPhoto', { file_uri });
      refresh();
    } catch (err) {
      setError(err?.message || (lang === 'fr' ? 'Échec du téléversement.' : 'Upload failed.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (photo_id) => {
    setSaving(true);
    try {
      await base44.functions.invoke('managePhotos', { action: 'remove', photo_id });
      refresh();
    } catch (err) {
      setError(err?.message || (lang === 'fr' ? 'Échec de la suppression.' : 'Remove failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (photo_id, direction) => {
    const orderedIds = photos.map((p) => p.photo_id);
    const idx = orderedIds.indexOf(photo_id);
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= orderedIds.length) return;
    [orderedIds[idx], orderedIds[swapWith]] = [orderedIds[swapWith], orderedIds[idx]];
    setSaving(true);
    try {
      await base44.functions.invoke('managePhotos', { action: 'reorder', photo_ids: orderedIds });
      refresh();
    } catch (err) {
      setError(err?.message || (lang === 'fr' ? 'Échec du réordonnancement.' : 'Reorder failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Gérer mes photos' : 'Manage Photos'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A800] rounded"><X className="w-5 h-5" /></button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={photo.photo_id} className="relative aspect-square rounded-2xl overflow-hidden group">
                  {photo.signed_url
                    ? <img src={photo.signed_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-[rgba(240,230,255,0.05)] flex items-center justify-center"><Loader2 className="w-4 h-4 text-[#F0E6FF]/30 animate-spin" /></div>
                  }
                  {photo.is_primary && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 bg-[#F5A800] text-[#0B0510] rounded font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> {lang === 'fr' ? 'Principale' : 'Main'}
                    </span>
                  )}
                  {/* Reorder controls */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleReorder(photo.photo_id, 'up')} disabled={i === 0 || saving}
                      className="w-6 h-6 rounded-full bg-[rgba(11,5,16,0.8)] border border-[rgba(240,230,255,0.2)] flex items-center justify-center hover:bg-[#7B2FBE] transition-all disabled:opacity-30">
                      <ArrowUp className="w-3 h-3 text-[#F0E6FF]" />
                    </button>
                    <button onClick={() => handleReorder(photo.photo_id, 'down')} disabled={i === photos.length - 1 || saving}
                      className="w-6 h-6 rounded-full bg-[rgba(11,5,16,0.8)] border border-[rgba(240,230,255,0.2)] flex items-center justify-center hover:bg-[#7B2FBE] transition-all disabled:opacity-30">
                      <ArrowDown className="w-3 h-3 text-[#F0E6FF]" />
                    </button>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(photo.photo_id)}
                    disabled={saving}
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-[rgba(11,5,16,0.8)] border border-[rgba(240,230,255,0.2)] flex items-center justify-center hover:bg-red-500/80 transition-all disabled:opacity-50">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}

              {photos.length < 6 && (
                <label className="aspect-square rounded-2xl glass-card border-dashed flex items-center justify-center cursor-pointer hover:border-[rgba(245,168,0,0.3)] transition-all focus-within:border-[rgba(245,168,0,0.3)]">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  {uploading ? <Loader2 className="w-5 h-5 text-[#F5A800] animate-spin" /> : <Upload className="w-5 h-5 text-[#F0E6FF]/30" />}
                </label>
              )}
            </div>
          )}

          <p className="text-[#F0E6FF]/30 text-xs text-center">
            {lang === 'fr'
              ? 'La première photo est votre photo principale. Vos photos sont privées — visibles uniquement par vous et les membres qui déverrouillent votre profil.'
              : 'The first photo is your main profile photo. Your photos are private — visible only to you and members who unlock your profile.'}
          </p>

          <button onClick={onClose}
            className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
            {lang === 'fr' ? 'Terminé' : 'Done'}
          </button>
        </div>
      </div>
    </>
  );
}