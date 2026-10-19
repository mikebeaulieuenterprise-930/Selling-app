"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Button } from "./ui";
import { IconCheck, IconCopy } from "./icons";

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Navigateurs sans presse-papiers : on sélectionne le texte via un champ temporaire.
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(area);
      }
    }
  }

  return (
    <Button type="button" variant={copied ? "soft" : "ghost"} size="sm" onClick={copy} className={className}>
      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
      {copied ? t.common.copied : t.common.copy}
    </Button>
  );
}
