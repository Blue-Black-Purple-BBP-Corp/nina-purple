import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Internally managed city list — no third-party geocoding API.
// Shows active cities as suggestions but always allows free-text entry.
// A user whose town isn't listed can still complete signup normally.
// onValidityChange is always called with true — location never blocks submission.
export default function LocationAutocomplete({
  value,
  onChange,
  onValidityChange,
  placeholder = 'Search city...',
  className = '',
}) {
  const [query, setQuery] = useState(value || '');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Fetch active cities on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getActiveCities', {});
        const data = res?.data || res;
        setCities(data?.cities || []);
      } catch {
        setCities([]);
      } finally {
        setLoading(false);
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
    // Free-text is always valid — never block the user
    onValidityChange?.(true, { city: val, country: '' });
    setOpen(val.length >= 1);
  };

  const filtered = query.length >= 1
    ? cities.filter(c => {
        const q = query.toLowerCase();
        return c.city?.toLowerCase().includes(q) ||
               c.region?.toLowerCase().includes(q) ||
               c.country?.toLowerCase().includes(q);
      })
    : cities;

  const select = (city) => {
    const display = [city.city, city.region, city.country].filter(Boolean).join(', ');
    setQuery(display);
    onChange(city.city);
    setOpen(false);
    onValidityChange?.(true, { city: city.city, country: city.country || '' });
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
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5A800] animate-spin" />
        )}
      </div>

      {open && !loading && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden border border-[rgba(245,168,0,0.2)] bg-card shadow-xl max-h-60 overflow-y-auto">
          {filtered.map((c) => {
            const display = [c.city, c.region, c.country].filter(Boolean).join(', ');
            return (
              <li key={c.id || display}>
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
    </div>
  );
}