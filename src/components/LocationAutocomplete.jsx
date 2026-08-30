import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

export default function LocationAutocomplete({
  value,
  onChange,
  onValidityChange,
  placeholder = 'Search city...',
  className = '',
}) {
  const { lang } = useLang();
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

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
      setLoading(true);
      try {
        const res = await base44.functions.invoke('placesAutocomplete', { input: val });
        const data = res?.data || res;
        if (data?.predictions?.length > 0) {
          setPredictions(data.predictions);
          setOpen(true);
          setApiError(false);
        } else {
          // API returned no predictions or an error — switch to manual mode
          setPredictions([]);
          setOpen(false);
          setApiError(true);
          // In manual mode, accept text with 2+ chars as valid
          if (val.length >= 2) {
            onValidityChange?.(true, { displayName: val, city: val, country: '' });
          }
        }
      } catch (err) {
        setPredictions([]);
        setOpen(false);
        setApiError(true);
        // Manual fallback — accept typed text as valid
        if (val.length >= 2) {
          onValidityChange?.(true, { displayName: val, city: val, country: '' });
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Parse a Google Places description like "Montreal, QC, Canada" into city + country
  const parseDescription = (description) => {
    const parts = description.split(',').map(p => p.trim()).filter(Boolean);
    const city = parts[0] || description;
    const country = parts.length > 1 ? parts[parts.length - 1] : '';
    return { city, country };
  };

  const select = (pred) => {
    const desc = pred.description || pred;
    setQuery(desc);
    onChange(desc);
    setPredictions([]);
    setOpen(false);
    const { city, country } = parseDescription(desc);
    onValidityChange?.(true, { displayName: desc, city, country });
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
        <p className="text-foreground/40 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {lang === 'fr'
            ? "Saisissez votre ville manuellement pour continuer."
            : "Type your city manually to continue."}
        </p>
      )}

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden border border-[rgba(245,168,0,0.2)] bg-card shadow-xl max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <li key={p.place_id || p.description}>
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