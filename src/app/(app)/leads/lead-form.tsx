"use client";

import { useActionState, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Lead, LeadChannel, LeadStatus, Segment } from "@/lib/supabase/types";
import { LEAD_CHANNELS, LEAD_STATUSES } from "@/lib/supabase/types";
import { Button, Chip, Field, Input, Notice, Select, TextArea } from "@/components/ui";
import { IconTrash } from "@/components/icons";
import { createLeadAction, deleteLeadAction, updateLeadAction, type LeadFormState } from "./actions";

type Props = {
  segments: Pick<Segment, "id" | "name">[];
  lead?: Lead;
  defaultSegmentId?: string | null;
};

export function LeadForm({ segments, lead, defaultSegmentId }: Props) {
  const { t } = useI18n();
  const action = lead ? updateLeadAction.bind(null, lead.id) : createLeadAction;
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(action, { status: "idle" });
  const [channel, setChannel] = useState<LeadChannel>((lead?.channel as LeadChannel) ?? "sms");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const errorMessage =
    state.status === "error"
      ? state.code === "name"
        ? t.leads.validation.nameRequired
        : t.common.errorGeneric
      : null;

  const nextFollowUp = lead?.next_follow_up_at ? lead.next_follow_up_at.slice(0, 10) : "";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label={t.leads.name} htmlFor="name">
        <Input id="name" name="name" defaultValue={lead?.name ?? ""} placeholder={t.leads.namePlaceholder} required autoComplete="off" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.leads.company} htmlFor="company">
          <Input id="company" name="company" defaultValue={lead?.company ?? ""} placeholder={t.leads.companyPlaceholder} />
        </Field>
        <Field label={t.leads.role} htmlFor="role">
          <Input id="role" name="role" defaultValue={lead?.role ?? ""} placeholder={t.leads.rolePlaceholder} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.leads.phone} htmlFor="phone">
          <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={lead?.phone ?? ""} />
        </Field>
        <Field label={t.leads.email} htmlFor="email">
          <Input id="email" name="email" type="email" inputMode="email" defaultValue={lead?.email ?? ""} />
        </Field>
      </div>

      <Field label={t.leads.channel}>
        <input type="hidden" name="channel" value={channel} />
        <div className="flex flex-wrap gap-2">
          {LEAD_CHANNELS.map((key) => (
            <Chip key={key} selected={channel === key} onClick={() => setChannel(key)}>
              {t.enums.channel[key]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={t.leads.segment} htmlFor="segment_id">
        <Select id="segment_id" name="segment_id" defaultValue={lead?.segment_id ?? defaultSegmentId ?? ""}>
          <option value="">{t.leads.noSegment}</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      {lead ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.leads.status} htmlFor="status">
            <Select id="status" name="status" defaultValue={lead.status as LeadStatus}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.enums.status[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.leads.nextFollowUp} htmlFor="next_follow_up">
            <Input id="next_follow_up" name="next_follow_up" type="date" defaultValue={nextFollowUp} />
          </Field>
        </div>
      ) : null}

      <Field label={t.leads.notes} hint={t.common.optional} htmlFor="notes">
        <TextArea id="notes" name="notes" defaultValue={lead?.notes ?? ""} placeholder={t.leads.notesPlaceholder} rows={3} />
      </Field>

      {errorMessage ? <Notice tone="bad">{errorMessage}</Notice> : null}

      <Button type="submit" pending={pending}>
        {lead ? t.common.save : t.leads.add}
      </Button>

      {lead ? (
        confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-xl bg-bad-soft p-3">
            <p className="text-sm text-bad">{t.leads.deleteConfirm}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                pending={deleting}
                onClick={() => startDelete(async () => deleteLeadAction(lead.id))}
              >
                {t.common.delete}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="self-start text-bad" onClick={() => setConfirmDelete(true)}>
            <IconTrash size={16} />
            {t.common.delete}
          </Button>
        )
      ) : null}
    </form>
  );
}
