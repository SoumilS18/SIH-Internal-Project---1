import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  LanguageOption,
  getLanguageByCode,
  isLanguageAvailable,
} from './languages';
import { en } from './translations/en';
import { hi } from './translations/hi';

const TRANSLATION_DICTS: Record<string, any> = {
  en,
  hi,
};

interface LanguageContextType {
  language: string;
  languageOption: LanguageOption;
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
  isAvailable: (code: string) => boolean;
  comingSoonModalTarget: LanguageOption | null;
  openComingSoonModal: (lang: LanguageOption) => void;
  closeComingSoonModal: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Development-time verification of language completeness between English and Hindi.
 */
function validateLanguageCompleteness() {
  if (!import.meta.env.DEV) return;

  function collectKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        keys = keys.concat(collectKeys(v, fullPath));
      } else {
        keys.push(fullPath);
      }
    }
    return keys;
  }

  const enKeys = collectKeys(en);
  const missingInHindi = enKeys.filter((k) => getNestedValue(hi, k) === undefined);

  if (missingInHindi.length > 0) {
    console.warn(
      `⚠️ [I18N COMPLETENESS WARNING] Hindi is missing ${missingInHindi.length} translation keys:`,
      missingInHindi
    );
  } else {
    console.info(`✓ [I18N COMPLETENESS] Hindi has 100% key parity with English (${enKeys.length} keys validated).`);
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('agrioptima_language_v1');
      if (saved && (saved === 'en' || saved === 'hi')) return saved;
    } catch {
      // localStorage unavailable or restricted
    }
    return 'en';
  });
  const [comingSoonModalTarget, setComingSoonModalTarget] = useState<LanguageOption | null>(null);

  // Run completeness check once on development mount
  useEffect(() => {
    validateLanguageCompleteness();
  }, []);

  const setLanguage = useCallback((code: string) => {
    const opt = getLanguageByCode(code);
    if (opt.status === 'available') {
      setLanguageState(opt.code);
      try {
        localStorage.setItem('agrioptima_language_v1', opt.code);
      } catch {}
      setComingSoonModalTarget(null);
    } else {
      setComingSoonModalTarget(opt);
    }
  }, []);

  const openComingSoonModal = useCallback((lang: LanguageOption) => {
    setComingSoonModalTarget(lang);
  }, []);

  const closeComingSoonModal = useCallback(() => {
    setComingSoonModalTarget(null);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const activeDict = TRANSLATION_DICTS[language] || en;
      let val = getNestedValue(activeDict, key);

      if (!val && language !== 'en') {
        // Fallback to English dictionary
        val = getNestedValue(en, key);
        if (import.meta.env.DEV) {
          console.warn(`[MISSING_TRANSLATION] ${language}.${key}`);
        }
      }

      if (!val) {
        if (import.meta.env.DEV) {
          console.warn(`[MISSING_TRANSLATION] en.${key}`);
        }
        return fallback !== undefined ? fallback : key;
      }

      return val;
    },
    [language]
  );

  const languageOption = useMemo(() => getLanguageByCode(language), [language]);

  const value = useMemo(
    () => ({
      language,
      languageOption,
      setLanguage,
      t,
      isAvailable: isLanguageAvailable,
      comingSoonModalTarget,
      openComingSoonModal,
      closeComingSoonModal,
    }),
    [language, languageOption, setLanguage, t, comingSoonModalTarget, openComingSoonModal, closeComingSoonModal]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
