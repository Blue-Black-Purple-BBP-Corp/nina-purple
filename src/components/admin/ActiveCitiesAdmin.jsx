import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Admin panel for managing the ActiveCity list. Staff can add cities, toggle
// the is_actively_onboarding flag (informational — sets expectations), reorder,
// and delete. The flag never gates or restricts any user.
export default function ActiveCitiesAdmin() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCity, setNewCity] = useState({ city: '', region: '', country: '', display_order: 0 });

  const loadCities = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.ActiveCity.list('display_order', 500);
      setCities(list);
    } catch (e) {
      console.error('Failed to load cities:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCities(); }, [loadCities]);

  const toggleActive = async (city) => {
    setSaving(true);
    try {
      await base44.entities.ActiveCity.update(city.id, {
        is_actively_onboarding: !city.is_actively_onboarding,
      });
      setCities(prev => prev.map(c =>
        c.id === city.id ? { ...c, is_actively_onboarding: !c.is_actively_onboarding } : c
      ));
    } catch (e) {
      console.error('Toggle failed:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = async (city, newOrder) => {
    const order = Number(newOrder) || 0;
    try {
      await base44.entities.ActiveCity.update(city.id, { display_order: order });
      setCities(prev => prev.map(c =>
        c.id === city.id ? { ...c, display_order: order } : c
      ));
    } catch (e) {
      console.error('Order update failed:', e.message);
    }
  };

  const addCity = async () => {
    if (!newCity.city.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.ActiveCity.create({
        city: newCity.city.trim(),
        region: newCity.region.trim(),
        country: newCity.country.trim(),
        is_actively_onboarding: true,
        display_order: Number(newCity.display_order) || 0,
      });
      setCities(prev => [...prev, created].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setNewCity({ city: '', region: '', country: '', display_order: 0 });
    } catch (e) {
      console.error('Add city failed:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCity = async (city) => {
    if (!confirm(isFr ? `Supprimer ${city.city} ?` : `Delete ${city.city}?`)) return;
    setSaving(true);
    try {
      await base44.entities.ActiveCity.delete(city.id);
      setCities(prev => prev.filter(c => c.id !== city.id));
    } catch (e) {
      console.error('Delete failed:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] bg-transparent";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg text-[#F0E6FF]/80 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#F5A800]" />
            {isFr ? 'Villes actives' : 'Active Cities'}
          </h2>
          <p className="text-[#F0E6FF]/40 text-xs mt-0.5">
            {isFr
              ? "Le commutateur « onboarding actif » est informatif — il n\'empêche aucun utilisateur de s\'inscrire."
              : "The “actively onboarding” toggle is informational — it never blocks any user from signing up."}
          </p>
        </div>
        <button onClick={loadCities} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-lg text-[#F0E6FF]/60 text-xs hover:text-[#F5A800] transition-colors">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {isFr ? 'Rafraîchir' : 'Refresh'}
        </button>
      </div>

      {/* Add new city */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-[#F0E6FF]/50 text-xs font-semibold uppercase tracking-wide">
          {isFr ? 'Ajouter une ville' : 'Add a city'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input
            value={newCity.city}
            onChange={e => setNewCity(p => ({ ...p, city: e.target.value }))}
            placeholder={isFr ? 'Ville *' : 'City *'}
            className={inputClass}
          />
          <input
            value={newCity.region}
            onChange={e => setNewCity(p => ({ ...p, region: e.target.value }))}
            placeholder={isFr ? 'Région / Province' : 'Region / Province'}
            className={inputClass}
          />
          <input
            value={newCity.country}
            onChange={e => setNewCity(p => ({ ...p, country: e.target.value }))}
            placeholder={isFr ? 'Pays' : 'Country'}
            className={inputClass}
          />
          <input
            type="number"
            value={newCity.display_order}
            onChange={e => setNewCity(p => ({ ...p, display_order: e.target.value }))}
            placeholder={isFr ? 'Ordre' : 'Order'}
            className={inputClass}
          />
        </div>
        <button onClick={addCity} disabled={saving || !newCity.city.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#F5A800] text-[#0B0510] rounded-lg text-sm font-bold hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isFr ? 'Ajouter' : 'Add'}
        </button>
      </div>

      {/* City list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
      ) : cities.length === 0 ? (
        <p className="text-[#F0E6FF]/40 text-sm text-center py-8">
          {isFr ? 'Aucune ville configurée.' : 'No cities configured.'}
        </p>
      ) : (
        <div className="space-y-2">
          {cities.map(c => (
            <div key={c.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[#F0E6FF] text-sm font-medium truncate">
                  {[c.city, c.region, c.country].filter(Boolean).join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  value={c.display_order || 0}
                  onChange={e => updateOrder(c, e.target.value)}
                  className="w-16 glass-card rounded-lg px-2 py-1 text-[#F0E6FF] text-xs text-center outline-none bg-transparent"
                  title={isFr ? 'Ordre d\'affichage' : 'Display order'}
                />
                <button
                  onClick={() => toggleActive(c)}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    c.is_actively_onboarding
                      ? 'bg-[rgba(245,168,0,0.15)] text-[#F5A800] border border-[rgba(245,168,0,0.4)]'
                      : 'glass-card text-[#F0E6FF]/40 border border-[rgba(240,230,255,0.08)]'
                  }`}
                >
                  {c.is_actively_onboarding
                    ? (isFr ? 'Actively onboarding' : 'Active')
                    : (isFr ? 'Inactive' : 'Inactive')}
                </button>
                <button
                  onClick={() => deleteCity(c)}
                  disabled={saving}
                  className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}