import type { Locale } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n";
import { en, type Messages } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { th } from "./th";
import { zhHans } from "./zh-Hans";
import { zhHant } from "./zh-Hant";

export type { Messages };

export const messages: Record<Locale, Messages> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ja,
  ko,
  th,
  nl,
};

export function t(locale: Locale): Messages {
  return messages[locale] ?? messages[defaultLocale];
}
