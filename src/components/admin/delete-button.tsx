"use client";

import { useTransition } from "react";
import { deleteEntity } from "@/app/admin/actions";
import { dangerBtnCls } from "@/components/admin/fields";

export function DeleteButton({ section, id, title, fileCount }: { section: string; id: string; title: string; fileCount: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={dangerBtnCls}
      disabled={pending}
      onClick={() => {
        const files = fileCount ? `\n연결된 첨부파일 ${fileCount}개와 업무 항목도 함께 삭제됩니다.` : "";
        if (!window.confirm(`"${title}" 항목을 삭제할까요?${files}\n되돌릴 수 없습니다.`)) return;
        startTransition(() => deleteEntity(section, id));
      }}
    >
      {pending ? "삭제 중…" : "항목 삭제"}
    </button>
  );
}
