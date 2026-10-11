export const APP_NAME = "Closer";

export const APP_DESCRIPTION = {
  fr: "Le copilote de vente des builders : qui viser, quoi dire, comment conclure. 15 minutes par jour.",
  en: "The sales copilot for builders: who to target, what to say, how to close. 15 minutes a day.",
} as const;

/** Where a signed-in user lands. */
export const HOME_PATH = "/today";

/** Public base URL, used for magic-link redirects. */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}
