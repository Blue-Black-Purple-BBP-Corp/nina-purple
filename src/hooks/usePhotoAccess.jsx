import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Fetches short-lived signed photo URLs for a set of owner user IDs via the
// getPhotoAccess backend function. Authorization (owner self, active
// entitlement, or staff privileged mode) is enforced server-side. Returns
// a map of owner_id → { access_result, photos: [{ photo_id, signed_url,
// is_primary, sort_order }], source_type? }.
//
// deps: a stable string key (e.g. JSON.stringify(ownerIds)) so the effect
// re-runs only when the set actually changes.
export function usePhotoAccess(ownerIds, deps) {
  const [photoData, setPhotoData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    const ids = (ownerIds || []).filter(Boolean);
    if (!ids.length) { setPhotoData({}); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getPhotoAccess', { owner_user_ids: ids });
      const results = res.data?.results || res.results || {};
      setPhotoData(results);
    } catch (e) {
      console.warn('usePhotoAccess failed:', e.message);
      setPhotoData({});
    } finally {
      setLoading(false);
    }
  }, [deps]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  return { photoData, loading, refresh: fetchPhotos };
}

// Helper: returns the primary (or first) signed URL for an owner, or null.
export function primaryPhotoUrl(photoData, ownerId) {
  const entry = photoData[ownerId];
  if (!entry || !entry.photos?.length) return null;
  return entry.photos.find((p) => p.is_primary)?.signed_url || entry.photos[0].signed_url || null;
}

// Helper: returns all signed URLs for an owner (entitled viewers), or [].
export function allPhotoUrls(photoData, ownerId) {
  const entry = photoData[ownerId];
  if (!entry || !Array.isArray(entry.photos)) return [];
  return entry.photos
    .filter((p) => p.signed_url)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((p) => p.signed_url);
}