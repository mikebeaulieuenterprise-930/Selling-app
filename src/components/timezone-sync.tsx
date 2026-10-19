"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Pose le fuseau horaire du navigateur dans un cookie pour que le serveur
 * calcule « aujourd'hui » comme l'utilisateur le voit.
 */
export function TimezoneSync({ current }: { current: string }) {
  const router = useRouter();

  useEffect(() => {
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!tz || tz === current) return;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [current, router]);

  return null;
}
