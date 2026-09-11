import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

// Client-side autocomplete over the bundled SimpleMaps World Cities dataset
// (population ≥ 1,000, CC BY 4.0 — see Terms). Free-text entry is always
// allowed; onValidityChange is always called with true — location never
// blocks submission. When showNotActiveMessage is true and the selected
// city does not match an ActiveCity with is_actively_onboarding: true,
// a reassuring "founding voice" message is shown inline.
export default function LocationAutocomplete({
  value,
  onChange,
  onValidityChange,
  placeholder = 'Search city...',
  className = '',
  showNotActiveMessage = false,
}) {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [query, setQuery] = useState(value || '');
  const [worldCities, setWorldCities] = useState(null); // null = not yet loaded
  const [activeCities, setActiveCities] = useState([]);
  const [open, setOpen] = useState(false);
  const [notActiveMessage, setNotActiveMessage] = useState('');
  const containerRef = useRef(null);

  // Lazy-load the world cities dataset (~4MB JSON, loaded on demand)
  useEffect(() => {
    import('@/lib/worldCities.json').then(mod => setWorldCities(mod.default || mod));
  }, []);

  // Fetch active cities to check "not yet active" status
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getActiveCities', {});
        const data = res?.data || res;
        setActiveCities(data?.cities || []);
      } catch {
        setActiveCities([]);
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

  const checkActiveStatus = (cityName) => {
    if (!cityName || !showNotActiveMessage) { setNotActiveMessage(''); return; }
    const isActive = activeCities.some(c =>
      c.city?.toLowerCase() === cityName.toLowerCase()
    );
    if (isActive) {
      setNotActiveMessage('');
    } else {
      const template = t('onboarding.not_active_yet');
      const ph = lang === 'fr' ? '{ville}' : '{city}';
      setNotActiveMessage(template.split(ph).join(cityName));
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    onValidityChange?.(true, { city: val, country: '' });
    setOpen(val.length >= 1);
    checkActiveStatus(val);
  };

  const filtered = worldCities && query.length >= 1
    ? worldCities.filter(c => {
        const q = query.toLowerCase();
        return c.city?.toLowerCase().includes(q) ||
               c.region?.toLowerCase().includes(q) ||
               c.country?.toLowerCase().includes(q);
      }).slice(0, 50) // cap for dropdown performance
    : [];

  const select = (city) => {
    const display = [city.city, city.region, city.country].filter(Boolean).join(', ');
    setQuery(display);
    onChange(city.city);
    setOpen(false);
    onValidityChange?.(true, { city: city.city, country: city.country || '' });
    checkActiveStatus(city.city);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full glass-card rounded-xl pl-10 pr-10 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
        />
        {worldCities === null && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5A800] animate-spin" />
        )}
      </div>

      {open && worldCities && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden border border-[rgba(245,168,0,0.2)] bg-card shadow-xl max-h-60 overflow-y-auto">
          {filtered.map((c, i) => {
            const display = [c.city, c.region, c.country].filter(Boolean).join(', ');
            return (
              <li key={i}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); select(c); }}
                  className="w-full text-left px-4 py-3 text-sm text-foreground/80 hover:bg-[rgba(245,168,0,0.08)] hover:text-[#F5A800] transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-foreground/30" />
                  {display}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {notActiveMessage && (
        <div className="mt-3 p-4 rounded-xl bg-[rgba(123,47,190,0.08)] border border-[rgba(123,47,190,0.25)] flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" />
          <p className="text-foreground/70 text-sm leading-relaxed">{notActiveMessage}</p>
        </div>
      )}
    </div>
  );
}