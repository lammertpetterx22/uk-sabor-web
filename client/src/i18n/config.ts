import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files — partial translations are allowed.
// Any key missing in a locale file automatically falls back to English.
import translationES from './locales/es.json';
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';
import translationDE from './locales/de.json';
import translationNL from './locales/nl.json';
import translationRU from './locales/ru.json';
import translationCS from './locales/cs.json';
import translationZH from './locales/zh.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  fr: { translation: translationFR },
  de: { translation: translationDE },
  nl: { translation: translationNL },
  ru: { translation: translationRU },
  cs: { translation: translationCS },
  zh: { translation: translationZH },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

/** Exposed here so the LanguageSwitcher and Header can import a single source of truth. */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',   flag: '🇬🇧' },
  { code: 'es', name: 'Español',   flag: '🇪🇸' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ru', name: 'Русский',   flag: '🇷🇺' },
  { code: 'cs', name: 'Čeština',   flag: '🇨🇿' },
  { code: 'zh', name: '中文',       flag: '🇨🇳' },
] as const;
