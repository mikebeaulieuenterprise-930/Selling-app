import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";

/**
 * Cible du lien magique. Supabase y renvoie soit `code` (flux PKCE, le défaut
 * avec @supabase/ssr), soit `token_hash` + `type` (gabarit de courriel personnalisé).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  let errorMessage: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorMessage = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    errorMessage = error?.message ?? null;
  } else {
    errorMessage = "missing code";
  }

  if (errorMessage) {
    console.error("[auth/callback]", errorMessage);
    return NextResponse.redirect(new URL("/login?error=link_invalid", request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
