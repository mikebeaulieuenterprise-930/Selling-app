import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getDictionary, getTimeZone } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { TimezoneSync } from "@/components/timezone-sync";
import { BottomNav } from "@/components/bottom-nav";

/** Coquille des écrans privés : langue, fuseau horaire et barre de navigation. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const [{ locale, t }, timeZone] = await Promise.all([getDictionary(), getTimeZone()]);

  return (
    <I18nProvider locale={locale} dict={t}>
      <TimezoneSync current={timeZone} />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <main className="flex flex-1 flex-col px-5 pt-safe pb-nav">{children}</main>
      </div>
      <BottomNav />
    </I18nProvider>
  );
}
