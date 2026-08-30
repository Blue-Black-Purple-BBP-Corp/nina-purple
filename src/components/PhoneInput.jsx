import React, { useState, useMemo } from 'react';

// Comprehensive international dial codes with flags.
// Validation uses ITU-T E.164: total digits (dial + local) must be 8–15.
const COUNTRY_CODES = [
  { dial: '1', flag: '🇺🇸', name: 'US/Canada' },
  { dial: '7', flag: '🇷🇺', name: 'Russia/Kazakhstan' },
  { dial: '20', flag: '🇪🇬', name: 'Egypt' },
  { dial: '27', flag: '🇿🇦', name: 'South Africa' },
  { dial: '30', flag: '🇬🇷', name: 'Greece' },
  { dial: '31', flag: '🇳🇱', name: 'Netherlands' },
  { dial: '32', flag: '🇧🇪', name: 'Belgium' },
  { dial: '33', flag: '🇫🇷', name: 'France' },
  { dial: '34', flag: '🇪🇸', name: 'Spain' },
  { dial: '36', flag: '🇭🇺', name: 'Hungary' },
  { dial: '39', flag: '🇮🇹', name: 'Italy' },
  { dial: '40', flag: '🇷🇴', name: 'Romania' },
  { dial: '41', flag: '🇨🇭', name: 'Switzerland' },
  { dial: '43', flag: '🇦🇹', name: 'Austria' },
  { dial: '44', flag: '🇬🇧', name: 'UK' },
  { dial: '45', flag: '🇩🇰', name: 'Denmark' },
  { dial: '46', flag: '🇸🇪', name: 'Sweden' },
  { dial: '47', flag: '🇳🇴', name: 'Norway' },
  { dial: '48', flag: '🇵🇱', name: 'Poland' },
  { dial: '49', flag: '🇩🇪', name: 'Germany' },
  { dial: '51', flag: '🇵🇪', name: 'Peru' },
  { dial: '52', flag: '🇲🇽', name: 'Mexico' },
  { dial: '53', flag: '🇨🇺', name: 'Cuba' },
  { dial: '54', flag: '🇦🇷', name: 'Argentina' },
  { dial: '55', flag: '🇧🇷', name: 'Brazil' },
  { dial: '56', flag: '🇨🇱', name: 'Chile' },
  { dial: '57', flag: '🇨🇴', name: 'Colombia' },
  { dial: '58', flag: '🇻🇪', name: 'Venezuela' },
  { dial: '60', flag: '🇲🇾', name: 'Malaysia' },
  { dial: '61', flag: '🇦🇺', name: 'Australia' },
  { dial: '62', flag: '🇮🇩', name: 'Indonesia' },
  { dial: '63', flag: '🇵🇭', name: 'Philippines' },
  { dial: '64', flag: '🇳🇿', name: 'New Zealand' },
  { dial: '65', flag: '🇸🇬', name: 'Singapore' },
  { dial: '66', flag: '🇹🇭', name: 'Thailand' },
  { dial: '81', flag: '🇯🇵', name: 'Japan' },
  { dial: '82', flag: '🇰🇷', name: 'South Korea' },
  { dial: '84', flag: '🇻🇳', name: 'Vietnam' },
  { dial: '86', flag: '🇨🇳', name: 'China' },
  { dial: '90', flag: '🇹🇷', name: 'Turkey' },
  { dial: '91', flag: '🇮🇳', name: 'India' },
  { dial: '92', flag: '🇵🇰', name: 'Pakistan' },
  { dial: '93', flag: '🇦🇫', name: 'Afghanistan' },
  { dial: '94', flag: '🇱🇰', name: 'Sri Lanka' },
  { dial: '95', flag: '🇲🇲', name: 'Myanmar' },
  { dial: '98', flag: '🇮🇷', name: 'Iran' },
  { dial: '212', flag: '🇲🇦', name: 'Morocco' },
  { dial: '213', flag: '🇩🇿', name: 'Algeria' },
  { dial: '216', flag: '🇹🇳', name: 'Tunisia' },
  { dial: '218', flag: '🇱🇾', name: 'Libya' },
  { dial: '220', flag: '🇬🇲', name: 'Gambia' },
  { dial: '221', flag: '🇸🇳', name: 'Senegal' },
  { dial: '222', flag: '🇲🇷', name: 'Mauritania' },
  { dial: '223', flag: '🇲🇱', name: 'Mali' },
  { dial: '224', flag: '🇬🇳', name: 'Guinea' },
  { dial: '225', flag: '🇨🇮', name: 'Ivory Coast' },
  { dial: '226', flag: '🇧🇫', name: 'Burkina Faso' },
  { dial: '227', flag: '🇳🇪', name: 'Niger' },
  { dial: '228', flag: '🇹🇬', name: 'Togo' },
  { dial: '229', flag: '🇧🇯', name: 'Benin' },
  { dial: '230', flag: '🇲🇺', name: 'Mauritius' },
  { dial: '231', flag: '🇱🇷', name: 'Liberia' },
  { dial: '232', flag: '🇸🇱', name: 'Sierra Leone' },
  { dial: '233', flag: '🇬🇭', name: 'Ghana' },
  { dial: '234', flag: '🇳🇬', name: 'Nigeria' },
  { dial: '235', flag: '🇹🇩', name: 'Chad' },
  { dial: '236', flag: '🇨🇫', name: 'Central African Rep.' },
  { dial: '237', flag: '🇨🇲', name: 'Cameroon' },
  { dial: '238', flag: '🇨🇻', name: 'Cape Verde' },
  { dial: '239', flag: '🇸🇹', name: 'São Tomé' },
  { dial: '240', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { dial: '241', flag: '🇬🇦', name: 'Gabon' },
  { dial: '242', flag: '🇨🇬', name: 'Congo' },
  { dial: '243', flag: '🇨🇩', name: 'DR Congo' },
  { dial: '244', flag: '🇦🇴', name: 'Angola' },
  { dial: '245', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { dial: '248', flag: '🇸🇨', name: 'Seychelles' },
  { dial: '249', flag: '🇸🇩', name: 'Sudan' },
  { dial: '250', flag: '🇷🇼', name: 'Rwanda' },
  { dial: '251', flag: '🇪🇹', name: 'Ethiopia' },
  { dial: '252', flag: '🇸🇴', name: 'Somalia' },
  { dial: '253', flag: '🇩🇯', name: 'Djibouti' },
  { dial: '254', flag: '🇰🇪', name: 'Kenya' },
  { dial: '255', flag: '🇹🇿', name: 'Tanzania' },
  { dial: '256', flag: '🇺🇬', name: 'Uganda' },
  { dial: '257', flag: '🇧🇮', name: 'Burundi' },
  { dial: '258', flag: '🇲🇿', name: 'Mozambique' },
  { dial: '260', flag: '🇿🇲', name: 'Zambia' },
  { dial: '261', flag: '🇲🇬', name: 'Madagascar' },
  { dial: '263', flag: '🇿🇼', name: 'Zimbabwe' },
  { dial: '264', flag: '🇳🇦', name: 'Namibia' },
  { dial: '265', flag: '🇲🇼', name: 'Malawi' },
  { dial: '266', flag: '🇱🇸', name: 'Lesotho' },
  { dial: '267', flag: '🇧🇼', name: 'Botswana' },
  { dial: '268', flag: '🇸🇿', name: 'Eswatini' },
  { dial: '269', flag: '🇰🇲', name: 'Comoros' },
  { dial: '290', flag: '🇸🇭', name: 'Saint Helena' },
  { dial: '291', flag: '🇪🇷', name: 'Eritrea' },
  { dial: '297', flag: '🇦🇼', name: 'Aruba' },
  { dial: '298', flag: '🇫🇴', name: 'Faroe Islands' },
  { dial: '299', flag: '🇬🇱', name: 'Greenland' },
  { dial: '350', flag: '🇬🇮', name: 'Gibraltar' },
  { dial: '351', flag: '🇵🇹', name: 'Portugal' },
  { dial: '352', flag: '🇱🇺', name: 'Luxembourg' },
  { dial: '353', flag: '🇮🇪', name: 'Ireland' },
  { dial: '354', flag: '🇮🇸', name: 'Iceland' },
  { dial: '355', flag: '🇦🇱', name: 'Albania' },
  { dial: '356', flag: '🇲🇹', name: 'Malta' },
  { dial: '357', flag: '🇨🇾', name: 'Cyprus' },
  { dial: '358', flag: '🇫🇮', name: 'Finland' },
  { dial: '359', flag: '🇧🇬', name: 'Bulgaria' },
  { dial: '370', flag: '🇱🇹', name: 'Lithuania' },
  { dial: '371', flag: '🇱🇻', name: 'Latvia' },
  { dial: '372', flag: '🇪🇪', name: 'Estonia' },
  { dial: '373', flag: '🇲🇩', name: 'Moldova' },
  { dial: '374', flag: '🇦🇲', name: 'Armenia' },
  { dial: '375', flag: '🇧🇾', name: 'Belarus' },
  { dial: '376', flag: '🇦🇩', name: 'Andorra' },
  { dial: '377', flag: '🇲🇨', name: 'Monaco' },
  { dial: '378', flag: '🇸🇲', name: 'San Marino' },
  { dial: '380', flag: '🇺🇦', name: 'Ukraine' },
  { dial: '381', flag: '🇷🇸', name: 'Serbia' },
  { dial: '382', flag: '🇲🇪', name: 'Montenegro' },
  { dial: '383', flag: '🇽🇰', name: 'Kosovo' },
  { dial: '385', flag: '🇭🇷', name: 'Croatia' },
  { dial: '386', flag: '🇸🇮', name: 'Slovenia' },
  { dial: '387', flag: '🇧🇦', name: 'Bosnia' },
  { dial: '389', flag: '🇲🇰', name: 'North Macedonia' },
  { dial: '420', flag: '🇨🇿', name: 'Czechia' },
  { dial: '421', flag: '🇸🇰', name: 'Slovakia' },
  { dial: '423', flag: '🇱🇮', name: 'Liechtenstein' },
  { dial: '500', flag: '🇫🇰', name: 'Falkland Islands' },
  { dial: '501', flag: '🇧🇿', name: 'Belize' },
  { dial: '502', flag: '🇬🇹', name: 'Guatemala' },
  { dial: '503', flag: '🇸🇻', name: 'El Salvador' },
  { dial: '504', flag: '🇭🇳', name: 'Honduras' },
  { dial: '505', flag: '🇳🇮', name: 'Nicaragua' },
  { dial: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { dial: '507', flag: '🇵🇦', name: 'Panama' },
  { dial: '508', flag: '🇵🇲', name: 'Saint Pierre' },
  { dial: '509', flag: '🇭🇹', name: 'Haiti' },
  { dial: '590', flag: '🇬🇵', name: 'Guadeloupe' },
  { dial: '591', flag: '🇧🇴', name: 'Bolivia' },
  { dial: '592', flag: '🇬🇾', name: 'Guyana' },
  { dial: '593', flag: '🇪🇨', name: 'Ecuador' },
  { dial: '594', flag: '🇬🇫', name: 'French Guiana' },
  { dial: '595', flag: '🇵🇾', name: 'Paraguay' },
  { dial: '596', flag: '🇲🇶', name: 'Martinique' },
  { dial: '597', flag: '🇸🇷', name: 'Suriname' },
  { dial: '598', flag: '🇺🇾', name: 'Uruguay' },
  { dial: '599', flag: '🇨🇼', name: 'Curaçao' },
  { dial: '670', flag: '🇹🇱', name: 'Timor-Leste' },
  { dial: '672', flag: '🇦🇺', name: 'Norfolk Island' },
  { dial: '673', flag: '🇧🇳', name: 'Brunei' },
  { dial: '674', flag: '🇳🇷', name: 'Nauru' },
  { dial: '675', flag: '🇵🇬', name: 'Papua New Guinea' },
  { dial: '676', flag: '🇹🇴', name: 'Tonga' },
  { dial: '677', flag: '🇸🇧', name: 'Solomon Islands' },
  { dial: '678', flag: '🇻🇺', name: 'Vanuatu' },
  { dial: '679', flag: '🇫🇯', name: 'Fiji' },
  { dial: '680', flag: '🇵🇼', name: 'Palau' },
  { dial: '682', flag: '🇨🇰', name: 'Cook Islands' },
  { dial: '685', flag: '🇼🇸', name: 'Samoa' },
  { dial: '686', flag: '🇰🇮', name: 'Kiribati' },
  { dial: '688', flag: '🇹🇻', name: 'Tuvalu' },
  { dial: '691', flag: '🇫🇲', name: 'Micronesia' },
  { dial: '850', flag: '🇰🇵', name: 'North Korea' },
  { dial: '852', flag: '🇭🇰', name: 'Hong Kong' },
  { dial: '853', flag: '🇲🇴', name: 'Macao' },
  { dial: '855', flag: '🇰🇭', name: 'Cambodia' },
  { dial: '856', flag: '🇱🇦', name: 'Laos' },
  { dial: '880', flag: '🇧🇩', name: 'Bangladesh' },
  { dial: '886', flag: '🇹🇼', name: 'Taiwan' },
  { dial: '960', flag: '🇲🇻', name: 'Maldives' },
  { dial: '961', flag: '🇱🇧', name: 'Lebanon' },
  { dial: '962', flag: '🇯🇴', name: 'Jordan' },
  { dial: '963', flag: '🇸🇾', name: 'Syria' },
  { dial: '964', flag: '🇮🇶', name: 'Iraq' },
  { dial: '965', flag: '🇰🇼', name: 'Kuwait' },
  { dial: '966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { dial: '967', flag: '🇾🇪', name: 'Yemen' },
  { dial: '968', flag: '🇴🇲', name: 'Oman' },
  { dial: '971', flag: '🇦🇪', name: 'UAE' },
  { dial: '972', flag: '🇮🇱', name: 'Israel' },
  { dial: '973', flag: '🇧🇭', name: 'Bahrain' },
  { dial: '974', flag: '🇶🇦', name: 'Qatar' },
  { dial: '975', flag: '🇧🇹', name: 'Bhutan' },
  { dial: '976', flag: '🇲🇳', name: 'Mongolia' },
  { dial: '977', flag: '🇳🇵', name: 'Nepal' },
  { dial: '992', flag: '🇹🇯', name: 'Tajikistan' },
  { dial: '993', flag: '🇹🇲', name: 'Turkmenistan' },
  { dial: '994', flag: '🇦🇿', name: 'Azerbaijan' },
  { dial: '995', flag: '🇬🇪', name: 'Georgia' },
  { dial: '996', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { dial: '998', flag: '🇺🇿', name: 'Uzbekistan' },
];

// Sort longest dial first so "596" matches before "5" or "59"
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);

// E.164: total digits (dial + local) must be 8–15
const MIN_TOTAL = 8;
const MAX_TOTAL = 15;

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
  const totalDigits = countryDial.length + digits.length;
  const isValid = digits.length >= 4 && totalDigits >= MIN_TOTAL && totalDigits <= MAX_TOTAL;

  const propagate = (newDial, newNumber) => {
    const d = newNumber.replace(/\D/g, '');
    const total = newDial.length + d.length;
    const valid = d.length >= 4 && total >= MIN_TOTAL && total <= MAX_TOTAL;
    onChange(`+${newDial}${d}`);
    onValidityChange?.(valid);
  };

  const handleNumberChange = (e) => {
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
          className="glass-card rounded-xl px-3 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-card border border-border shrink-0 max-w-[120px]"
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
          placeholder={isFr ? 'Numéro de téléphone' : 'Phone number'}
          className="flex-1 glass-card rounded-xl px-4 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
        />
      </div>
      {showError && (
        <p className="text-red-400 text-xs mt-1">
          {isFr
            ? 'Numéro invalide — vérifiez l\'indicatif pays et le nombre de chiffres.'
            : 'Invalid number — check the country code and digit count.'}
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