"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Segment } from "@/lib/supabase/types";
import { Button, Card, Eyebrow, Meter, Pill, type Tone } from "@/components/ui";
import { IconChevronDown } from "@/components/icons";
import { setPriorityAction } from "./actions";

export function scoreTone(score: number): Tone {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}

export function SegmentCard({ segment, rank }: { segment: Segment; rank: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(rank === 0);

  return (
    <Card as="li" className={`flex flex-col gap-3 ${segment.is_priority ? "border-accent/50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold leading-tight">{segment.name}</h2>
            {segment.is_priority ? <Pill tone="accent">{t.radar.priority}</Pill> : null}
          </div>
          {segment.description ? <p className="text-sm text-muted">{segment.description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className={`font-display text-3xl font-extrabold tabular-nums ${
            scoreTone(segment.total_score) === "good" ? "text-good" : scoreTone(segment.total_score) === "warn" ? "text-warn" : "text-bad"
          }`}>
            {segment.total_score}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted">{t.radar.score}</span>
        </div>
      </div>

      {segment.reason ? (
        <p className="border-l-2 border-spark pl-3 text-sm leading-relaxed">{segment.reason}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 self-start text-sm font-semibold text-accent"
      >
        {open ? t.radar.lessDetails : t.radar.moreDetails}
        <IconChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="fade-in flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Meter label={t.radar.need} value={segment.need_score} tone={scoreTone(segment.need_score)} />
            <Meter label={t.radar.budget} value={segment.budget_score} tone={scoreTone(segment.budget_score)} />
            <Meter label={t.radar.reach} value={segment.reach_score} tone={scoreTone(segment.reach_score)} />
          </div>

          {segment.where_to_find.length ? (
            <div className="flex flex-col gap-1.5">
              <Eyebrow>{t.radar.whereToFind}</Eyebrow>
              <ul className="flex flex-col gap-1 text-sm">
                {segment.where_to_find.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {segment.buying_signals.length ? (
            <div className="flex flex-col gap-1.5">
              <Eyebrow>{t.radar.signals}</Eyebrow>
              <ul className="flex flex-col gap-1 text-sm">
                {segment.buying_signals.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-spark">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {segment.first_message_angle ? (
            <div className="flex flex-col gap-1.5">
              <Eyebrow>{t.radar.angle}</Eyebrow>
              <p className="rounded-xl bg-bubble-in px-3 py-2 text-sm">{segment.first_message_angle}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {!segment.is_priority ? (
              <form action={setPriorityAction}>
                <input type="hidden" name="id" value={segment.id} />
                <Button type="submit" variant="soft" size="sm" className="w-full">
                  {t.radar.setPriority}
                </Button>
              </form>
            ) : null}
            <Link
              href={`/leads/new?segment=${encodeURIComponent(segment.id)}`}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold"
            >
              {t.radar.addLead}
            </Link>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
