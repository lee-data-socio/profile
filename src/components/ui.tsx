import type { ReactNode } from "react";

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={
        tone === "accent"
          ? "inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
          : "inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
      }
    >
      {children}
    </span>
  );
}

export function TagList({ tags, tone }: { tags: string[]; tone?: "default" | "accent" }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="태그">
      {tags.map((t) => (
        <li key={t}>
          <Tag tone={tone}>{t}</Tag>
        </li>
      ))}
    </ul>
  );
}

export function SectionHeading({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <h2 id={id} className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Section({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 scroll-mt-20">
      <SectionHeading id={id} action={action}>
        {title}
      </SectionHeading>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-subtle">{children}</p>;
}
