"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Approach } from "@/lib/types";
import type { Dict, Lang } from "@/lib/i18n";

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
export function ProjectFilter({
  projects,
  cards,
  lang,
  labels,
  approachLabels,
}: {
  projects: FilterableProject[];
  cards: Record<string, ReactNode>;
  lang: Lang;
  labels: Dict["filter"];
  approachLabels: Record<Approach, string>;
}) {
  const [approach, setApproach] = useState<Approach | "">("");
  const [tag, setTag] = useState("");
  const [year, setYear] = useState("");

  const allTags = useMemo(() => [...new Set(projects.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, lang)), [projects, lang]);
  const allYears = useMemo(() => [...new Set(projects.flatMap((p) => p.years))].sort((a, b) => b - a), [projects]);
  const approaches = useMemo(
    () => (Object.keys(approachLabels) as Approach[]).filter((a) => projects.some((p) => p.approach === a)),
    [projects, approachLabels],
  );

  const visible = projects.filter(
    (p) =>
      (!approach || p.approach === approach) &&
      (!tag || p.tags.includes(tag)) &&
      (!year || p.years.includes(Number(year))),
  );

  // 프로젝트가 몇 개 안 되면 필터는 짐만 된다
  const showFilter = projects.length >= 4;

  const selectCls =
    "rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <>
      {showFilter && (
        <div className="no-print mb-6 flex flex-wrap items-end gap-3" role="group" aria-label={labels.group}>
          <label className="flex flex-col gap-1 text-xs text-subtle">
            {labels.approach}
            <select className={selectCls} value={approach} onChange={(e) => setApproach(e.target.value as Approach | "")}>
              <option value="">{labels.all}</option>
              {approaches.map((a) => (
                <option key={a} value={a}>
                  {approachLabels[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-subtle">
            {labels.topic}
            <select className={selectCls} value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">{labels.all}</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-subtle">
            {labels.year}
            <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">{labels.all}</option>
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
              {labels.reset}
            </button>
          )}
          <p className="ml-auto self-center pt-5 text-sm text-subtle" aria-live="polite">
            {labels.count.replace("{n}", String(visible.length))}
          </p>
        </div>
      )}
      {visible.length ? (
        <ul className={`grid gap-4 ${visible.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {visible.map((p) => (
            <li key={p.id}>{cards[p.id]}</li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-subtle">{labels.none}</p>
      )}
    </>
  );
}
