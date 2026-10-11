import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Inserts, ReplyAnalysis } from "@/lib/supabase/types";

export async function listRecentAnalyses(limit = 10): Promise<ReplyAnalysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reply_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function listAnalysesForLead(leadId: string): Promise<ReplyAnalysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reply_analyses")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAnalysis(id: string): Promise<ReplyAnalysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reply_analyses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAnalysis(
  userId: string,
  values: Omit<Inserts<"reply_analyses">, "user_id">,
): Promise<ReplyAnalysis> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reply_analyses")
    .insert({ ...values, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markAnalysisSent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reply_analyses").update({ was_sent: true }).eq("id", id);
  if (error) throw error;
}
