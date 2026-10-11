import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "soft";
type Size = "md" | "sm";

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100";
  const sizes: Record<Size, string> = {
    md: "h-12 px-4 text-[15px]",
    sm: "h-9 px-3 text-sm",
  };
  const variants: Record<Variant, string> = {
    primary: "bg-accent text-accent-ink shadow-card",
    ghost: "border border-line bg-surface text-ink",
    soft: "bg-accent-soft text-accent",
    danger: "bg-bad-soft text-bad",
  };
  return [base, sizes[size], variants[variant], extra].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
  pendingLabel?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  pending = false,
  pendingLabel,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending ? <Spinner /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface p-4 shadow-card ${className}`}>
      {children}
    </Tag>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {hint ? <span className="ml-1.5 font-normal text-muted">({hint})</span> : null}
      </label>
      {children}
    </div>
  );
}

const controlClass =
  "w-full rounded-xl border border-line bg-surface px-4 text-base text-ink outline-none placeholder:text-muted/70 focus:border-accent";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClass} h-12 ${className}`} {...rest} />;
}

export function TextArea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${controlClass} min-h-28 py-3 leading-relaxed ${className}`} {...rest} />;
}

export function Select({
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${controlClass} h-12 appearance-none ${className}`} {...rest}>
      {children}
    </select>
  );
}

/** Puce cliquable pour les choix (pas besoin d'écrire). */
export function Chip({
  selected,
  children,
  onClick,
  type = "button",
}: {
  selected?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-[0.97] ${
        selected
          ? "border-accent bg-accent-soft text-accent"
          : "border-line bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export type Tone = "neutral" | "accent" | "good" | "warn" | "bad" | "spark";

const toneClass: Record<Tone, string> = {
  neutral: "bg-bubble-in text-muted",
  accent: "bg-accent-soft text-accent",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  spark: "bg-spark-soft text-ink",
};

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-widest text-accent ${className}`}>{children}</span>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-start gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {body ? <p className="text-sm text-muted">{body}</p> : null}
      {action}
    </Card>
  );
}

export function Notice({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <p className={`rounded-xl px-3 py-2 text-sm ${toneClass[tone]}`}>{children}</p>;
}

/** Barre de progression simple, 0..100. */
export function Meter({ value, tone = "accent", label }: { value: number; tone?: Tone; label?: ReactNode }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const bar: Record<Tone, string> = {
    neutral: "bg-muted",
    accent: "bg-accent",
    good: "bg-good",
    warn: "bg-warn",
    bad: "bg-bad",
    spark: "bg-spark",
  };
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="w-24 shrink-0 text-xs text-muted">{label}</span> : null}
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${bar[tone]}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-7 text-right text-xs font-semibold tabular-nums">{clamped}</span>
    </div>
  );
}
