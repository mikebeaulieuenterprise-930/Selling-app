import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary, getTimeZone } from "@/lib/i18n/server";
import { formatShortDate } from "@/lib/dates";
import { parseReplyAi } from "@/lib/ai/schemas";
import { getOffer } from "@/lib/data/offers";
import { listLeads } from "@/lib/data/leads";
import { listRecentAnalyses } from "@/lib/data/analyses";
import { Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { AnalysisCard, temperatureTone } from "@/components/analysis-card";
import { IconChevronDown } from "@/components/icons";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Répondre" };
export const maxDuration = 60;

export default async function ReplyPage({ searchParams }: PageProps<"/reply">) {
  await requireUser();
  const params = await searchParams;
  const initialLeadId = typeof params.lead === "string" ? params.lead : null;

  const [{ locale, t }, timeZone, offer, leads, analyses] = await Promise.all([
    getDictionary(),
    getTimeZone(),
    getOffer(),
    listLeads(),
    listRecentAnalyses(10),
  ]);
  const leadsById = new Map(leads.map((l) => [l.id, l]));

  return (
    <div className="flex flex-col gap-6 py-6">
      <PageHeader eyebrow={t.nav.reply} title={t.reply.title} subtitle={t.reply.subtitle} />

      <ReplyForm
        leads={leads.map((l) => ({ id: l.id, name: l.name, company: l.company, channel: l.channel }))}
        initialLeadId={initialLeadId}
        hasOffer={Boolean(offer)}
      />

      <section className="flex flex-col gap-3">
        <Eyebrow>{t.reply.history}</Eyebrow>
        {analyses.length === 0 ? (
          <p className="text-sm text-muted">{t.reply.historyEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {analyses.map((row) => {
              const ai = parseReplyAi(row.analysis);
              if (!ai) return null;
              const lead = row.lead_id ? leadsById.get(row.lead_id) : undefined;
              return (
                <Card as="li" key={row.id} className="p-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold">{lead?.name ?? t.reply.noLead}</span>
                        <span className="truncate text-xs text-muted">{row.lead_message}</span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Pill tone={temperatureTone(ai.temperature)}>{t.enums.temperature[ai.temperature]}</Pill>
                        <span className="text-[11px] text-muted">{formatShortDate(row.created_at, locale, timeZone)}</span>
                      </div>
                      <IconChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-line p-4">
                      <AnalysisCard analysisId={row.id} ai={ai} leadName={lead?.name ?? null} wasSent={row.was_sent} />
                    </div>
                  </details>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
