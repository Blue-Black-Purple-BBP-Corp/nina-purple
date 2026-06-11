import React from 'react';
import { useLang } from '@/lib/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300
        border border-[rgba(245,168,0,0.3)] text-[#F5A800] hover:bg-[rgba(245,168,0,0.1)] ${className}`}
    >
      <span className={lang === 'en' ? 'font-bold' : 'opacity-60'}>EN</span>
      <span className="opacity-40">|</span>
      <span className={lang === 'fr' ? 'font-bold' : 'opacity-60'}>FR</span>
    </button>
  );
}