import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Updates } from "@/lib/supabase/types";

/** Le profil de l'utilisateur connecté (la RLS ne renvoie que le sien). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, patch: Updates<"profiles">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}
