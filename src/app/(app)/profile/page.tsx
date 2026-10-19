import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { getOffer } from "@/lib/data/offers";
import { parseOfferAi } from "@/lib/ai/schemas";
import { APP_NAME } from "@/lib/config";
import { Card, Eyebrow, LinkButton, PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { InstallHint, LanguageSwitcher, RegenerateButton, SignOutButton } from "./profile-controls";

export const metadata: Metadata = { title: "Profil" };
export const maxDuration = 60;

export default async function ProfilePage() {
  const user = await requireUser();
  const [{ locale, t }, offer] = await Promise.all([getDictionary(), getOffer()]);
  const ai = offer ? parseOfferAi(offer.ai) : null;

  return (
    <div className="flex flex-col gap-5 py-6">
      <PageHeader eyebrow={t.nav.profile} title={t.profile.title} subtitle={user.email ?? undefined} />

      <Card className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{t.profile.offer}</Eyebrow>
          <LinkButton href="/onboarding" variant="ghost" size="sm">
            {t.profile.editOffer}
          </LinkButton>
        </div>
        {offer ? (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">{offer.product_name}</p>
            {ai ? (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted">{t.profile.pitch}</span>
                    <CopyButton text={ai.pitch} />
                  </div>
                  <p className="font-display text-lg font-bold leading-snug">« {ai.pitch} »</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">{t.profile.positioning}</span>
                  <p className="text-sm leading-relaxed">{ai.positioning}</p>
                </div>
              </>
            ) : null}
            <RegenerateButton />
          </div>
        ) : (
          <p className="text-sm text-muted">{t.profile.offerEmpty}</p>
        )}
      </Card>

      <Card>
        <LanguageSwitcher current={locale} />
      </Card>

      <InstallHint />

      <SignOutButton />

      <p className="text-center text-xs text-muted">
        {APP_NAME} · {t.profile.version}
      </p>
    </div>
  );
}
