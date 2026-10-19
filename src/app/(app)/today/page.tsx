import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDictionary, getTimeZone } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/dictionaries";
import { formatLongDate, weekdayLetter } from "@/lib/dates";
import { getProfile } from "@/lib/data/profiles";
import { getOffer } from "@/lib/data/offers";
import { listSegments } from "@/lib/data/segments";
import { listLeads } from "@/lib/data/leads";
import { getStreak, syncMission } from "@/lib/data/tasks";
import { isTaskKind, taskHref, taskLabel } from "@/lib/mission";
import { Card, Eyebrow, PageHeader } from "@/components/ui";
import { IconFlame } from "@/components/icons";
import { TaskList, type TaskItem } from "./task-list";

export const metadata: Metadata = { title: "Aujourd'hui" };

export default async function TodayPage() {
  const user = await requireUser();
  const [{ locale, t }, timeZone, profile, offer, segments, leads] = await Promise.all([
    getDictionary(),
    getTimeZone(),
    getProfile(),
    getOffer(),
    listSegments(),
    listLeads(),
  ]);

  // Première visite : on commence par l'offre, tout le reste en dépend.
  if (!offer && !profile?.onboarding_done) redirect("/onboarding");

  const [{ date, tasks }, { streak, last7 }] = await Promise.all([
    syncMission({ userId: user.id, timeZone, hasOffer: Boolean(offer), segments, leads }),
    getStreak(timeZone),
  ]);

  const items: TaskItem[] = tasks.flatMap((task) => {
    if (!isTaskKind(task.kind)) return [];
    const { title, detail } = taskLabel(t, task.kind, task.payload);
    return [{ id: task.id, title, detail, minutes: task.minutes, href: taskHref(task.kind, task.ref_id, task.payload), done: Boolean(task.done_at) }];
  });
  const remaining = items.filter((i) => !i.done);
  const minutes = remaining.reduce((sum, i) => sum + i.minutes, 0);

  const headline =
    items.length === 0
      ? t.today.headlineEmpty
      : remaining.length === 0
        ? t.today.headlineDone
        : remaining.length === 1
          ? t.today.headlineOne
          : fmt(t.today.headline, { n: remaining.length });

  const active = leads.filter((l) => l.status !== "won" && l.status !== "lost");
  const counts = {
    contacted: leads.filter((l) => l.status === "contacted").length,
    replied: leads.filter((l) => l.status === "replied").length,
    call_booked: leads.filter((l) => l.status === "call_booked").length,
    won: leads.filter((l) => l.status === "won").length,
  };

  return (
    <div className="flex flex-col gap-6 py-6">
      <PageHeader
        eyebrow={`${t.today.greeting} · ${formatLongDate(date, locale, timeZone)}`}
        title={headline}
        subtitle={remaining.length > 0 ? fmt(t.today.estimate, { n: Math.max(1, minutes) }) : items.length === 0 ? t.today.emptyBody : t.today.allDoneBody}
      />

      {items.length > 0 ? <TaskList tasks={items} /> : null}

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconFlame size={20} className={streak > 0 ? "text-spark" : "text-muted"} />
            <span className="font-display text-lg font-bold">
              {t.today.streak} ·{" "}
              {streak === 0 ? t.today.streakZero : streak === 1 ? t.today.streakDay : fmt(t.today.streakDays, { n: streak })}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {last7.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div
                className={`h-7 w-full rounded-md ${day.done ? "bg-spark" : "bg-line"}`}
                aria-label={`${day.date}${day.done ? " ✓" : ""}`}
              />
              <span className="text-[10px] font-medium uppercase text-muted">{weekdayLetter(day.date, locale)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">{t.today.streakHint}</p>
      </Card>

      {leads.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <Eyebrow>{t.today.pipeline}</Eyebrow>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label={t.enums.status.contacted} value={counts.contacted} />
            <Stat label={t.enums.status.replied} value={counts.replied} />
            <Stat label={t.enums.status.call_booked} value={counts.call_booked} />
            <Stat label={t.enums.status.won} value={counts.won} />
          </div>
          <p className="text-xs text-muted">
            {active.length} {t.nav.leads.toLowerCase()} · {t.today.pipelineHint}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col rounded-xl bg-bubble-in px-1 py-2">
      <span className="font-display text-xl font-extrabold tabular-nums">{value}</span>
      <span className="truncate text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}
