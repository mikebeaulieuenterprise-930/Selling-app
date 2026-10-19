import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";
import { safeNextPath } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { BrandMark } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const ERROR_CODES = ["invalid_email", "send_failed", "link_invalid", "config"] as const;
type ErrorCode = (typeof ERROR_CODES)[number];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getDictionary();
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const rawError = typeof params.error === "string" ? params.error : undefined;
  const initialError = (ERROR_CODES as readonly string[]).includes(rawError ?? "")
    ? (rawError as ErrorCode)
    : undefined;

  return (
    <main className="flex flex-1 flex-col justify-center px-5 py-10 pt-safe pb-safe">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <BrandMark size={40} />
            <span className="font-display text-xl font-bold">{APP_NAME}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              {t.login.eyebrow}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight">{t.login.title}</h1>
            <p className="text-muted">{t.login.subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <LoginForm t={t.login} next={next} initialError={initialError} />
        </div>
      </div>
    </main>
  );
}
