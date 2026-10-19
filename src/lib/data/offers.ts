import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Inserts, Json, Offer } from "@/lib/supabase/types";

export async function getOffer(): Promise<Offer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("offers").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export type OfferValues = Omit<Inserts<"offers">, "id" | "user_id" | "ai" | "created_at" | "updated_at">;

/** Un seul profil d'offre par utilisateur : on écrase le précédent. */
export async function upsertOffer(userId: string, values: OfferValues, ai: Json | null): Promise<Offer> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .upsert({ ...values, user_id: userId, ai }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function setOfferAi(offerId: string, ai: Json): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("offers").update({ ai }).eq("id", offerId);
  if (error) throw error;
}
