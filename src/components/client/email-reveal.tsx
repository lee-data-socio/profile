"use client";

import { useState } from "react";

/**
 * 스팸 수집기를 피하려고 이메일을 뒤집은 base64 로 받아 클릭할 때만 복원한다.
 */
export function EmailReveal({ encoded }: { encoded: string }) {
  const [email, setEmail] = useState<string | null>(null);

  if (email) {
    return (
      <a href={`mailto:${email}`} className="text-accent underline underline-offset-4">
        {email}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEmail(atob(encoded.split("").reverse().join("")))}
      className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
    >
      이메일 주소 보기
    </button>
  );
}
