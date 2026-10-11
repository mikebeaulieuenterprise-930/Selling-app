import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { getOffer } from "@/lib/data/offers";
import { listSegments } from "@/lib/data/segments";
import { EmptyState, LinkButton, Notice, PageHeader } from "@/components/ui";
import { RunRadarButton } from "./run-radar-button";
import { SegmentCard } from "./segment-card";

export const metadata: Metadata = { title: "Radar" };
export const maxDuration = 60;

export default async function RadarPage() {
  await requireUser();
  const [{ t }, offer, segments] = await Promise.all([getDictionary(), getOffer(), listSegments()]);

  return (
    <div className="flex flex-col gap-6 py-6">
      <PageHeader eyebrow={t.nav.radar} title={t.radar.title} subtitle={t.radar.subtitle} />

      {!offer ? (
        <EmptyState
          title={t.radar.emptyTitle}
          body={t.radar.needsOffer}
          action={<LinkButton href="/onboarding">{t.radar.goOnboarding}</LinkButton>}
        />
      ) : segments.length === 0 ? (
        <EmptyState
          title={t.radar.emptyTitle}
          body={t.radar.emptyBody}
          action={<RunRadarButton label={t.radar.run} />}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {segments.map((segment, index) => (
              <SegmentCard key={segment.id} segment={segment} rank={index} />
            ))}
          </ul>
          <Notice>{t.radar.phase2}</Notice>
          <div className="flex flex-col gap-1.5">
            <RunRadarButton variant="ghost" label={t.radar.rerun} />
            <p className="px-1 text-xs text-muted">{t.radar.rerunHint}</p>
          </div>
        </>
      )}
    </div>
  );
}
