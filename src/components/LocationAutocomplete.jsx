import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Singleton promise so the Maps script loads once across all instances
let mapsScriptPromise = null;

function loadGoogleMapsScript(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsScriptPromise) return mapsScriptPromise;
  mapsScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => { mapsScriptPromise = null; reject(new Error('Failed to load Google Maps')); };
    document.head.appendChild(script);
  });
  return mapsScriptPromise;
}

export default function LocationAutocomplete({ value, onChange, placeholder = 'Search city...', className = '' }) {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch API key + load Google Maps JS API on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getPublicConfig', {});
        const key = res.data?.googleMapsApiKey;
        if (!key) { console.error('[LocationAutocomplete] No Google Maps key returned'); return; }
        await loadGoogleMapsScript(key);
        if (active) setReady(true);
      } catch (err) {
        console.error('[LocationAutocomplete] Failed to load Google Maps:', err.message);
      }
    })();
    return () => { active = false; };
  }, []);

  // Sync external value changes
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // keep raw text in sync

    clearTimeout(debounceRef.current);
    if (val.length < 2) { setPredictions([]); setOpen(false); return; }
    if (!ready || !window.google?.maps?.places) return;

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: val, types: ['(cities)'] },
          (results, status) => {
            setLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results.map(p => ({
                place_id: p.place_id,
                description: p.description,
              })));
              setOpen(true);
            } else {
              setPredictions([]);
            }
          }
        );
      } catch {
        setLoading(false);
        setPredictions([]);
      }
    }, 300);
  };

  const select = (pred) => {
    setQuery(pred.description);
    onChange(pred.description);
    setPredictions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full glass-card rounded-xl pl-10 pr-10 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5A800] animate-spin" />
        )}
      </div>

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden border border-[rgba(245,168,0,0.2)] bg-card shadow-xl">
          {predictions.map((p) => (
            <li key={p.place_id}>
              <button
                onMouseDown={() => select(p)}
                className="w-full text-left px-4 py-3 text-sm text-foreground/80 hover:bg-[rgba(245,168,0,0.08)] hover:text-[#F5A800] transition-colors flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-foreground/30" />
                {p.description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}