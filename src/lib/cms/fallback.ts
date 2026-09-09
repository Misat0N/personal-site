import { getProfile } from "../../content";
import type { HomeContent, Locale } from "../../content/types";

export function staticFallback(locale: Locale): HomeContent {
  return structuredClone(getProfile(locale));
}
