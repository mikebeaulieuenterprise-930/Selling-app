"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { generateOfferAi } from "@/lib/ai/generate";
import { toActionError } from "@/lib/ai/action-utils";
import type { ActionErrorCode } from "@/lib/ai/errors";
import type { OfferAi } from "@/lib/ai/schemas";
import { upsertOffer } from "@/lib/data/offers";
import { updateProfile } from "@/lib/data/profiles";
import { CUSTOMER_TYPES, OUTREACH_CHANNELS, PRICE_HINTS, PROBLEMS } from "@/lib/offer-options";

const InputSchema = z.object({
  product_name: z.string().trim().min(1).max(120),
  product_description: z.string().trim().min(1).max(600),
  price_hint: z.enum(PRICE_HINTS).nullable(),
  customer_types: z.array(z.enum(CUSTOMER_TYPES)).min(1),
  customer_detail: z.string().trim().max(400),
  channels: z.array(z.enum(OUTREACH_CHANNELS)),
  problems: z.array(z.enum(PROBLEMS)).min(1),
  problem_detail: z.string().trim().max(400),
});

export type OnboardingInput = z.infer<typeof InputSchema>;

export type GenerateOfferResult =
  | { status: "ok"; ai: OfferAi }
  | { status: "error"; code: ActionErrorCode };

/** Enregistre l'offre et génère le positionnement. */
export async function generateOfferAction(raw: OnboardingInput): Promise<GenerateOfferResult> {
  const user = await requireUser();
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "validation" };
  const input = parsed.data;

  try {
    const locale = await getLocale();
    const ai = await generateOfferAi(
      {
        ...input,
        customer_detail: input.customer_detail || null,
        problem_detail: input.problem_detail || null,
      },
      locale,
    );
    await upsertOffer(
      user.id,
      {
        product_name: input.product_name,
        product_description: input.product_description,
        price_hint: input.price_hint,
        customer_types: input.customer_types,
        customer_detail: input.customer_detail || null,
        channels: input.channels,
        problems: input.problems,
        problem_detail: input.problem_detail || null,
      },
      ai,
    );
    revalidatePath("/", "layout");
    return { status: "ok", ai };
  } catch (err) {
    return { status: "error", code: toActionError(err) };
  }
}

/** Marque l'onboarding terminé et envoie au Radar. */
export async function confirmOnboardingAction(): Promise<void> {
  const user = await requireUser();
  await updateProfile(user.id, { onboarding_done: true });
  revalidatePath("/", "layout");
  redirect("/radar");
}
