import type { OfferAi } from "@/lib/ai/schemas";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { Card, Eyebrow } from "./ui";
import { CopyButton } from "./copy-button";

/** Le positionnement généré, affiché dans l'onboarding et le profil. */
export function OfferAiView({ ai, t }: { ai: OfferAi; t: Dictionary["onboarding"]["result"] }) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2 border-accent/40 bg-accent-soft/40">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{t.pitch}</Eyebrow>
          <CopyButton text={ai.pitch} />
        </div>
        <p className="font-display text-xl font-bold leading-snug">« {ai.pitch} »</p>
      </Card>

      <Card className="flex flex-col gap-1.5">
        <Eyebrow>{t.icp}</Eyebrow>
        <p className="text-[15px]">{ai.icp_summary}</p>
      </Card>

      <Card className="flex flex-col gap-1.5">
        <Eyebrow>{t.positioning}</Eyebrow>
        <p className="text-[15px] leading-relaxed">{ai.positioning}</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>{t.opener}</Eyebrow>
          <CopyButton text={ai.call_opener} />
        </div>
        <p className="text-[15px] leading-relaxed">{ai.call_opener}</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <Eyebrow>{t.valueProps}</Eyebrow>
        <ol className="flex flex-col gap-2">
          {ai.value_props.map((prop, i) => (
            <li key={i} className="flex gap-3 text-[15px]">
              <span className="font-display text-sm font-bold text-accent tabular-nums">{i + 1}</span>
              <span>{prop}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="flex flex-col gap-3">
        <Eyebrow>{t.objections}</Eyebrow>
        <ul className="flex flex-col gap-3">
          {ai.likely_objections.map((item, i) => (
            <li key={i} className="flex flex-col gap-1">
              <p className="rounded-xl rounded-bl-sm bg-bubble-in px-3 py-2 text-sm italic">« {item.objection} »</p>
              <p className="pl-3 text-sm text-muted">{item.answer}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
