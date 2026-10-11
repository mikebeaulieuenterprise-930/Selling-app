import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDict, type Dictionary } from "./dictionaries";

export const TZ_COOKIE = "tz";
export const DEFAULT_TZ = "America/Toronto";

/** Langue de l'interface, lue dans le cookie. Français par défaut. */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
});

export async function getDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}

/** Fuseau horaire du navigateur, posé dans un cookie par <TimezoneSync />. */
export const getTimeZone = cache(async (): Promise<string> => {
  const value = (await cookies()).get(TZ_COOKIE)?.value;
  return value && isValidTimeZone(value) ? value : DEFAULT_TZ;
});

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
