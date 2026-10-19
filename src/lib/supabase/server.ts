import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Client Supabase côté serveur (Server Components, Server Actions, Route Handlers).
 * À créer à chaque requête, jamais partagé.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : impossible d'écrire des cookies ici.
          // Le proxy (src/proxy.ts) rafraîchit la session, donc on peut ignorer.
        }
      },
    },
  });
}
