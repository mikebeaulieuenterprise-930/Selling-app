"use client";

import { useActionState } from "react";
import { requestMagicLink, type LoginState } from "./actions";
import { Button } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/dictionaries";

export function LoginForm({
  t,
  next,
  initialError,
}: {
  t: Dictionary["login"];
  next: string;
  initialError?: keyof Dictionary["login"]["errors"];
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestMagicLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div className="fade-in flex flex-col gap-3">
        <h2 className="text-2xl font-bold">{t.sentTitle}</h2>
        <p className="text-muted">{fmt(t.sentBody, { email: state.email })}</p>
        <form action={action} className="pt-2">
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="ghost" pending={pending} className="w-full">
            {t.sentAgain}
          </Button>
        </form>
      </div>
    );
  }

  const errorCode = state.status === "error" ? state.code : initialError;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t.emailLabel}</span>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          placeholder={t.emailPlaceholder}
          className="h-12 rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-accent"
        />
      </label>
      {errorCode ? (
        <div role="alert" className="flex flex-col gap-1 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          <p>{t.errors[errorCode]}</p>
          {state.status === "error" && state.detail ? (
            <p className="break-words font-mono text-xs opacity-80">{state.detail}</p>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" pending={pending} pendingLabel={t.sending} className="w-full">
        {t.submit}
      </Button>
    </form>
  );
}
