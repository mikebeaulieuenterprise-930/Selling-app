import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Inserts, Lead, Updates } from "@/lib/supabase/types";

export async function listLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createLead(userId: string, values: Omit<Inserts<"leads">, "user_id">): Promise<Lead> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...values, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateLead(id: string, patch: Updates<"leads">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
