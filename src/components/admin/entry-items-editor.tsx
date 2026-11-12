"use client";

import { useState, useTransition } from "react";
import { deleteEntryItem, reorderEntryItems, saveEntryItem, type EntryItemInput } from "@/app/admin/actions";
import type { EntryItem } from "@/lib/types";
import { dateToMonth, formatMonth } from "@/lib/format";
import { SortableList } from "@/components/admin/sortable";
import { TagInput, btnCls, dangerBtnCls, inputCls, primaryBtnCls } from "@/components/admin/fields";

const EMPTY: EntryItemInput = { text: "", metrics: [], evidence_url: "", tags: [], last_used: "" };

/**
 * 업무 항목(사실 단위) 입력 (A-03). 문장 하나 + 선택 필드(수치, 근거 링크, 태그, 최근 사용).
 * 태그는 역량 섹션의 근거 수 집계에 쓰인다.
 */
export function EntryItemsEditor({
  parentType,
  parentId,
  initial,
  tagSuggestions,
}: {
  parentType: "project" | "experience";
  parentId: string;
  initial: EntryItem[];
  tagSuggestions: string[];
}) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const onSaved = (item: EntryItem, isNew: boolean) => {
    setItems((list) => (isNew ? [...list, item] : list.map((i) => (i.id === item.id ? item : i))));
    setEditing(null);
    setMessage("저장했습니다.");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-subtle">
        한 항목에 사실 하나씩: <em>행동 + 대상 + 결과</em>. 예) &ldquo;전국 청년 1,200명 대상 온라인 설문 설계·검증&rdquo;, 수치:
        &ldquo;응답률 38%&rdquo;
      </p>
      {items.length > 0 && (
        <SortableList
          label="업무 항목"
          items={items}
          onReorder={(next) => {
            setItems(next);
            startTransition(async () => {
              await reorderEntryItems(next.map((i) => i.id));
            });
          }}
          renderItem={(item, handle) =>
            editing === item.id ? (
              <ItemForm
                parentType={parentType}
                parentId={parentId}
                item={item}
                tagSuggestions={tagSuggestions}
                onCancel={() => setEditing(null)}
                onSaved={(i) => onSaved(i, false)}
              />
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-line bg-surface py-2 pl-1.5 pr-3">
                {handle}
                <div className="min-w-0 flex-1 text-sm">
                  <p>{item.text}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle">
                    {item.metrics.length > 0 && <span>수치: {item.metrics.join(", ")}</span>}
                    {item.tags.length > 0 && <span className="text-accent">#{item.tags.join(" #")}</span>}
                    {item.last_used && <span>최근 {formatMonth(item.last_used)}</span>}
                    {item.evidence_url && <span>근거 링크 있음</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className={`${btnCls} px-2 py-1 text-xs`} onClick={() => setEditing(item.id)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className={`${dangerBtnCls} px-2 py-1 text-xs`}
                    onClick={() => {
                      if (!window.confirm("이 항목을 삭제할까요?")) return;
                      startTransition(async () => {
                        await deleteEntryItem(item.id);
                        setItems((l) => l.filter((x) => x.id !== item.id));
                        setMessage("삭제했습니다.");
                      });
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )
          }
        />
      )}

      {editing === "new" ? (
        <ItemForm
          parentType={parentType}
          parentId={parentId}
          item={null}
          tagSuggestions={tagSuggestions}
          onCancel={() => setEditing(null)}
          onSaved={(i) => onSaved(i, true)}
        />
      ) : (
        <button type="button" className={btnCls} onClick={() => setEditing("new")}>
          + 업무 항목 추가
        </button>
      )}
      <p className="text-xs text-subtle" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function ItemForm({
  parentType,
  parentId,
  item,
  tagSuggestions,
  onCancel,
  onSaved,
}: {
  parentType: "project" | "experience";
  parentId: string;
  item: EntryItem | null;
  tagSuggestions: string[];
  onCancel: () => void;
  onSaved: (item: EntryItem) => void;
}) {
  const [v, setV] = useState<EntryItemInput>(
    item
      ? {
          text: item.text,
          metrics: item.metrics,
          evidence_url: item.evidence_url ?? "",
          tags: item.tags,
          last_used: dateToMonth(item.last_used),
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const idp = item?.id ?? "new";

  const submit = () => {
    startTransition(async () => {
      const res = await saveEntryItem(parentType, parentId, item?.id ?? null, v);
      if (res.ok) onSaved(res.item);
      else setError(res.error);
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-accent/40 bg-surface p-3">
      <label className="block text-xs text-subtle" htmlFor={`ei-text-${idp}`}>
        문장 <span className="text-danger">*</span>
      </label>
      <textarea
        id={`ei-text-${idp}`}
        rows={2}
        value={v.text}
        onChange={(e) => setV({ ...v, text: e.target.value })}
        className={inputCls}
        autoFocus
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-subtle" htmlFor={`ei-metrics-${idp}`}>
            수치 (선택)
          </label>
          <div className="mt-1">
            <TagInput id={`ei-metrics-${idp}`} value={v.metrics} onChange={(metrics) => setV({ ...v, metrics })} placeholder="예: 표본 1,200명" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-subtle" htmlFor={`ei-tags-${idp}`}>
            태그 (방법·도구·주제)
          </label>
          <div className="mt-1">
            <TagInput
              id={`ei-tags-${idp}`}
              value={v.tags}
              onChange={(tags) => setV({ ...v, tags })}
              suggestions={tagSuggestions}
              placeholder="예: Stata"
            />
          </div>
        </div>
        <label className="text-xs text-subtle">
          근거 링크 (선택)
          <input
            type="url"
            value={v.evidence_url}
            onChange={(e) => setV({ ...v, evidence_url: e.target.value })}
            className={`${inputCls} mt-1`}
            placeholder="https://"
          />
        </label>
        <label className="text-xs text-subtle">
          최근 사용 (선택)
          <input
            type="month"
            value={v.last_used}
            onChange={(e) => setV({ ...v, last_used: e.target.value })}
            className={`${inputCls} mt-1`}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className={primaryBtnCls} onClick={submit} disabled={pending}>
          {pending ? "저장 중…" : "항목 저장"}
        </button>
        <button type="button" className={btnCls} onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  );
}
