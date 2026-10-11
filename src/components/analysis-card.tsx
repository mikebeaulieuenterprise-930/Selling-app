"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/dictionaries";
import type { ReplyAi } from "@/lib/ai/schemas";
import { markSentAction } from "@/app/(app)/reply/actions";
import { Button, Card, Eyebrow, Pill, type Tone } from "./ui";
import { CopyButton } from "./copy-button";
import { IconCheck } from "./icons";

export function temperatureTone(temperature: ReplyAi["temperature"]): Tone {
  return temperature === "hot" ? "good" : temperature === "warm" ? "warn" : "bad";
}

export function AnalysisCard({
  analysisId,
  ai,
  leadName,
  wasSent,
  leadMessage,
}: {
  analysisId: string;
  ai: ReplyAi;
  leadName: string | null;
  wasSent: boolean;
  leadMessage?: string;
}) {
  const { t } = useI18n();
  const [sent, setSent] = useState(wasSent);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {leadMessage ? (
        <p className="max-w-[90%] self-start rounded-2xl rounded-bl-sm bg-bubble-in px-3.5 py-2.5 text-sm leading-relaxed">
          {leadMessage}
        </p>
      ) : null}

      <Card className="flex flex-col gap-3 border-dashed border-accent/60 bg-accent-soft/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow>{leadName ? fmt(t.reply.forLead, { name: leadName }) : t.reply.reading}</Eyebrow>
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={temperatureTone(ai.temperature)}>{t.enums.temperature[ai.temperature]}</Pill>
            <Pill tone="neutral">{t.enums.objection[ai.objection_type]}</Pill>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{t.reply.meaning}</span>
          <p className="text-sm leading-relaxed">{ai.what_they_mean}</p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{t.reply.nextStep}</span>
          <p className="text-sm font-medium leading-relaxed">{ai.recommended_next_step}</p>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <Eyebrow>{t.reply.draft}</Eyebrow>
          <CopyButton text={ai.reply_draft} />
        </div>
        <p className="whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent px-4 py-3 text-[15px] leading-relaxed text-accent-ink">
          {ai.reply_draft}
        </p>
        {ai.follow_up_in_days > 0 ? (
          <p className="px-1 text-xs text-muted">{fmt(t.reply.followUp, { n: ai.follow_up_in_days })}</p>
        ) : null}
      </div>

      {sent ? (
        <div className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-good">
          <IconCheck size={16} />
          {t.reply.sent}
        </div>
      ) : (
        <Button
          type="button"
          variant="soft"
          size="sm"
          className="self-start"
          pending={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await markSentAction(analysisId);
              if (result.status === "ok") setSent(true);
            })
          }
        >
          <IconCheck size={16} />
          {t.reply.markSent}
        </Button>
      )}
    </div>
  );
}
