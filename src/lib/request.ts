import "server-only";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/config";

/**
 * Origine publique de la requête courante (ex. https://closer.vercel.app).
 * NEXT_PUBLIC_SITE_URL gagne quand elle est définie ; sinon on lit les en-têtes,
 * ce qui marche aussi sur les déploiements de prévisualisation Vercel.
 */
export async function getOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return siteUrl();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
