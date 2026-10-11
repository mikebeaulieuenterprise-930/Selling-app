"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { IconLeads, IconProfile, IconRadar, IconReply, IconToday } from "./icons";

const items = [
  { href: "/today", key: "today", Icon: IconToday },
  { href: "/radar", key: "radar", Icon: IconRadar },
  { href: "/reply", key: "reply", Icon: IconReply },
  { href: "/leads", key: "leads", Icon: IconLeads },
  { href: "/profile", key: "profile", Icon: IconProfile },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur pb-safe"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, key, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                {t.nav[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
