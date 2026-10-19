import "server-only";
import { AiError } from "./client";
import type { ActionErrorCode } from "./errors";

/** Transforme une exception en code d'erreur sûr à renvoyer au client. */
export function toActionError(err: unknown): ActionErrorCode {
  if (err instanceof AiError) {
    // Le détail reste dans les journaux serveur (Vercel → Logs), pas dans l'interface.
    console.error(`[ai] ${err.code}: ${err.message}`);
    return err.code;
  }
  console.error("[action]", err);
  return "unknown";
}
