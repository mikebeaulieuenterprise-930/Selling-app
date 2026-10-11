"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { actionErrorMessage, type ActionErrorCode } from "@/lib/ai/errors";
import { locales, type Locale } from "@/lib/i18n/config";
import { Button, Card, Eyebrow, Notice } from "@/components/ui";
import { IconLogout, IconSparkle } from "@/components/icons";
import { regenerateOfferAction, setLocaleAction, signOutAction } from "./actions";

const LOCALE_NAMES: Record<Locale, string> = { fr: "Français", en: "English" };

export function LanguageSwitcher({ current }: { current: Locale }) {
  const { t } = useI18n();
  return (
    <form action={setLocaleAction} className="flex flex-col gap-2">
      <Eyebrow>{t.profile.language}</Eyebrow>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-bubble-in p-1">
        {locales.map((locale) => (
          <button
            key={locale}
            type="submit"
            name="locale"
            value={locale}
            aria-pressed={locale === current}
            className={`h-10 rounded-lg text-sm font-semibold transition ${
              locale === current ? "bg-surface text-ink shadow-card" : "text-muted"
            }`}
          >
            {LOCALE_NAMES[locale]}
          </button>
        ))}
      </div>
    </form>
  );
}

export function RegenerateButton() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ActionErrorCode | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        pending={pending}
        pendingLabel={t.common.generating}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await regenerateOfferAction();
            if (result.status === "error") setError(result.code);
          });
        }}
      >
        <IconSparkle size={16} />
        {t.profile.regenerate}
      </Button>
      {error ? <Notice tone="bad">{actionErrorMessage(t, error)}</Notice> : null}
    </div>
  );
}

export function SignOutButton() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" variant="ghost" pending={pending} onClick={() => startTransition(async () => signOutAction())}>
      <IconLogout size={18} />
      {t.profile.signOut}
    </Button>
  );
}

type InstallState = "unknown" | "installed" | "ios" | "other";

function subscribeNoop() {
  return () => {};
}

function readInstallState(): InstallState {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
  if (standalone) return "installed";
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ? "ios" : "other";
}

/** Explique comment installer l'app, selon l'appareil, sauf si c'est déjà fait. */
export function InstallHint() {
  const { t } = useI18n();
  // Lu une fois côté navigateur ; « unknown » pendant le rendu serveur.
  const state = useSyncExternalStore(subscribeNoop, readInstallState, () => "unknown" as InstallState);

  if (state === "unknown") return null;
  return (
    <Card className="flex flex-col gap-1.5">
      <Eyebrow>{t.profile.install}</Eyebrow>
      <p className="text-sm text-muted">
        {state === "installed" ? t.profile.installed : state === "ios" ? t.profile.installBodyIos : t.profile.installBodyAndroid}
      </p>
    </Card>
  );
}
