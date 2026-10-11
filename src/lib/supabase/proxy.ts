import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { HOME_PATH } from "@/lib/config";
import { supabaseEnv } from "./env";
import type { Database } from "./types";

/** Chemins accessibles sans être connecté. */
const PUBLIC_PREFIXES = ["/login", "/auth/", "/icons/", "/manifest.webmanifest", "/icon", "/apple-icon"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Rafraîchit la session Supabase à chaque requête et protège les pages privées.
 * Pattern officiel @supabase/ssr : les cookies rafraîchis doivent être écrits
 * à la fois sur la requête (pour le rendu) et sur la réponse (pour le navigateur).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Ne rien mettre entre createServerClient et getClaims : c'est ce qui
  // déclenche le rafraîchissement du jeton.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (!isSignedIn && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    if (pathname !== "/") redirectUrl.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
  }

  if (isSignedIn && (pathname === "/login" || pathname === "/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = HOME_PATH;
    redirectUrl.search = "";
    return withCookies(NextResponse.redirect(redirectUrl), supabaseResponse);
  }

  return supabaseResponse;
}

/** Copie les cookies rafraîchis sur une nouvelle réponse (redirection). */
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}
