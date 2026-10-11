// Les choix cliquables de l'onboarding. Les clés sont stockées en base,
// les libellés viennent du dictionnaire (onboarding.step1.prices, etc.).

export const PRICE_HINTS = [
  "under_50",
  "from_50_to_200",
  "from_200_to_1000",
  "over_1000",
  "quote",
  "unknown",
] as const;
export type PriceHint = (typeof PRICE_HINTS)[number];

export const CUSTOMER_TYPES = [
  "local_business",
  "smb",
  "saas_founders",
  "agencies",
  "freelancers",
  "enterprise",
  "consumers",
  "nonprofit",
] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const PROBLEMS = [
  "time",
  "losing_customers",
  "not_enough_leads",
  "costs",
  "manual",
  "visibility",
  "quality",
  "compliance",
  "cashflow",
  "hiring",
] as const;
export type Problem = (typeof PROBLEMS)[number];

/** Canaux de prospection (pas « autre », qui n'aide pas l'IA). */
export const OUTREACH_CHANNELS = ["sms", "email", "call", "linkedin", "in_person"] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];
