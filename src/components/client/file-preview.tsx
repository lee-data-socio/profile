"use client";

import { useState } from "react";

/** PDF 는 펼칠 때만 iframe 을 불러온다 (첫 화면 성능을 위해). */
export type PreviewLabels = { open: string; close: string; fallback: string; newWindow: string; title: string };

export function PdfPreview({ src, title, labels }: { src: string; title: string; labels: PreviewLabels }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-accent underline-offset-4 hover:underline"
      >
        {open ? labels.close : labels.open}
      </button>
      {open && (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
          <iframe src={src} title={labels.title.replace("{title}", title)} className="h-[70vh] w-full" loading="lazy" />
          <p className="border-t border-line px-3 py-2 text-xs text-subtle">
            {labels.fallback}{" "}
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              {labels.newWindow}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
