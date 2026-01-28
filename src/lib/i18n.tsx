import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

import zhTranslations from "@/locales/zh.json";
import enTranslations from "@/locales/en.json";
import msTranslations from "@/locales/ms.json";

export type Language = "zh" | "en" | "ms";

export const languageLabels: Record<Language, string> = {
  zh: "中文",
  en: "EN",
  ms: "BM",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

const translations: Record<Language, Translations> = {
  zh: zhTranslations,
  en: enTranslations,
  ms: msTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Translations, path: string): string | undefined {
  const keys = path.split(".");
  let current: TranslationValue = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as { [key: string]: TranslationValue })[key];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

function getAllKeys(obj: Translations, prefix = ""): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === "object" && value !== null) {
      keys.push(...getAllKeys(value as Translations, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

export function checkMissingTranslations(): { 
  missing: Record<Language, string[]>;
  total: number;
  byLanguage: Record<Language, { total: number; missing: number; coverage: string }>;
} {
  const zhKeys = getAllKeys(zhTranslations);
  const enKeys = getAllKeys(enTranslations);
  const msKeys = getAllKeys(msTranslations);
  
  const allKeys = new Set([...zhKeys, ...enKeys, ...msKeys]);
  
  const missing: Record<Language, string[]> = {
    zh: [],
    en: [],
    ms: [],
  };
  
  allKeys.forEach(key => {
    if (!getNestedValue(zhTranslations, key)) missing.zh.push(key);
    if (!getNestedValue(enTranslations, key)) missing.en.push(key);
    if (!getNestedValue(msTranslations, key)) missing.ms.push(key);
  });
  
  const total = allKeys.size;
  
  return {
    missing,
    total,
    byLanguage: {
      zh: {
        total: zhKeys.length,
        missing: missing.zh.length,
        coverage: `${((zhKeys.length / total) * 100).toFixed(1)}%`,
      },
      en: {
        total: enKeys.length,
        missing: missing.en.length,
        coverage: `${((enKeys.length / total) * 100).toFixed(1)}%`,
      },
      ms: {
        total: msKeys.length,
        missing: missing.ms.length,
        coverage: `${((msKeys.length / total) * 100).toFixed(1)}%`,
      },
    },
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved && ["zh", "en", "ms"].includes(saved)) {
        return saved;
      }
    }
    return "zh";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : language === "ms" ? "ms-MY" : "en";
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const value = getNestedValue(translations[language], key);
    
    if (value) return value;
    
    if (language !== "zh") {
      const zhValue = getNestedValue(translations.zh, key);
      if (zhValue) return zhValue;
    }
    
    if (fallback) return fallback;
    
    if (process.env.NODE_ENV === "development") {
      console.warn(`Missing translation: ${key} for language: ${language}`);
    }
    
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
