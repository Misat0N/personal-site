import type { HomeContent, Locale } from "./types";
import { profileEn } from "./en";
import { profileJa } from "./ja";
import { profileZh } from "./zh";

export type { HomeContent, Locale, ResumeItem } from "./types";

export const profiles: Record<Locale, HomeContent> = {
  zh: profileZh,
  en: profileEn,
  ja: profileJa,
};

export function getProfile(locale: Locale): HomeContent {
  return profiles[locale];
}
