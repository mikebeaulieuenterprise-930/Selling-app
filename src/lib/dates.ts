import type { Locale } from "@/lib/i18n/config";

/** Date du jour (AAAA-MM-JJ) dans un fuseau horaire donné. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Décale une date AAAA-MM-JJ de n jours (calcul en UTC, sans heure d'été). */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Nombre de jours entiers entre deux dates AAAA-MM-JJ (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Date AAAA-MM-JJ d'un instant ISO, dans un fuseau donné. */
export function dateOf(iso: string, timeZone: string): string {
  return todayIn(timeZone, new Date(iso));
}

/** Jours écoulés depuis un instant ISO, vus depuis "aujourd'hui" dans le fuseau. */
export function daysSince(iso: string, timeZone: string, now: Date = new Date()): number {
  return daysBetween(dateOf(iso, timeZone), todayIn(timeZone, now));
}

const intlLocale: Record<Locale, string> = { fr: "fr-CA", en: "en-CA" };

/** « mardi 11 octobre » / "Tuesday, October 11". */
export function formatLongDate(date: string, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** « 11 oct. » / "Oct 11" pour un instant ISO. */
export function formatShortDate(iso: string, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** Lettre du jour de la semaine (L M M J V S D) pour la bande de série. */
export function weekdayLetter(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    timeZone: "UTC",
    weekday: "narrow",
  }).format(new Date(`${date}T12:00:00Z`));
}
