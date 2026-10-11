import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getOffer } from "@/lib/data/offers";
import { parseOfferAi } from "@/lib/ai/schemas";
import { CUSTOMER_TYPES, OUTREACH_CHANNELS, PRICE_HINTS, PROBLEMS } from "@/lib/offer-options";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Ton offre" };
// La génération IA peut prendre quelques dizaines de secondes.
export const maxDuration = 60;

function pick<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return values.filter((v): v is T => (allowed as readonly string[]).includes(v));
}

export default async function OnboardingPage() {
  await requireUser();
  const offer = await getOffer();

  const initial = {
    product_name: offer?.product_name ?? "",
    product_description: offer?.product_description ?? "",
    price_hint: offer?.price_hint && (PRICE_HINTS as readonly string[]).includes(offer.price_hint)
      ? (offer.price_hint as (typeof PRICE_HINTS)[number])
      : null,
    customer_types: pick(offer?.customer_types ?? [], CUSTOMER_TYPES),
    customer_detail: offer?.customer_detail ?? "",
    channels: pick(offer?.channels ?? [], OUTREACH_CHANNELS),
    problems: pick(offer?.problems ?? [], PROBLEMS),
    problem_detail: offer?.problem_detail ?? "",
  };

  return (
    <OnboardingWizard
      initial={initial}
      initialAi={offer ? parseOfferAi(offer.ai) : null}
      editing={Boolean(offer)}
    />
  );
}
