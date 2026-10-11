import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDictionary, getTimeZone } from "@/lib/i18n/server";
import { formatShortDate } from "@/lib/dates";
import { parseReplyAi } from "@/lib/ai/schemas";
import { getLead } from "@/lib/data/leads";
import { listSegments } from "@/lib/data/segments";
import { listAnalysesForLead } from "@/lib/data/analyses";
import { Card, Eyebrow, LinkButton, PageHeader, Pill } from "@/components/ui";
import { StatusPill, TemperaturePill } from "@/components/lead-badges";
import { AnalysisCard, temperatureTone } from "@/components/analysis-card";
import { IconArrowLeft, IconChevronDown, IconSparkle } from "@/components/icons";
import { LeadForm } from "../lead-form";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  await requireUser();
  const { id } = await params;
  const [{ locale, t }, timeZone, lead, segments, analyses] = await Promise.all([
    getDictionary(),
    getTimeZone(),
    getLead(id),
    listSegments(),
    listAnalysesForLead(id),
  ]);
  if (!lead) notFound();

  const segment = segments.find((s) => s.id === lead.segment_id);

  return (
    <div className="flex flex-col gap-5 py-6">
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm font-medium text-muted">
        <IconArrowLeft size={16} />
        {t.leads.title}
      </Link>

      <PageHeader
        eyebrow={segment?.name ?? t.leads.noSegment}
        title={lead.name}
        subtitle={[lead.company, lead.role].filter(Boolean).join(" · ") || undefined}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill status={lead.status} t={t} />
        <TemperaturePill temperature={lead.temperature} t={t} />
        <Pill tone="neutral">{t.enums.channel[lead.channel as keyof typeof t.enums.channel] ?? lead.channel}</Pill>
      </div>

      <Card className="grid grid-cols-2 gap-3 text-sm">
        <Meta label={t.leads.lastContact} value={lead.last_contact_at ? formatShortDate(lead.last_contact_at, locale, timeZone) : t.leads.neverContacted} />
        <Meta label={t.leads.lastInbound} value={lead.last_inbound_at ? formatShortDate(lead.last_inbound_at, locale, timeZone) : "—"} />
        <Meta label={t.leads.nextFollowUp} value={lead.next_follow_up_at ? formatShortDate(lead.next_follow_up_at, locale, timeZone) : "—"} />
        {lead.phone ? <Meta label={t.leads.phone} value={<span className="select-all">{lead.phone}</span>} /> : null}
        {lead.email ? <Meta label={t.leads.email} value={<span className="select-all break-all">{lead.email}</span>} /> : null}
      </Card>

      <LinkButton href={`/reply?lead=${encodeURIComponent(lead.id)}`} variant="soft">
        <IconSparkle size={18} />
        {t.leads.analyzeReply}
      </LinkButton>

      <section className="flex flex-col gap-3">
        <Eyebrow>{t.leads.analyses}</Eyebrow>
        {analyses.length === 0 ? (
          <p className="text-sm text-muted">{t.leads.noAnalyses}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {analyses.map((row) => {
              const ai = parseReplyAi(row.analysis);
              if (!ai) return null;
              return (
                <Card as="li" key={row.id} className="p-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                      <span className="min-w-0 flex-1 truncate text-sm text-muted">{row.lead_message}</span>
                      <Pill tone={temperatureTone(ai.temperature)}>{t.enums.temperature[ai.temperature]}</Pill>
                      <span className="text-[11px] text-muted">{formatShortDate(row.created_at, locale, timeZone)}</span>
                      <IconChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-line p-4">
                      <AnalysisCard analysisId={row.id} ai={ai} leadName={lead.name} wasSent={row.was_sent} />
                    </div>
                  </details>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>{t.common.edit}</Eyebrow>
        <LeadForm segments={segments.map((s) => ({ id: s.id, name: s.name }))} lead={lead} />
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
