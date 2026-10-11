"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createLead, deleteLead, getLead, updateLead } from "@/lib/data/leads";
import { LEAD_CHANNELS, LEAD_STATUSES } from "@/lib/supabase/types";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const LeadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: optional(160),
  role: optional(120),
  phone: optional(40),
  email: optional(200),
  channel: z.enum(LEAD_CHANNELS),
  segment_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.string().uuid().nullable()),
  notes: optional(2000),
});

const EditSchema = LeadSchema.extend({
  status: z.enum(LEAD_STATUSES),
  next_follow_up: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
});

export type LeadFormState = { status: "idle" } | { status: "error"; code: "name" | "invalid" | "unknown" };

function readForm(formData: FormData, keys: string[]) {
  const out: Record<string, string> = {};
  for (const key of keys) out[key] = String(formData.get(key) ?? "");
  return out;
}

const BASE_KEYS = ["name", "company", "role", "phone", "email", "channel", "segment_id", "notes"];

export async function createLeadAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  const parsed = LeadSchema.safeParse(readForm(formData, BASE_KEYS));
  if (!parsed.success) {
    return { status: "error", code: parsed.error.issues.some((i) => i.path[0] === "name") ? "name" : "invalid" };
  }
  let leadId: string;
  try {
    const lead = await createLead(user.id, parsed.data);
    leadId = lead.id;
  } catch (err) {
    console.error("[leads] create failed", err);
    return { status: "error", code: "unknown" };
  }
  revalidatePath("/leads");
  revalidatePath("/today");
  redirect(`/leads/${leadId}`);
}

export async function updateLeadAction(id: string, _prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  await requireUser();
  const parsed = EditSchema.safeParse(readForm(formData, [...BASE_KEYS, "status", "next_follow_up"]));
  if (!parsed.success) {
    return { status: "error", code: parsed.error.issues.some((i) => i.path[0] === "name") ? "name" : "invalid" };
  }
  const existing = await getLead(id);
  if (!existing) return { status: "error", code: "unknown" };

  const { next_follow_up, status, ...rest } = parsed.data;
  try {
    await updateLead(id, {
      ...rest,
      status,
      next_follow_up_at: next_follow_up ? `${next_follow_up}T13:00:00.000Z` : null,
      // Passer de « nouveau » à « contacté » à la main vaut un premier contact.
      last_contact_at:
        existing.status === "new" && status !== "new" && !existing.last_contact_at
          ? new Date().toISOString()
          : existing.last_contact_at,
    });
  } catch (err) {
    console.error("[leads] update failed", err);
    return { status: "error", code: "unknown" };
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/today");
  return { status: "idle" };
}

export async function deleteLeadAction(id: string): Promise<void> {
  await requireUser();
  await deleteLead(id);
  revalidatePath("/leads");
  revalidatePath("/today");
  redirect("/leads");
}
