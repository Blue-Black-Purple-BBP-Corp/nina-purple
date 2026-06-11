import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }) {
  const browserLang = navigator.language?.startsWith('fr') ? 'fr' : 'en';
  const [lang, setLang] = useState(localStorage.getItem('nina_lang') || browserLang);

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('nina_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}