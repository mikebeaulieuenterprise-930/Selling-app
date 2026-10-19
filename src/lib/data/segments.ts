import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Segment } from "@/lib/supabase/types";

export async function listSegments(): Promise<Segment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("segments")
    .select("*")
    .order("rank", { ascending: true });
  if (error) throw error;
  return data;
}

export type NewSegment = {
  name: string;
  description: string;
  need_score: number;
  budget_score: number;
  reach_score: number;
  total_score: number;
  reason: string;
  where_to_find: string[];
  buying_signals: string[];
  first_message_angle: string;
};

/** Remplace tous les segments de l'utilisateur ; le premier devient prioritaire. */
export async function replaceSegments(
  userId: string,
  offerId: string,
  segments: NewSegment[],
): Promise<Segment[]> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase.from("segments").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  const rows = segments.map((s, index) => ({
    ...s,
    user_id: userId,
    offer_id: offerId,
    rank: index,
    is_priority: index === 0,
  }));
  const { data, error } = await supabase.from("segments").insert(rows).select("*");
  if (error) throw error;
  return data;
}

export async function setPrioritySegment(userId: string, segmentId: string): Promise<void> {
  const supabase = await createClient();
  const { error: clearError } = await supabase
    .from("segments")
    .update({ is_priority: false })
    .eq("user_id", userId);
  if (clearError) throw clearError;
  const { error } = await supabase.from("segments").update({ is_priority: true }).eq("id", segmentId);
  if (error) throw error;
}
