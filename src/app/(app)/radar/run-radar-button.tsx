"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { actionErrorMessage, type ActionErrorCode } from "@/lib/ai/errors";
import { Button, Notice } from "@/components/ui";
import { IconRadar } from "@/components/icons";
import { runRadarAction } from "./actions";

export function RunRadarButton({ variant = "primary", label }: { variant?: "primary" | "ghost"; label: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ActionErrorCode | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        pending={pending}
        pendingLabel={t.common.generating}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await runRadarAction();
            if (result.status === "error") setError(result.code);
          });
        }}
      >
        <IconRadar size={18} />
        {label}
      </Button>
      {error ? <Notice tone="bad">{actionErrorMessage(t, error)}</Notice> : null}
    </div>
  );
}
