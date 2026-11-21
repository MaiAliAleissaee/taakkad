import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Bi } from "@/lib/domain/types";
import { formatDisplayDate } from "./date";
import { DEFAULT_LANGUAGE, resolveLanguage } from "./preferences";

export type Lang = "en" | "ar";
const KEY = "trustzero.lang";

export function interpolate(template: string, params: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

interface I18nValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  /** Inline bilingual copy: tr("English", "العربية"). */
  tr: (en: string, ar: string) => string;
  pick: (b: Bi | undefined) => string;
  fmt: (b: Bi, params?: Record<string, string | number>) => string;
  date: (iso: string, withTime?: boolean) => string;
  num: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try { setLangState(resolveLanguage(localStorage.getItem(KEY))); } catch { /* retain original default */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const locale = lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
    return {
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      tr: (en, ar) => (lang === "ar" ? ar : en),
      pick: (b) => (b ? b[lang] : ""),
      fmt: (b, params) => interpolate(b[lang], params),
      date: (iso, withTime = false) => formatDisplayDate(iso, lang, withTime),
      num: (n) => new Intl.NumberFormat(locale).format(n),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
