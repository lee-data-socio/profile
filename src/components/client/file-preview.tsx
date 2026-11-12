"use client";

import { useState } from "react";

/** PDF 는 펼칠 때만 iframe 을 불러온다 (첫 화면 성능을 위해). */
export function PdfPreview({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="no-print">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-accent underline-offset-4 hover:underline"
      >
        {open ? "미리보기 닫기" : "미리보기"}
      </button>
      {open && (
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
          <iframe src={src} title={`${title} 미리보기`} className="h-[70vh] w-full" loading="lazy" />
          <p className="border-t border-line px-3 py-2 text-xs text-subtle">
            미리보기가 보이지 않으면{" "}
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              새 창에서 열기
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
