"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { DICTS, type DictKey, type Lang } from "@/lib/i18n/dictionaries";

const LANG_KEY = "checkkaro.lang";
const THEME_KEY = "checkkaro.theme";

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
}

type I18n = {
  lang: Lang;
  /** False until the saved choice has been read, and true once a language is picked. */
  chosen: boolean | null;
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18n | null>(null);

// The saved language lives in localStorage; expose it as an external store so
// the server render (no storage) and the first client render agree.
const langListeners = new Set<() => void>();
function subscribeLang(cb: () => void) {
  langListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    langListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
// Falls back to memory when storage is blocked (private mode), so the choice still sticks for this visit.
let memoryLang: string | null = null;
const savedLang = () => read(LANG_KEY) ?? memoryLang;
const serverLang = () => undefined;

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const saved = useSyncExternalStore<string | null | undefined>(subscribeLang, savedLang, serverLang);
  const valid = saved === "en" || saved === "hi";
  const lang: Lang = valid ? saved : "en";
  const chosen = saved === undefined ? null : valid;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    memoryLang = l;
    write(LANG_KEY, l);
    langListeners.forEach((cb) => cb());
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, chosen, setLang, t }), [lang, chosen, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  write(THEME_KEY, next);
}

/** Inline script run before paint so the saved theme never flashes. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;
