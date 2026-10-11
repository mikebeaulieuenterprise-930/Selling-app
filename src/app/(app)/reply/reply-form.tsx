"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { actionErrorMessage, type ActionErrorCode } from "@/lib/ai/errors";
import type { Lead, LeadChannel } from "@/lib/supabase/types";
import { LEAD_CHANNELS } from "@/lib/supabase/types";
import { Button, Chip, Field, Notice, Select, TextArea } from "@/components/ui";
import { AnalysisCard } from "@/components/analysis-card";
import { IconSparkle } from "@/components/icons";
import { analyzeReplyAction, type AnalyzeResult } from "./actions";

type LeadOption = Pick<Lead, "id" | "name" | "company" | "channel">;

export function ReplyForm({
  leads,
  initialLeadId,
  hasOffer,
}: {
  leads: LeadOption[];
  initialLeadId: string | null;
  hasOffer: boolean;
}) {
  const { t } = useI18n();
  const initialLead = leads.find((l) => l.id === initialLeadId) ?? null;
  const [leadId, setLeadId] = useState<string>(initialLead?.id ?? "");
  const [channel, setChannel] = useState<LeadChannel>((initialLead?.channel as LeadChannel) ?? "sms");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Extract<AnalyzeResult, { status: "ok" }> | null>(null);
  const [error, setError] = useState<ActionErrorCode | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function analyze() {
    setValidation(null);
    setError(null);
    if (!message.trim()) return setValidation(t.reply.needsMessage);
    startTransition(async () => {
      const res = await analyzeReplyAction({ leadId: leadId || null, channel, message });
      if (res.status === "ok") setResult(res);
      else setError(res.code);
    });
  }

  if (result) {
    return (
      <div className="fade-in flex flex-col gap-4">
        <AnalysisCard
          analysisId={result.analysisId}
          ai={result.ai}
          leadName={result.leadName}
          wasSent={false}
          leadMessage={message}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setResult(null);
            setMessage("");
          }}
        >
          {t.reply.newAnalysis}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasOffer ? <Notice tone="warn">{t.reply.needsOffer}</Notice> : null}

      {leads.length > 0 ? (
        <Field label={t.reply.leadLabel} htmlFor="lead">
          <Select
            id="lead"
            value={leadId}
            onChange={(e) => {
              const id = e.target.value;
              setLeadId(id);
              const lead = leads.find((l) => l.id === id);
              if (lead && (LEAD_CHANNELS as readonly string[]).includes(lead.channel)) {
                setChannel(lead.channel as LeadChannel);
              }
            }}
          >
            <option value="">{t.reply.noLead}</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name}
                {lead.company ? ` · ${lead.company}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label={t.reply.channelLabel}>
        <div className="flex flex-wrap gap-2">
          {LEAD_CHANNELS.map((key) => (
            <Chip key={key} selected={channel === key} onClick={() => setChannel(key)}>
              {t.enums.channel[key]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={t.reply.messageLabel} htmlFor="message">
        <TextArea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.reply.messagePlaceholder}
          rows={5}
        />
      </Field>

      {validation ? <Notice tone="warn">{validation}</Notice> : null}
      {error ? <Notice tone="bad">{actionErrorMessage(t, error)}</Notice> : null}

      <Button type="button" onClick={analyze} pending={pending} pendingLabel={t.reply.analyzing} disabled={!hasOffer}>
        <IconSparkle size={18} />
        {t.reply.analyze}
      </Button>
    </div>
  );
}
