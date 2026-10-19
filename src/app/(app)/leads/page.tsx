import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDictionary, getTimeZone } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/dictionaries";
import { daysSince } from "@/lib/dates";
import { listLeads } from "@/lib/data/leads";
import { LEAD_STATUSES, isLeadStatus } from "@/lib/supabase/types";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { StatusPill, TemperaturePill } from "@/components/lead-badges";
import { IconChevronRight, IconPlus } from "@/components/icons";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  await requireUser();
  const params = await searchParams;
  const filter = isLeadStatus(params.status) ? params.status : null;
  const [{ t }, timeZone, leads] = await Promise.all([getDictionary(), getTimeZone(), listLeads()]);
  const visible = filter ? leads.filter((l) => l.status === filter) : leads;

  return (
    <div className="flex flex-col gap-5 py-6">
      <PageHeader
        eyebrow={t.nav.leads}
        title={t.leads.title}
        subtitle={t.leads.subtitle}
        action={
          <LinkButton href="/leads/new" size="sm">
            <IconPlus size={16} />
            {t.common.add}
          </LinkButton>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title={t.leads.emptyTitle}
          body={t.leads.emptyBody}
          action={<LinkButton href="/leads/new">{t.leads.add}</LinkButton>}
        />
      ) : (
        <>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            <FilterChip href="/leads" active={!filter} label={`${t.leads.filterAll} · ${leads.length}`} />
            {LEAD_STATUSES.map((status) => {
              const count = leads.filter((l) => l.status === status).length;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={status}
                  href={`/leads?status=${status}`}
                  active={filter === status}
                  label={`${t.enums.status[status]} · ${count}`}
                />
              );
            })}
          </div>

          <ul className="flex flex-col gap-2">
            {visible.map((lead) => {
              const lastTouch = lead.last_inbound_at && (!lead.last_contact_at || lead.last_inbound_at > lead.last_contact_at)
                ? lead.last_inbound_at
                : lead.last_contact_at;
              const days = lastTouch ? daysSince(lastTouch, timeZone) : null;
              return (
                <Card as="li" key={lead.id} className="p-0">
                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 p-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-semibold">{lead.name}</span>
                      <span className="truncate text-xs text-muted">
                        {[lead.company, t.enums.channel[lead.channel as keyof typeof t.enums.channel]].filter(Boolean).join(" · ")}
                        {days !== null ? ` · ${days === 0 ? t.common.today : days === 1 ? t.common.yesterday : fmt(t.common.daysAgo, { n: days })}` : ` · ${t.leads.neverContacted}`}
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <StatusPill status={lead.status} t={t} />
                        <TemperaturePill temperature={lead.temperature} t={t} />
                      </div>
                    </div>
                    <IconChevronRight size={18} className="shrink-0 text-muted" />
                  </Link>
                </Card>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted"
      }`}
    >
      {label}
    </Link>
  );
}
