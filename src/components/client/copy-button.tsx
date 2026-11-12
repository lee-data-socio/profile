"use client";

import { useState } from "react";
import { PILL } from "@/components/ui";

export function CopyButton({
  text,
  label,
  copiedLabel,
  promptLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  promptLabel: string;
}) {
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
          window.prompt(promptLabel, text);
        }
      }}
      className={PILL}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
