import React, { useState, useMemo } from 'react';

// Curated country codes with expected digit counts (excluding the country code itself).
// No external library — validation uses digit-count rules per country.
const COUNTRY_CODES = [
  { dial: '1',   flag: '🇺🇸', name: 'US/Canada',     digits: 10 },
  { dial: '33',  flag: '🇫🇷', name: 'France',        digits: 9 },
  { dial: '596', flag: '🇲🇶', name: 'Martinique',    digits: 9 },
  { dial: '590', flag: '🇬🇵', name: 'Guadeloupe',    digits: 9 },
  { dial: '594', flag: '🇬🇫', name: 'French Guiana', digits: 9 },
  { dial: '262', flag: '🇷🇪', name: 'Réunion',       digits: 9 },
  { dial: '44',  flag: '🇬🇧', name: 'UK',            digits: 10 },
  { dial: '49',  flag: '🇩🇪', name: 'Germany',       digits: 10 },
  { dial: '32',  flag: '🇧🇪', name: 'Belgium',       digits: 9 },
  { dial: '41',  flag: '🇨🇭', name: 'Switzerland',   digits: 9 },
  { dial: '39',  flag: '🇮🇹', name: 'Italy',         digits: 10 },
  { dial: '34',  flag: '🇪🇸', name: 'Spain',         digits: 9 },
  { dial: '351', flag: '🇵🇹', name: 'Portugal',      digits: 9 },
  { dial: '31',  flag: '🇳🇱', name: 'Netherlands',    digits: 9 },
  { dial: '46',  flag: '🇸🇪', name: 'Sweden',        digits: 9 },
  { dial: '52',  flag: '🇲🇽', name: 'Mexico',        digits: 10 },
  { dial: '55',  flag: '🇧🇷', name: 'Brazil',        digits: 11 },
  { dial: '86',  flag: '🇨🇳', name: 'China',         digits: 11 },
  { dial: '91',  flag: '🇮🇳', name: 'India',         digits: 10 },
  { dial: '81',  flag: '🇯🇵', name: 'Japan',         digits: 10 },
  { dial: '61',  flag: '🇦🇺', name: 'Australia',     digits: 9 },
];

// Sort longest dial first so "596" matches before "5" or "59"
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);

function parseValue(value) {
  if (!value) return { dial: '1', number: '' };
  const cleaned = value.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    const withoutPlus = cleaned.slice(1);
    for (const c of SORTED_CODES) {
      if (withoutPlus.startsWith(c.dial)) {
        return { dial: c.dial, number: withoutPlus.slice(c.dial.length) };
      }
    }
  }
  return { dial: '1', number: cleaned.replace(/^\+/, '') };
}

export default function PhoneInput({ value, onChange, onValidityChange, lang = 'en' }) {
  const initial = useMemo(() => parseValue(value), []);
  const [countryDial, setCountryDial] = useState(initial.dial);
  const [number, setNumber] = useState(initial.number);
  const [touched, setTouched] = useState(false);

  const country = COUNTRY_CODES.find(c => c.dial === countryDial);
  const digits = number.replace(/\D/g, '');
  const isValid = !!(country && digits.length === country.digits);

  const propagate = (newDial, newNumber) => {
    const c = COUNTRY_CODES.find(x => x.dial === newDial);
    const d = newNumber.replace(/\D/g, '');
    const valid = !!(c && d.length === c.digits);
    onChange(`+${newDial}${d}`);
    onValidityChange?.(valid);
  };

  const handleNumberChange = (e) => {
    // Allow digits, spaces, dashes, parentheses — strip letters and other chars
    const stripped = e.target.value.replace(/[^\d\s\-().]/g, '');
    setNumber(stripped);
    setTouched(true);
    propagate(countryDial, stripped);
  };

  const handleCountryChange = (e) => {
    const newDial = e.target.value;
    setCountryDial(newDial);
    setTouched(true);
    propagate(newDial, number);
  };

  const showError = touched && !isValid && digits.length > 0;
  const isFr = lang === 'fr';

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={countryDial}
          onChange={handleCountryChange}
          className="glass-card rounded-xl px-3 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-card border border-border shrink-0"
        >
          {COUNTRY_CODES.map(c => (
            <option key={c.dial} value={c.dial}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          placeholder={country ? `${country.digits} ${isFr ? 'chiffres' : 'digits'}` : ''}
          className="flex-1 glass-card rounded-xl px-4 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
        />
      </div>
      {showError && (
        <p className="text-red-400 text-xs mt-1">
          {isFr
            ? `Numéro invalide — ${country?.digits || 10} chiffres attendus pour ce code pays.`
            : `Invalid number — ${country?.digits || 10} digits expected for this country code.`}
        </p>
      )}
      <p className="text-foreground/30 text-xs mt-1">
        {isFr
          ? 'Vous recevrez un appel pour confirmer que vous êtes une personne réelle. Nina Purple se réserve le droit de vérifier tous les individus par téléphone.'
          : 'You will receive a call to verify that you are a real human. Nina Purple reserves the right to verify all individuals by phone.'}
      </p>
    </div>
  );
}