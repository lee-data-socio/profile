"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { reorderEntities, setEntityVisibility } from "@/app/admin/actions";
import { VISIBILITY_LABEL } from "@/lib/labels";
import type { Visibility } from "@/lib/types";
import { SortableList } from "@/components/admin/sortable";

export type ListItem = { id: string; title: string; subtitle: string; visibility: Visibility; meta?: string };

const VIS_STYLE: Record<Visibility, string> = {
  public: "bg-success/10 text-success",
  draft: "bg-warn/10 text-warn",
  private: "bg-line text-muted",
};

export function EntityList({ section, items: initial }: { section: string; items: ListItem[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const persistOrder = (next: ListItem[]) => {
    const prev = items;
    setItems(next);
    startTransition(async () => {
      try {
        await reorderEntities(section, next.map((i) => i.id));
        setError(null);
      } catch {
        setItems(prev);
        setError("순서를 저장하지 못했습니다.");
      }
    });
  };

  const changeVisibility = (id: string, visibility: Visibility) => {
    const prev = items;
    setItems((list) => list.map((i) => (i.id === id ? { ...i, visibility } : i)));
    startTransition(async () => {
      try {
        await setEntityVisibility(section, id, visibility);
        setError(null);
      } catch {
        setItems(prev);
        setError("공개 상태를 바꾸지 못했습니다.");
      }
    });
  };

  if (!items.length) {
    return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-subtle">아직 항목이 없습니다.</p>;
  }

  return (
    <div>
      <p className="mb-3 text-xs text-subtle" aria-live="polite">
        {error ? <span className="text-danger">{error}</span> : pending ? "저장 중…" : "손잡이를 끌어 순서를 바꾸면 공개 페이지 순서도 바뀝니다."}
      </p>
      <SortableList
        label="항목 목록"
        items={items}
        onReorder={persistOrder}
        renderItem={(item, handle) => (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface py-2 pl-1.5 pr-3">
            {handle}
            <div className="min-w-0 flex-1">
              <Link href={`/admin/${section}/${item.id}`} className="block truncate font-medium hover:text-accent">
                {item.title || "(제목 없음)"}
              </Link>
              {(item.subtitle || item.meta) && (
                <p className="truncate text-xs text-subtle">
                  {item.subtitle}
                  {item.meta && <span className="ml-2 text-accent">{item.meta}</span>}
                </p>
              )}
            </div>
            <label className="sr-only" htmlFor={`vis-${item.id}`}>
              공개 상태
            </label>
            <select
              id={`vis-${item.id}`}
              value={item.visibility}
              onChange={(e) => changeVisibility(item.id, e.target.value as Visibility)}
              className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${VIS_STYLE[item.visibility]}`}
            >
              {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((v) => (
                <option key={v} value={v}>
                  {VISIBILITY_LABEL[v]}
                </option>
              ))}
            </select>
          </div>
        )}
      />
    </div>
  );
}
