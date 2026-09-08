import type { Locale } from "../content/types";

export const locales: Locale[] = ["zh", "en", "ja"];

export const localeMeta = {
  zh: { htmlLang: "zh-CN", hreflang: "zh-CN", ogLocale: "zh_CN", label: "简体中文", shortLabel: "中" },
  en: { htmlLang: "en", hreflang: "en", ogLocale: "en_US", label: "English", shortLabel: "EN" },
  ja: { htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", label: "日本語", shortLabel: "日" },
} as const;

export function localePath(locale: Locale): string {
  return `/${locale}/`;
}

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}
