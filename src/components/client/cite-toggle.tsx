"use client";

import { useId, useState, type ReactNode } from "react";
import { PILL } from "@/components/ui";
import { CopyButton } from "@/components/client/copy-button";

/**
 * 논문 항목의 버튼 줄. children(DOI·원문 링크 등) 뒤에 "인용" 버튼을 붙이고,
 * 누르면 ASA 인용문과 복사 버튼을 아래에 펼친다.
 */
export function CiteToggle({
  children,
  asa,
  bibtex,
  labels,
}: {
  children?: ReactNode;
  asa: string;
  bibtex: string;
  labels: { cite: string; asa: string; bibtex: string; copied: string; prompt: string };
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="no-print mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <button
          type="button"
          className={`${PILL} ${open ? "border-accent text-accent" : ""}`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {labels.cite}
          <svg aria-hidden viewBox="0 0 12 12" className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div id={id} hidden={!open} className="mt-3 rounded-lg border border-line bg-surface p-4">
        <p className="text-sm leading-relaxed text-muted">{asa}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={asa} label={labels.asa} copiedLabel={labels.copied} promptLabel={labels.prompt} />
          <CopyButton text={bibtex} label={labels.bibtex} copiedLabel={labels.copied} promptLabel={labels.prompt} />
        </div>
      </div>
    </div>
  );
}
