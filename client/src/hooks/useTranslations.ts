import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook for translations with type safety
 * Usage: const { t } = useTranslations();
 * Example: t('common.loading') → "Loading..." or "Cargando..."
 */
export function useTranslations() {
  const { t, i18n } = useI18nTranslation();

  return {
    t,
    /** Current language code (en, es) */
    language: i18n.language,
    /** Change language programmatically */
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
    /** Check if current language is English */
    isEnglish: i18n.language === 'en',
    /** Check if current language is Spanish */
    isSpanish: i18n.language === 'es',
  };
}
