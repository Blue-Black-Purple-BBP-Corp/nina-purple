import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Singleton promise for Google Maps JS API script loading
let gmapsPromise = null;

async function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) return window.google.maps;
  if (gmapsPromise) return gmapsPromise;

  gmapsPromise = new Promise((resolve, reject) => {
    const cb = '__gmaps_cb_' + Date.now();
    window[cb] = () => { delete window[cb]; resolve(window.google.maps); };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${cb}`;
    script.onerror = () => { delete window[cb]; reject(new Error('Failed to load Google Maps')); };
    document.head.appendChild(script);
  });
  return gmapsPromise;
}

function getAddressComponent(components, type, field = 'long_name') {
  if (!components) return null;
  const c = components.find(comp => comp.types.includes(type));
  return c ? c[field] : null;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onValidityChange,
  placeholder = 'Search city...',
  className = '',
}) {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const placesRef = useRef(null);

  // Load Google Maps API on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getPublicConfig', {});
        const apiKey = res.data?.googleMapsApiKey;
        if (!apiKey) { setApiError(true); return; }
        const gmaps = await loadGoogleMaps(apiKey);
        autocompleteRef.current = new gmaps.places.AutocompleteService();
        // PlacesService requires a map or a div; a detached div works for getDetails
        placesRef.current = new gmaps.places.PlacesService(document.createElement('div'));
      } catch (e) {
        console.error('Google Maps load failed:', e);
        setApiError(true);
      }
    })();
  }, []);

  // Sync external value changes
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    // Typing invalidates any previous selection
    onValidityChange?.(false);

    clearTimeout(debounceRef.current);
    if (val.length < 2) { setPredictions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      if (!autocompleteRef.current) return;
      setLoading(true);
      try {
        // Race against a timeout — Google Maps API can hang silently on
        // ApiNotActivatedMapError without ever resolving or rejecting.
        const results = await Promise.race([
          autocompleteRef.current.getPlacePredictions({
            input: val,
            types: ['(cities)'],
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          ),
        ]);
        setPredictions(results.predictions || []);
        setOpen(true);
        setApiError(false);
      } catch (err) {
        console.error('Autocomplete error:', err);
        setPredictions([]);
        setOpen(false);
        setApiError(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const select = (pred) => {
    setQuery(pred.description);
    onChange(pred.description);
    setPredictions([]);
    setOpen(false);

    // Fetch structured data (city, region, country, lat/lng) via PlacesService
    if (placesRef.current) {
      placesRef.current.getDetails(
        { placeId: pred.place_id, fields: ['address_components', 'geometry'] },
        (place, status) => {
          if (status === 'OK' && place) {
            const data = {
              displayName: pred.description,
              city: getAddressComponent(place.address_components, 'locality') ||
                    getAddressComponent(place.address_components, 'administrative_area_level_3'),
              region: getAddressComponent(place.address_components, 'administrative_area_level_1'),
              country: getAddressComponent(place.address_components, 'country'),
              countryCode: getAddressComponent(place.address_components, 'country', 'short_name'),
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng(),
            };
            onValidityChange?.(true, data);
          } else {
            onValidityChange?.(true, { displayName: pred.description });
          }
        }
      );
    } else {
      onValidityChange?.(true, { displayName: pred.description });
    }
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

      {apiError && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Location service unavailable. Please try again later.
        </p>
      )}

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden border border-[rgba(245,168,0,0.2)] bg-card shadow-xl max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <li key={p.place_id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); select(p); }}
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