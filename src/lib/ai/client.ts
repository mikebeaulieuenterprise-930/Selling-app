import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Modèle par défaut. Voir .env.example pour la clé. */
export const MODEL = "claude-opus-5-5";

export type AiErrorCode = "config" | "refused" | "format" | "api";

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "AiError";
  }
}

let cached: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("config");
  // 90 s : les réponses structurées prennent quelques secondes, jamais des minutes.
  return (cached ??= new Anthropic({ timeout: 90_000, maxRetries: 2 }));
}
