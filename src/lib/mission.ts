// La Mission du jour : règles pures, sans accès à la base, pour rester testables.

import { daysSince } from "@/lib/dates";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/dictionaries";
import type { Lead, Segment } from "@/lib/supabase/types";

export const TASK_KINDS = ["onboarding", "radar", "reply", "follow_up", "first_contact", "add_leads"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export type MissionTask = {
  kind: TaskKind;
  ref_id: string;
  minutes: number;
  payload: Record<string, string | number> | null;
};

const MAX_TASKS = 6;
const MAX_PER_KIND = 3;
/** Après ce nombre de jours sans réponse, on propose une relance. */
const FOLLOW_UP_AFTER_DAYS = 3;
/** En dessous de ce nombre de leads actifs, on pousse à en ajouter. */
const MIN_ACTIVE_LEADS = 5;

export function buildMission(input: {
  hasOffer: boolean;
  segments: Segment[];
  leads: Lead[];
  timeZone: string;
  now?: Date;
}): MissionTask[] {
  const { hasOffer, segments, leads, timeZone } = input;
  const now = input.now ?? new Date();
  const tasks: MissionTask[] = [];

  if (!hasOffer) {
    return [{ kind: "onboarding", ref_id: "", minutes: 5, payload: null }];
  }
  if (segments.length === 0) {
    tasks.push({ kind: "radar", ref_id: "", minutes: 3, payload: null });
  }

  // Le lead a parlé en dernier : c'est à toi.
  const toReply = leads.filter(
    (l) =>
      l.status === "replied" &&
      l.last_inbound_at &&
      (!l.last_contact_at || l.last_inbound_at > l.last_contact_at),
  );
  for (const lead of toReply.slice(0, MAX_PER_KIND)) {
    tasks.push({ kind: "reply", ref_id: lead.id, minutes: 3, payload: { name: lead.name } });
  }
  const replyIds = new Set(toReply.map((l) => l.id));

  // Tu as parlé en dernier et ça fait un moment : relance.
  const toFollowUp = leads
    .filter((l) => (l.status === "contacted" || l.status === "replied") && !replyIds.has(l.id))
    .filter((l) => {
      if (l.next_follow_up_at) return new Date(l.next_follow_up_at) <= now;
      return l.last_contact_at ? daysSince(l.last_contact_at, timeZone, now) >= FOLLOW_UP_AFTER_DAYS : false;
    })
    .sort((a, b) => (a.last_contact_at ?? "").localeCompare(b.last_contact_at ?? ""));
  for (const lead of toFollowUp.slice(0, MAX_PER_KIND)) {
    const days = lead.last_contact_at ? daysSince(lead.last_contact_at, timeZone, now) : 0;
    tasks.push({ kind: "follow_up", ref_id: lead.id, minutes: 2, payload: { name: lead.name, days } });
  }

  // Jamais contacté : premier message.
  const fresh = leads.filter((l) => l.status === "new");
  for (const lead of fresh.slice(0, MAX_PER_KIND)) {
    tasks.push({
      kind: "first_contact",
      ref_id: lead.id,
      minutes: 3,
      payload: { name: lead.name, company: lead.company ?? "" },
    });
  }

  const active = leads.filter((l) => l.status !== "won" && l.status !== "lost");
  if (segments.length > 0 && active.length < MIN_ACTIVE_LEADS) {
    const priority = segments.find((s) => s.is_priority) ?? segments[0];
    tasks.push({ kind: "add_leads", ref_id: "", minutes: 4, payload: { segment: priority.id } });
  }

  return tasks.slice(0, MAX_TASKS);
}

/** Où mène une tâche quand on la touche. */
export function taskHref(kind: TaskKind, refId: string, payload: unknown): string {
  switch (kind) {
    case "onboarding":
      return "/onboarding";
    case "radar":
      return "/radar";
    case "reply":
    case "follow_up":
      return `/reply?lead=${encodeURIComponent(refId)}`;
    case "first_contact":
      return `/leads/${encodeURIComponent(refId)}`;
    case "add_leads": {
      const segment = payloadString(payload, "segment");
      return segment ? `/leads/new?segment=${encodeURIComponent(segment)}` : "/leads/new";
    }
  }
}

export function taskLabel(
  t: Dictionary,
  kind: TaskKind,
  payload: unknown,
): { title: string; detail: string | null } {
  const name = payloadString(payload, "name") ?? "";
  switch (kind) {
    case "onboarding":
      return { title: t.tasks.onboarding, detail: null };
    case "radar":
      return { title: t.tasks.radar, detail: null };
    case "add_leads":
      return { title: t.tasks.add_leads, detail: null };
    case "reply":
      return { title: fmt(t.tasks.reply, { name }), detail: t.tasks.replyDetail };
    case "follow_up":
      return {
        title: fmt(t.tasks.follow_up, { name }),
        detail: fmt(t.tasks.follow_upDetail, { days: payloadString(payload, "days") ?? "0" }),
      };
    case "first_contact": {
      const company = payloadString(payload, "company");
      return {
        title: fmt(t.tasks.first_contact, { name }),
        detail: company ? fmt(t.tasks.first_contactDetail, { company }) : null,
      };
    }
  }
}

export function isTaskKind(value: unknown): value is TaskKind {
  return typeof value === "string" && (TASK_KINDS as readonly string[]).includes(value);
}

function payloadString(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * Jours consécutifs avec au moins une action faite, en remontant depuis
 * aujourd'hui (ou hier si rien n'est encore fait aujourd'hui).
 */
export function computeStreak(doneDates: Set<string>, today: string, previousDay: (d: string) => string): number {
  let cursor = doneDates.has(today) ? today : previousDay(today);
  let streak = 0;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
