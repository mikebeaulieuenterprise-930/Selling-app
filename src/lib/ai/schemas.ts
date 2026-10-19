// Formats de sortie structurée demandés à l'IA. Les descriptions guident le modèle ;
// les contraintes numériques (0-100, « exactement 3 ») sont décrites en texte parce que
// la sortie structurée ne supporte pas minimum/maximum, puis vérifiées en code.

import { z } from "zod";

export const OBJECTION_TYPES = [
  "price",
  "timing",
  "status_quo",
  "trust",
  "no_need",
  "authority",
  "competitor",
  "info_request",
  "interested",
  "ghosting",
  "other",
] as const;
export type ObjectionType = (typeof OBJECTION_TYPES)[number];

export const OfferAiSchema = z.object({
  icp_summary: z.string().describe("The ideal customer in one precise sentence (who, size, context)."),
  positioning: z
    .string()
    .describe("Two sentences: for whom, which problem, what makes this different. No hype."),
  pitch: z.string().describe("One spoken sentence, 25 words max, no superlatives."),
  call_opener: z
    .string()
    .describe("First two sentences of a cold call, natural, ending with an open question."),
  value_props: z
    .array(z.string())
    .describe("Exactly 3 concrete arguments, one sentence each. No invented numbers."),
  likely_objections: z
    .array(
      z.object({
        objection: z.string().describe("The objection as the prospect would say it."),
        answer: z.string().describe("A calm 1-2 sentence answer that ends with a question."),
      }),
    )
    .describe("Exactly 3 objections this offer will hear most."),
});
export type OfferAi = z.infer<typeof OfferAiSchema>;

export const SegmentAiSchema = z.object({
  name: z.string().describe("Short segment name, 2-6 words."),
  description: z.string().describe("Who they are, one sentence."),
  need_score: z.number().int().describe("0-100: how frequent and painful the problem is for them."),
  budget_score: z.number().int().describe("0-100: can they pay this price without a heavy process?"),
  reach_score: z
    .number()
    .int()
    .describe("0-100: how easy they are to find and reach with the user's channels."),
  reason: z.string().describe("Why this score, one or two sentences, concrete."),
  where_to_find: z.array(z.string()).describe("3-5 precise places to find them (directories, maps, groups, events, public registries)."),
  buying_signals: z.array(z.string()).describe("3-5 observable signals that they need this now."),
  first_message_angle: z.string().describe("The angle of the first message in one sentence, not the message itself."),
});

export const SegmentsAiSchema = z.object({
  segments: z.array(SegmentAiSchema).describe("3 to 5 segments, from most to least promising."),
});
export type SegmentAi = z.infer<typeof SegmentAiSchema>;

export const ReplyAiSchema = z.object({
  temperature: z.enum(["hot", "warm", "cold"]).describe("How close this lead is to buying."),
  objection_type: z.enum(OBJECTION_TYPES).describe("The real objection behind the words."),
  what_they_mean: z.string().describe("What the lead really means, 1-2 sentences, in the user's language."),
  recommended_next_step: z
    .string()
    .describe("The one next step to aim for, one sentence, in the user's language."),
  reply_draft: z
    .string()
    .describe("The reply to send, ready to paste, in the lead's language, respecting the channel's length."),
  follow_up_in_days: z
    .number()
    .int()
    .describe("Days to wait before following up if the lead goes silent (0 when a call is booked)."),
  confidence: z.enum(["low", "medium", "high"]).describe("How sure you are about the reading."),
});
export type ReplyAi = z.infer<typeof ReplyAiSchema>;

export function parseOfferAi(value: unknown): OfferAi | null {
  const result = OfferAiSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parseReplyAi(value: unknown): ReplyAi | null {
  const result = ReplyAiSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Besoin 40 %, budget 30 %, joignabilité 30 %. */
export function totalScore(s: { need_score: number; budget_score: number; reach_score: number }): number {
  return clampScore(
    clampScore(s.need_score) * 0.4 + clampScore(s.budget_score) * 0.3 + clampScore(s.reach_score) * 0.3,
  );
}
