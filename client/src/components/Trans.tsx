import { useTranslation } from "react-i18next";

/**
 * Natural-key translation component.
 *
 * Usage:
 *   <Trans>Create Event</Trans>
 *
 * When the active language is English the text renders as-is.
 * For other languages, looks up the key "Create Event" in the locale
 * JSON and renders the translation; falls back to the English text
 * when no translation exists yet.
 *
 * Also available as a hook for dynamic strings:
 *   const { tr } = useTr();
 *   tr("Create Event")
 */
export function Trans({ children }: { children: string }) {
  const { t, i18n } = useTranslation();
  if (i18n.language === "en") return <>{children}</>;
  return <>{t(children, { defaultValue: children })}</>;
}

export function useTr() {
  const { t, i18n } = useTranslation();
  const tr = (key: string, values?: Record<string, string | number>): string => {
    if (i18n.language === "en") {
      // Still run interpolation on English text (so templates with {{var}} work)
      if (values) {
        let result = key;
        for (const [k, v] of Object.entries(values)) {
          result = result.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
        }
        return result;
      }
      return key;
    }
    return t(key, { defaultValue: key, ...(values ?? {}) }) as string;
  };
  return { tr, language: i18n.language };
}
