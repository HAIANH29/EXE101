import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AppLanguage = 'vi' | 'en';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

const LANGUAGE_STORAGE_KEY = 'stylelock.language';
const DEFAULT_LANGUAGE: AppLanguage = 'vi';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
let currentLanguage: AppLanguage = DEFAULT_LANGUAGE;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }

  return null;
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'vi' || value === 'en';
}

function readStoredLanguage(): AppLanguage {
  const storage = getStorage();
  if (!storage) return DEFAULT_LANGUAGE;

  const raw = storage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(raw) ? raw : DEFAULT_LANGUAGE;
}

currentLanguage = readStoredLanguage();

function persistLanguage(language: AppLanguage) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => currentLanguage);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    currentLanguage = nextLanguage;
    setLanguageState(nextLanguage);
    persistLanguage(nextLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage
    }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider.');
  }

  return context;
}

export function getCurrentLanguage() {
  return currentLanguage;
}
