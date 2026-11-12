import type { ReactNode } from "react";

/** 작은 보조 버튼·링크 (DOI, 인용, 복사 등) */
export const PILL =
  "no-print inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent";

/** 바깥 링크 표시 */
export function ExternalMark() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 2.5h5v5M9.5 2.5 3 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const URL_RE = /(https?:\/\/[^\s<>()"']+[^\s<>()"'.,;:!?])/g;

/** 일반 텍스트 안의 URL 을 짧게 보이는 링크로 바꾼다 ("https://github.com/a/b" → "github.com/a/b") */
export function Linkified({ text }: { text: string }) {
  const pieces = text.split(URL_RE);
  return (
    <>
      {pieces.map((piece, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={piece}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
          >
            {piece.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
          </a>
        ) : (
          piece
        ),
      )}
    </>
  );
}

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

export function TagList({ tags, tone, label }: { tags: string[]; tone?: "default" | "accent"; label: string }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
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
