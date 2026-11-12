"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Approach } from "@/lib/types";
import { APPROACH_LABEL } from "@/lib/labels";

export type FilterableProject = {
  id: string;
  approach: Approach | null;
  tags: string[];
  years: number[];
};

/**
 * 프로젝트 목록 필터 (P-02). 페이지는 정적으로 두고 필터는 브라우저에서만 적용한다.
 * cards 는 서버에서 그린 카드를 id 별로 넘겨받는다.
 */
export function ProjectFilter({ projects, cards }: { projects: FilterableProject[]; cards: Record<string, ReactNode> }) {
  const [approach, setApproach] = useState<Approach | "">("");
  const [tag, setTag] = useState("");
  const [year, setYear] = useState("");

  const allTags = useMemo(() => [...new Set(projects.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, "ko")), [projects]);
  const allYears = useMemo(() => [...new Set(projects.flatMap((p) => p.years))].sort((a, b) => b - a), [projects]);
  const approaches = useMemo(
    () => (Object.keys(APPROACH_LABEL) as Approach[]).filter((a) => projects.some((p) => p.approach === a)),
    [projects],
  );

  const visible = projects.filter(
    (p) =>
      (!approach || p.approach === approach) &&
      (!tag || p.tags.includes(tag)) &&
      (!year || p.years.includes(Number(year))),
  );

  const selectCls =
    "rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-end gap-3" role="group" aria-label="프로젝트 필터">
        <label className="flex flex-col gap-1 text-xs text-subtle">
          방법
          <select className={selectCls} value={approach} onChange={(e) => setApproach(e.target.value as Approach | "")}>
            <option value="">전체</option>
            {approaches.map((a) => (
              <option key={a} value={a}>
                {APPROACH_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-subtle">
          주제
          <select className={selectCls} value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">전체</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-subtle">
          연도
          <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">전체</option>
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {(approach || tag || year) && (
          <button
            type="button"
            onClick={() => {
              setApproach("");
              setTag("");
              setYear("");
            }}
            className="px-2 py-2 text-sm text-accent hover:underline"
          >
            초기화
          </button>
        )}
        <p className="ml-auto text-sm text-subtle" aria-live="polite">
          {visible.length}건
        </p>
      </div>
      {visible.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((p) => (
            <li key={p.id}>{cards[p.id]}</li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-subtle">조건에 맞는 프로젝트가 없습니다.</p>
      )}
    </>
  );
}
