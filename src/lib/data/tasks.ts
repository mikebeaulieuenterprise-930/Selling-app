import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DailyTask, Json } from "@/lib/supabase/types";
import { addDays, todayIn } from "@/lib/dates";
import { buildMission, computeStreak, type MissionTask } from "@/lib/mission";
import type { Lead, Segment } from "@/lib/supabase/types";

export async function getTasksForDate(date: string): Promise<DailyTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("task_date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Calcule la mission du jour et la synchronise avec la base :
 * - les nouvelles tâches sont créées,
 * - une tâche non faite dont la raison a disparu est marquée faite
 *   (tu as relancé le lead ailleurs ? c'est compté).
 */
export async function syncMission(input: {
  userId: string;
  timeZone: string;
  hasOffer: boolean;
  segments: Segment[];
  leads: Lead[];
}): Promise<{ date: string; tasks: DailyTask[] }> {
  const supabase = await createClient();
  const date = todayIn(input.timeZone);
  const desired = buildMission(input);
  const existing = await getTasksForDate(date);

  const key = (t: { kind: string; ref_id: string }) => `${t.kind}:${t.ref_id}`;
  const existingKeys = new Set(existing.map(key));
  const desiredKeys = new Set(desired.map(key));

  const toInsert = desired.filter((t) => !existingKeys.has(key(t)));
  if (toInsert.length > 0) {
    const { error } = await supabase.from("daily_tasks").upsert(
      toInsert.map((t: MissionTask) => ({
        user_id: input.userId,
        task_date: date,
        kind: t.kind,
        ref_id: t.ref_id,
        minutes: t.minutes,
        payload: t.payload as Json | null,
      })),
      { onConflict: "user_id,task_date,kind,ref_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  const stale = existing.filter((t) => !t.done_at && !desiredKeys.has(key(t)));
  if (stale.length > 0) {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ done_at: new Date().toISOString() })
      .in(
        "id",
        stale.map((t) => t.id),
      );
    if (error) throw error;
  }

  const tasks = toInsert.length > 0 || stale.length > 0 ? await getTasksForDate(date) : existing;
  // Ordre de la mission : celui des règles, puis les tâches restantes.
  const order = new Map(desired.map((t, i) => [key(t), i]));
  tasks.sort((a, b) => (order.get(key(a)) ?? 99) - (order.get(key(b)) ?? 99));
  return { date, tasks };
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_tasks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

/** Série en cours et les 7 derniers jours (pour la bande). */
export async function getStreak(timeZone: string): Promise<{ streak: number; last7: { date: string; done: boolean }[] }> {
  const supabase = await createClient();
  const today = todayIn(timeZone);
  const since = addDays(today, -400);
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("task_date")
    .not("done_at", "is", null)
    .gte("task_date", since);
  if (error) throw error;

  const doneDates = new Set(data.map((row) => row.task_date));
  const streak = computeStreak(doneDates, today, (d) => addDays(d, -1));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return { date, done: doneDates.has(date) };
  });
  return { streak, last7 };
}
