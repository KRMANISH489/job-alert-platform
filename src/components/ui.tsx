import type { ReactNode } from "react";

export const fieldClass =
  "w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/80";

export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-cream transition hover:bg-forest-deep";

export const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-line bg-cream px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-paper-deep";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Submit({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <button type="submit" className={variant === "primary" ? btnPrimary : btnGhost}>
      {children}
    </button>
  );
}

export function PageIntro({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl leading-tight md:text-5xl">{title}</h1>
      {lede ? <p className="mt-3 text-lg text-muted">{lede}</p> : null}
    </div>
  );
}
