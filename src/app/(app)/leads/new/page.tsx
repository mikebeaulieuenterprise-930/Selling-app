import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { listSegments } from "@/lib/data/segments";
import { PageHeader } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";
import { LeadForm } from "../lead-form";

export const metadata: Metadata = { title: "Nouveau lead" };

export default async function NewLeadPage({ searchParams }: PageProps<"/leads/new">) {
  await requireUser();
  const params = await searchParams;
  const defaultSegmentId = typeof params.segment === "string" ? params.segment : null;
  const [{ t }, segments] = await Promise.all([getDictionary(), listSegments()]);

  return (
    <div className="flex flex-col gap-5 py-6">
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm font-medium text-muted">
        <IconArrowLeft size={16} />
        {t.leads.title}
      </Link>
      <PageHeader title={t.leads.newTitle} />
      <LeadForm
        segments={segments.map((s) => ({ id: s.id, name: s.name }))}
        defaultSegmentId={segments.some((s) => s.id === defaultSegmentId) ? defaultSegmentId : null}
      />
    </div>
  );
}
