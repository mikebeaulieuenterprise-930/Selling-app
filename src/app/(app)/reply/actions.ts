"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/server";
import { analyzeReply } from "@/lib/ai/generate";
import { toActionError } from "@/lib/ai/action-utils";
import type { ActionErrorCode } from "@/lib/ai/errors";
import { parseOfferAi, parseReplyAi, type ReplyAi } from "@/lib/ai/schemas";
import { getOffer } from "@/lib/data/offers";
import { getLead, updateLead } from "@/lib/data/leads";
import { listSegments } from "@/lib/data/segments";
import { createAnalysis, getAnalysis, markAnalysisSent } from "@/lib/data/analyses";
import { LEAD_CHANNELS } from "@/lib/supabase/types";

const InputSchema = z.object({
  leadId: z.string().uuid().nullable(),
  channel: z.enum(LEAD_CHANNELS),
  message: z.string().trim().min(1).max(4000),
});

export type AnalyzeInput = z.infer<typeof InputSchema>;

export type AnalyzeResult =
  | { status: "ok"; analysisId: string; ai: ReplyAi; leadName: string | null }
  | { status: "error"; code: ActionErrorCode };

export async function analyzeReplyAction(raw: AnalyzeInput): Promise<AnalyzeResult> {
  const user = await requireUser();
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "validation" };
  const input = parsed.data;

  const offer = await getOffer();
  if (!offer) return { status: "error", code: "needs_offer" };

  const lead = input.leadId ? await getLead(input.leadId) : null;
  if (input.leadId && !lead) return { status: "error", code: "validation" };

  try {
    const locale = await getLocale();
    let segmentName: string | null = null;
    if (lead?.segment_id) {
      const segments = await listSegments();
      segmentName = segments.find((s) => s.id === lead.segment_id)?.name ?? null;
    }

    const ai = await analyzeReply(
      {
        offer,
        offerAi: parseOfferAi(offer.ai),
        lead: lead
          ? { name: lead.name, company: lead.company, role: lead.role, status: lead.status, notes: lead.notes, segment_name: segmentName }
          : null,
        channel: input.channel,
        message: input.message,
      },
      locale,
    );

    const analysis = await createAnalysis(user.id, {
      lead_id: lead?.id ?? null,
      channel: input.channel,
      lead_message: input.message,
      analysis: ai,
      reply_draft: ai.reply_draft,
    });

    if (lead) {
      // Le lead vient de parler : il a répondu, et c'est à toi de jouer.
      const keepStatus = lead.status === "call_booked" || lead.status === "won" || lead.status === "lost";
      await updateLead(lead.id, {
        status: keepStatus ? lead.status : "replied",
        temperature: ai.temperature,
        last_inbound_at: new Date().toISOString(),
      });
    }

    revalidatePath("/reply");
    revalidatePath("/leads");
    revalidatePath("/today");
    return { status: "ok", analysisId: analysis.id, ai, leadName: lead?.name ?? null };
  } catch (err) {
    return { status: "error", code: toActionError(err) };
  }
}

/** Tu as envoyé la réponse : on note le contact et on planifie la relance. */
export async function markSentAction(analysisId: string): Promise<{ status: "ok" } | { status: "error" }> {
  await requireUser();
  const analysis = await getAnalysis(analysisId);
  if (!analysis) return { status: "error" };

  await markAnalysisSent(analysis.id);

  if (analysis.lead_id) {
    const lead = await getLead(analysis.lead_id);
    const ai = parseReplyAi(analysis.analysis);
    if (lead) {
      const now = new Date();
      const followUpDays = ai?.follow_up_in_days ?? 3;
      const nextFollowUp = followUpDays > 0 ? new Date(now.getTime() + followUpDays * 86_400_000).toISOString() : null;
      await updateLead(lead.id, {
        status: lead.status === "new" ? "contacted" : lead.status,
        last_contact_at: now.toISOString(),
        next_follow_up_at: nextFollowUp,
      });
    }
  }

  revalidatePath("/reply");
  revalidatePath("/leads");
  revalidatePath("/today");
  return { status: "ok" };
}
