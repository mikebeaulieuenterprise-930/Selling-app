"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { generateSegments } from "@/lib/ai/generate";
import { toActionError } from "@/lib/ai/action-utils";
import type { ActionErrorCode } from "@/lib/ai/errors";
import { parseOfferAi } from "@/lib/ai/schemas";
import { getOffer } from "@/lib/data/offers";
import { replaceSegments, setPrioritySegment } from "@/lib/data/segments";

export type RunRadarResult = { status: "ok" } | { status: "error"; code: ActionErrorCode };

export async function runRadarAction(): Promise<RunRadarResult> {
  const user = await requireUser();
  const offer = await getOffer();
  if (!offer) return { status: "error", code: "needs_offer" };

  try {
    const locale = await getLocale();
    const segments = await generateSegments(offer, parseOfferAi(offer.ai), locale);
    await replaceSegments(user.id, offer.id, segments);
    revalidatePath("/radar");
    revalidatePath("/today");
    return { status: "ok" };
  } catch (err) {
    return { status: "error", code: toActionError(err) };
  }
}

export async function setPriorityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setPrioritySegment(user.id, id);
  revalidatePath("/radar");
  revalidatePath("/today");
}
