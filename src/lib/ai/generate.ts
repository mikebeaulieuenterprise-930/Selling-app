import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import type { Offer } from "@/lib/supabase/types";
import type { NewSegment } from "@/lib/data/segments";
import { AiError, MODEL, anthropic } from "./client";
import { offerPrompt, replyPrompt, segmentsPrompt, systemPrompt, type LeadContext, type OfferInput } from "./prompts";
import {
  OfferAiSchema,
  ReplyAiSchema,
  SegmentsAiSchema,
  clampScore,
  totalScore,
  type OfferAi,
  type ReplyAi,
} from "./schemas";

/**
 * Le repli serveur (`fallbacks: "default"`) relance la demande sur un autre
 * modèle si le premier refuse pour une raison de sécurité. Si l'API rejette
 * ce paramètre (bêta), on le désactive pour le reste de la vie du processus.
 */
let fallbacksSupported = true;

async function structured<S extends z.ZodType>(schema: S, system: string, user: string): Promise<z.infer<S>> {
  const client = anthropic();

  const base = {
    model: MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: "user" as const, content: user }],
    output_config: { format: betaZodOutputFormat(schema), effort: "medium" as const },
  };

  let response;
  try {
    response = fallbacksSupported
      ? await client.beta.messages.parse({
          ...base,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        })
      : await client.beta.messages.parse(base);
  } catch (err) {
    if (err instanceof Anthropic.BadRequestError && fallbacksSupported) {
      fallbacksSupported = false;
      return structured(schema, system, user);
    }
    if (err instanceof Anthropic.AuthenticationError) throw new AiError("config", err.message);
    if (err instanceof Anthropic.APIError) throw new AiError("api", `${err.status ?? ""} ${err.message}`.trim());
    throw err;
  }

  if (response.stop_reason === "refusal") throw new AiError("refused");
  if (response.stop_reason === "max_tokens") throw new AiError("format", "max_tokens");
  if (!response.parsed_output) throw new AiError("format");
  return response.parsed_output;
}

export async function generateOfferAi(input: OfferInput, locale: Locale): Promise<OfferAi> {
  const ai = await structured(OfferAiSchema, systemPrompt(locale), offerPrompt(input, locale));
  return {
    ...ai,
    value_props: ai.value_props.filter(Boolean).slice(0, 3),
    likely_objections: ai.likely_objections.slice(0, 3),
  };
}

export async function generateSegments(offer: Offer, offerAi: OfferAi | null, locale: Locale): Promise<NewSegment[]> {
  const { segments } = await structured(SegmentsAiSchema, systemPrompt(locale), segmentsPrompt(offer, offerAi, locale));
  const cleaned: NewSegment[] = segments.slice(0, 5).map((s) => ({
    name: s.name.trim(),
    description: s.description.trim(),
    need_score: clampScore(s.need_score),
    budget_score: clampScore(s.budget_score),
    reach_score: clampScore(s.reach_score),
    total_score: totalScore(s),
    reason: s.reason.trim(),
    where_to_find: s.where_to_find.filter(Boolean).slice(0, 6),
    buying_signals: s.buying_signals.filter(Boolean).slice(0, 6),
    first_message_angle: s.first_message_angle.trim(),
  }));
  if (cleaned.length === 0) throw new AiError("format", "no segments");
  // Du plus prometteur au moins prometteur, quoi qu'en dise l'ordre du modèle.
  return cleaned.sort((a, b) => b.total_score - a.total_score);
}

export async function analyzeReply(
  args: { offer: Offer; offerAi: OfferAi | null; lead: LeadContext | null; channel: string; message: string },
  locale: Locale,
): Promise<ReplyAi> {
  const ai = await structured(ReplyAiSchema, systemPrompt(locale), replyPrompt(args, locale));
  return {
    ...ai,
    reply_draft: ai.reply_draft.trim(),
    follow_up_in_days: Math.max(0, Math.min(30, Math.round(ai.follow_up_in_days))),
  };
}
