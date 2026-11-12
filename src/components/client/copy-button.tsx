"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          window.prompt("아래 내용을 복사하세요", text);
        }
      }}
      className="no-print rounded border border-line px-2 py-0.5 text-xs text-muted hover:border-accent hover:text-accent"
      aria-live="polite"
    >
      {copied ? "복사됨" : label}
    </button>
  );
}
