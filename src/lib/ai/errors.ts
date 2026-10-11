import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Codes d'erreur renvoyés par les Server Actions qui appellent l'IA. */
export type ActionErrorCode = "config" | "refused" | "format" | "api" | "validation" | "needs_offer" | "unknown";

export function actionErrorMessage(t: Dictionary, code: ActionErrorCode): string {
  switch (code) {
    case "config":
      return t.common.errorAiKey;
    case "refused":
      return t.common.errorAiRefused;
    case "format":
      return t.common.errorAiFormat;
    case "needs_offer":
      return t.reply.needsOffer;
    default:
      return t.common.errorGeneric;
  }
}
