import type { Locale } from "../config";
import { fr } from "./fr";
import { en } from "./en";

/** Le français est la source ; l'anglais doit avoir exactement la même forme. */
export type Dictionary = Widen<typeof fr>;

type Widen<T> = T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> };

export const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDict(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Remplace {name} par la valeur fournie. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
