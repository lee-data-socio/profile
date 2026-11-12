"use client";

import { useState, useTransition } from "react";
import { saveSectionOrder } from "@/app/admin/actions";
import { SECTION_LABEL } from "@/lib/labels";
import type { SectionOrderEntry } from "@/lib/types";
import { SortableList } from "@/components/admin/sortable";

/** 홈 섹션 순서·표시 여부 (A-09). 기업 지원 때는 경력·역량을 위로 올리는 식으로 쓴다. */
export function SectionOrderEditor({ initial }: { initial: SectionOrderEntry[] }) {
  const [items, setItems] = useState(initial.map((s) => ({ ...s, id: s.key })));
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState("");

  const persist = (next: typeof items) => {
    setItems(next);
    startTransition(async () => {
      try {
        await saveSectionOrder(next.map(({ key, visible }) => ({ key, visible })));
        setStatus("저장했습니다.");
      } catch {
        setStatus("저장하지 못했습니다.");
      }
    });
  };

  return (
    <div>
      <SortableList
        label="홈 섹션 순서"
        items={items}
        onReorder={persist}
        renderItem={(item, handle) => (
          <div className={`flex items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pl-1.5 pr-3 ${item.visible ? "" : "opacity-60"}`}>
            {handle}
            <span className="flex-1 text-sm">{SECTION_LABEL[item.key]}</span>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={item.visible}
                onChange={(e) => persist(items.map((i) => (i.id === item.id ? { ...i, visible: e.target.checked } : i)))}
              />
              표시
            </label>
          </div>
        )}
      />
      <p className="mt-2 text-xs text-subtle" aria-live="polite">
        {pending ? "저장 중…" : status}
      </p>
    </div>
  );
}
