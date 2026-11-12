"use client";

import { useId, useState, type ReactNode } from "react";
import type { Author } from "@/lib/types";
import type { Option } from "@/lib/sections";

export const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 aria-[invalid=true]:border-danger";

export const btnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-50";

export const primaryBtnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

export const dangerBtnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-danger/40 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:pointer-events-none disabled:opacity-50";

export function FieldShell({
  id,
  label,
  required,
  help,
  error,
  children,
  className = "",
  as = "div",
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  as?: "div" | "fieldset";
}) {
  const Label = as === "fieldset" ? "legend" : "label";
  const Wrapper = as;
  return (
    <Wrapper className={`flex flex-col gap-1.5 ${className}`}>
      <Label {...(as === "div" ? { htmlFor: id } : {})} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="text-xs text-subtle">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/* 태그 입력 (A-07: 자동완성)                                          */
/* ------------------------------------------------------------------ */

export function TagInput({
  id,
  name,
  value,
  onChange,
  suggestions = [],
  placeholder,
  invalid,
}: {
  id: string;
  name?: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const add = (raw: string) => {
    const parts = raw
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft("");
  };
  const remaining = suggestions.filter((s) => !value.includes(s));

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 rounded-md border bg-surface px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
        invalid ? "border-danger" : "border-line"
      }`}
    >
      {name && <input type="hidden" name={name} value={JSON.stringify(value)} />}
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs text-accent">
          {t}
          <button
            type="button"
            onClick={() => onChange(value.filter((x) => x !== t))}
            className="rounded-full px-1 hover:bg-accent/15"
            aria-label={`${t} 삭제`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        placeholder={value.length ? "" : placeholder ?? "입력 후 Enter"}
        onChange={(e) => {
          const v = e.target.value;
          // datalist 에서 고르면 바로 추가
          if (remaining.includes(v)) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-subtle"
      />
      <datalist id={listId}>
        {remaining.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 저자 입력                                                            */
/* ------------------------------------------------------------------ */

export function AuthorsEditor({
  id,
  name,
  initial,
  invalid,
}: {
  id: string;
  name: string;
  initial: Author[];
  invalid?: boolean;
}) {
  const [authors, setAuthors] = useState<Author[]>(initial.length ? initial : [{ name: "", is_me: true }]);
  const update = (i: number, patch: Partial<Author>) =>
    setAuthors((list) => list.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const move = (i: number, d: -1 | 1) =>
    setAuthors((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className={`space-y-2 rounded-md border p-3 ${invalid ? "border-danger" : "border-line"}`}>
      <input type="hidden" name={name} value={JSON.stringify(authors)} />
      <ol className="space-y-2">
        {authors.map((a, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <span className="w-5 text-right text-xs tabular-nums text-subtle">{i + 1}</span>
            <input
              id={i === 0 ? id : undefined}
              aria-label={`${i + 1}번째 저자 이름`}
              value={a.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="성 이름 (예: Lee, Sangwon / 이상원)"
              className={`${inputCls} min-w-0 flex-1`}
            />
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={Boolean(a.is_me)} onChange={(e) => update(i, { is_me: e.target.checked })} />
              본인
            </label>
            <div className="flex gap-1">
              <button type="button" className={btnCls + " px-2 py-1"} onClick={() => move(i, -1)} aria-label="위로" disabled={i === 0}>
                ↑
              </button>
              <button
                type="button"
                className={btnCls + " px-2 py-1"}
                onClick={() => move(i, 1)}
                aria-label="아래로"
                disabled={i === authors.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                className={btnCls + " px-2 py-1"}
                onClick={() => setAuthors((l) => l.filter((_, j) => j !== i))}
                aria-label={`${i + 1}번째 저자 삭제`}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className={btnCls + " py-1 text-xs"} onClick={() => setAuthors((l) => [...l, { name: "" }])}>
        + 저자 추가
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 관계 선택 (연구 관심사 ↔ 프로젝트·논문)                             */
/* ------------------------------------------------------------------ */

export function RelationsPicker({
  id,
  name,
  options,
  initial,
}: {
  id: string;
  name: string;
  options: Option[];
  initial: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  if (!options.length) return <p className="text-xs text-subtle">연결할 항목이 아직 없습니다.</p>;
  return (
    <div id={id} className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-line p-3">
      <input type="hidden" name={name} value={JSON.stringify(selected)} />
      {options.map((o) => (
        <label key={o.value} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={selected.includes(o.value)}
            onChange={(e) =>
              setSelected((s) => (e.target.checked ? [...s, o.value] : s.filter((x) => x !== o.value)))
            }
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
