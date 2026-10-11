"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { updateProfile } from "@/lib/data/profiles";
import { getOffer, setOfferAi } from "@/lib/data/offers";
import { generateOfferAi } from "@/lib/ai/generate";
import { toActionError } from "@/lib/ai/action-utils";
import type { ActionErrorCode } from "@/lib/ai/errors";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  await updateProfile(user.id, { locale });
  revalidatePath("/", "layout");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function regenerateOfferAction(): Promise<{ status: "ok" } | { status: "error"; code: ActionErrorCode }> {
  await requireUser();
  const offer = await getOffer();
  if (!offer) return { status: "error", code: "needs_offer" };
  try {
    const locale = await getLocale();
    const ai = await generateOfferAi(offer, locale);
    await setOfferAi(offer.id, ai);
    revalidatePath("/profile");
    return { status: "ok" };
  } catch (err) {
    return { status: "error", code: toActionError(err) };
  }
}
