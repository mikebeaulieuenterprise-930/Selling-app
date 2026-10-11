"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/dictionaries";
import { actionErrorMessage, type ActionErrorCode } from "@/lib/ai/errors";
import type { OfferAi } from "@/lib/ai/schemas";
import {
  CUSTOMER_TYPES,
  OUTREACH_CHANNELS,
  PRICE_HINTS,
  PROBLEMS,
  type CustomerType,
  type OutreachChannel,
  type PriceHint,
  type Problem,
} from "@/lib/offer-options";
import { Button, Chip, Eyebrow, Field, Input, Notice, TextArea } from "@/components/ui";
import { OfferAiView } from "@/components/offer-ai-view";
import { confirmOnboardingAction, generateOfferAction, type OnboardingInput } from "./actions";

type Draft = {
  product_name: string;
  product_description: string;
  price_hint: PriceHint | null;
  customer_types: CustomerType[];
  customer_detail: string;
  channels: OutreachChannel[];
  problems: Problem[];
  problem_detail: string;
};

const TOTAL_STEPS = 3;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function OnboardingWizard({
  initial,
  initialAi,
  editing,
}: {
  initial: Draft;
  initialAi: OfferAi | null;
  editing: boolean;
}) {
  const { t } = useI18n();
  const o = t.onboarding;
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(initial);
  const [validation, setValidation] = useState<string | null>(null);
  const [error, setError] = useState<ActionErrorCode | null>(null);
  const [ai, setAi] = useState<OfferAi | null>(editing ? initialAi : null);
  const [pending, startTransition] = useTransition();
  const [confirming, startConfirm] = useTransition();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function next() {
    setValidation(null);
    if (step === 1) {
      if (!draft.product_name.trim()) return setValidation(o.validation.nameRequired);
      if (!draft.product_description.trim()) return setValidation(o.validation.descRequired);
    }
    if (step === 2 && draft.customer_types.length === 0) return setValidation(o.validation.typeRequired);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function generate() {
    setValidation(null);
    setError(null);
    if (draft.problems.length === 0) return setValidation(o.validation.problemRequired);
    const input: OnboardingInput = { ...draft };
    startTransition(async () => {
      const result = await generateOfferAction(input);
      if (result.status === "ok") setAi(result.ai);
      else setError(result.code);
    });
  }

  if (ai) {
    return (
      <div className="fade-in flex flex-col gap-5 py-6">
        <header className="flex flex-col gap-1">
          <Eyebrow>{o.title}</Eyebrow>
          <h1 className="text-2xl font-extrabold">{o.result.title}</h1>
          <p className="text-sm text-muted">{o.result.subtitle}</p>
        </header>
        <OfferAiView ai={ai} t={o.result} />
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            pending={confirming}
            onClick={() => startConfirm(async () => confirmOnboardingAction())}
          >
            {o.result.confirm}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAi(null)}>
            {t.common.edit}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Eyebrow>{o.title}</Eyebrow>
          <span className="text-xs font-medium text-muted tabular-nums">
            {fmt(o.stepOf, { n: step, total: TOTAL_STEPS })}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </header>

      {step === 1 ? (
        <section className="fade-in flex flex-col gap-5">
          <h1 className="text-2xl font-extrabold">{o.step1.title}</h1>
          <Field label={o.step1.nameLabel} htmlFor="product_name">
            <Input
              id="product_name"
              value={draft.product_name}
              onChange={(e) => set("product_name", e.target.value)}
              placeholder={o.step1.namePlaceholder}
              autoComplete="off"
            />
          </Field>
          <Field label={o.step1.descLabel} htmlFor="product_description">
            <TextArea
              id="product_description"
              value={draft.product_description}
              onChange={(e) => set("product_description", e.target.value)}
              placeholder={o.step1.descPlaceholder}
              rows={3}
            />
          </Field>
          <Field label={o.step1.priceLabel}>
            <div className="flex flex-wrap gap-2">
              {PRICE_HINTS.map((key) => (
                <Chip key={key} selected={draft.price_hint === key} onClick={() => set("price_hint", draft.price_hint === key ? null : key)}>
                  {o.step1.prices[key]}
                </Chip>
              ))}
            </div>
          </Field>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="fade-in flex flex-col gap-5">
          <h1 className="text-2xl font-extrabold">{o.step2.title}</h1>
          <Field label={o.step2.typeLabel}>
            <div className="flex flex-wrap gap-2">
              {CUSTOMER_TYPES.map((key) => (
                <Chip key={key} selected={draft.customer_types.includes(key)} onClick={() => set("customer_types", toggle(draft.customer_types, key))}>
                  {o.step2.types[key]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label={o.step2.detailLabel} hint={t.common.optional} htmlFor="customer_detail">
            <Input
              id="customer_detail"
              value={draft.customer_detail}
              onChange={(e) => set("customer_detail", e.target.value)}
              placeholder={o.step2.detailPlaceholder}
            />
          </Field>
          <Field label={o.step2.channelsLabel}>
            <div className="flex flex-wrap gap-2">
              {OUTREACH_CHANNELS.map((key) => (
                <Chip key={key} selected={draft.channels.includes(key)} onClick={() => set("channels", toggle(draft.channels, key))}>
                  {t.enums.channel[key]}
                </Chip>
              ))}
            </div>
          </Field>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="fade-in flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold">{o.step3.title}</h1>
            <p className="text-sm text-muted">{o.step3.hint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROBLEMS.map((key) => (
              <Chip key={key} selected={draft.problems.includes(key)} onClick={() => set("problems", toggle(draft.problems, key))}>
                {o.step3.problems[key]}
              </Chip>
            ))}
          </div>
          <Field label={o.step3.detailLabel} hint={t.common.optional} htmlFor="problem_detail">
            <TextArea
              id="problem_detail"
              value={draft.problem_detail}
              onChange={(e) => set("problem_detail", e.target.value)}
              placeholder={o.step3.detailPlaceholder}
              rows={2}
            />
          </Field>
        </section>
      ) : null}

      {validation ? <Notice tone="warn">{validation}</Notice> : null}
      {error ? <Notice tone="bad">{actionErrorMessage(t, error)}</Notice> : null}

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" disabled={step === 1 || pending} onClick={() => setStep((s) => s - 1)}>
          {t.common.back}
        </Button>
        {step < TOTAL_STEPS ? (
          <Button type="button" onClick={next}>
            {t.common.continue}
          </Button>
        ) : (
          <Button type="button" onClick={generate} pending={pending} pendingLabel={t.common.generating}>
            {o.step3.generate}
          </Button>
        )}
      </div>
    </div>
  );
}
