"use server";

import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";
import { getOrigin } from "@/lib/request";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; code: "invalid_email" | "send_failed" | "config"; detail?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!EMAIL_RE.test(email)) return { status: "error", code: "invalid_email" };

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { status: "error", code: "config" };
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("[login] signInWithOtp failed:", error.message);
    return { status: "error", code: "send_failed", detail: error.message };
  }
  return { status: "sent", email };
}
