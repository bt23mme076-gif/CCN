'use client';

import { useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './translations';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Get saved language
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }

    // Listen for language changes
    const handleLanguageChange = (e: CustomEvent<Language>) => {
      setLanguage(e.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return { t, language };
}
