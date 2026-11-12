"use client";

import { useActionState, useEffect, useState, startTransition, type FormEvent } from "react";
import type { FormState } from "@/app/admin/actions";
import { VISIBILITY_OPTIONS, slugify, type FieldDef, type SectionConfig } from "@/lib/sections";
import type { TagSuggestions, RelationOptions } from "@/lib/admin-data";
import type { Author, RichDoc } from "@/lib/types";
import { dateToMonth } from "@/lib/format";
import { AuthorsEditor, FieldShell, RelationsPicker, TagInput, inputCls, primaryBtnCls, btnCls } from "@/components/admin/fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type Values = Record<string, unknown>;

function randomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

export function EntityForm({
  config,
  initial,
  action,
  tagSuggestions,
  relations,
  isNew,
}: {
  config: SectionConfig;
  initial: Values;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  tagSuggestions: TagSuggestions;
  relations: RelationOptions;
  isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false } as FormState);
  const [dirty, setDirty] = useState(false);
  const [current, setCurrent] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.fields.filter((f) => f.type === "current").map((f) => [f.name, Boolean(initial[f.name])])),
  );
  const [tags, setTags] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      config.fields.filter((f) => f.type === "tags").map((f) => [f.name, (initial[f.name] as string[] | null) ?? []]),
    ),
  );
  const [slug, setSlug] = useState(String(initial.slug ?? ""));
  const errors = state.errors ?? {};

  // 저장 성공 시 "변경됨" 표시 해제 (렌더 중 상태 보정 패턴)
  const [seenSavedAt, setSeenSavedAt] = useState(state.savedAt);
  if (state.savedAt !== seenSavedAt) {
    setSeenSavedAt(state.savedAt);
    setDirty(false);
  }

  // 저장하지 않고 떠날 때 경고
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // React 19 의 form action 은 제출 후 폼을 초기화하므로, onSubmit 으로 직접 실행해 입력값을 유지한다.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };

  const endDisabled = (name: string) =>
    config.fields.some((f) => f.type === "current" && f.endField === name && current[f.name]);

  const generateSlug = (form: HTMLFormElement | null, sourceFields: string[]) => {
    if (!form) return;
    for (const src of sourceFields) {
      const el = form.elements.namedItem(src) as HTMLInputElement | null;
      const s = el?.value ? slugify(el.value) : "";
      if (s) return setSlug(s);
    }
    // 영문 제목이 없으면 연도 + 임의 문자열
    const year = (form.elements.namedItem("year") as HTMLInputElement | null)?.value || "";
    setSlug(`${config.key === "projects" ? "project" : "pub"}${year ? `-${year}` : ""}-${randomSuffix()}`);
  };

  function renderField(f: FieldDef) {
    const id = `f-${f.name}`;
    const err = errors[f.name];
    const describedBy = err ? `${id}-error` : f.help ? `${id}-help` : undefined;
    const common = {
      id,
      name: f.name,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": describedBy,
      required: f.required,
    } as const;
    const span = f.half ? "sm:col-span-1" : "sm:col-span-2";
    const value = initial[f.name];

    switch (f.type) {
      case "current":
        return (
          <label key={f.name} className={`flex items-center gap-2 text-sm ${span}`}>
            <input
              type="checkbox"
              name={f.name}
              defaultChecked={Boolean(value)}
              onChange={(e) => setCurrent((c) => ({ ...c, [f.name]: e.target.checked }))}
            />
            {f.label} <span className="text-xs text-subtle">(체크하면 종료일을 비웁니다)</span>
          </label>
        );
      case "text":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <input
              {...common}
              type="text"
              defaultValue={(value as string) ?? ""}
              placeholder={f.placeholder}
              list={f.suggestions ? `${id}-list` : undefined}
              className={inputCls}
            />
            {f.suggestions && (
              <datalist id={`${id}-list`}>
                {f.suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </FieldShell>
        );
      case "url":
      case "doi":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <input
              {...common}
              type={f.type === "url" ? "url" : "text"}
              inputMode={f.type === "url" ? "url" : undefined}
              defaultValue={(value as string) ?? ""}
              placeholder={f.placeholder}
              className={inputCls}
            />
          </FieldShell>
        );
      case "number":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <input {...common} type="number" inputMode="numeric" defaultValue={(value as number | null) ?? ""} className={inputCls} />
          </FieldShell>
        );
      case "textarea":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <textarea {...common} rows={4} defaultValue={(value as string) ?? ""} placeholder={f.placeholder} className={inputCls} />
          </FieldShell>
        );
      case "slug":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <div className="flex gap-2">
              <input
                {...common}
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={`${inputCls} font-mono`}
              />
              <button type="button" className={`${btnCls} shrink-0 whitespace-nowrap`} onClick={(e) => generateSlug(e.currentTarget.form, f.sourceFields)}>
                자동 생성
              </button>
            </div>
          </FieldShell>
        );
      case "select":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <select {...common} defaultValue={(value as string) ?? ""} className={inputCls}>
              {!f.required && <option value="">선택 안 함</option>}
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldShell>
        );
      case "month": {
        const disabled = endDisabled(f.name);
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <input
              {...common}
              type="month"
              defaultValue={dateToMonth(value as string | null)}
              disabled={disabled}
              className={inputCls}
              placeholder="YYYY-MM"
            />
          </FieldShell>
        );
      }
      case "tags":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help ?? "Enter 또는 쉼표로 추가"} error={err} className={span}>
            <TagInput
              id={id}
              name={f.name}
              value={tags[f.name] ?? []}
              onChange={(v) => {
                setTags((t) => ({ ...t, [f.name]: v }));
                setDirty(true);
              }}
              suggestions={tagSuggestions[f.group]}
              placeholder={f.placeholder}
              invalid={Boolean(err)}
            />
          </FieldShell>
        );
      case "richtext":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <RichTextEditor id={id} name={f.name} initial={(value as RichDoc | null) ?? null} invalid={Boolean(err)} />
          </FieldShell>
        );
      case "authors":
        return (
          <FieldShell key={f.name} id={id} label={f.label} required={f.required} help={f.help} error={err} className={span}>
            <AuthorsEditor id={id} name={f.name} initial={(value as Author[] | null) ?? []} invalid={Boolean(err)} />
          </FieldShell>
        );
      case "relation":
        return (
          <FieldShell key={f.name} id={id} label={f.label} help={f.help} error={err} className={span}>
            <select {...common} defaultValue={(value as string) ?? ""} className={inputCls}>
              <option value="">없음</option>
              {relations[f.target].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldShell>
        );
      case "relations":
        return (
          <FieldShell key={f.name} id={id} label={f.label} help={f.help} error={err} className={span} as="fieldset">
            <RelationsPicker id={id} name={f.name} options={relations[f.target]} initial={(value as string[] | null) ?? []} />
          </FieldShell>
        );
    }
  }

  return (
    <form onSubmit={onSubmit} onChange={() => setDirty(true)} className="space-y-6" noValidate>
      <div className="grid gap-5 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
        <FieldShell id="f-visibility" label="공개 상태" className="sm:col-span-2" help="초안과 비공개는 공개 페이지에 나오지 않습니다.">
          <select id="f-visibility" name="visibility" defaultValue={(initial.visibility as string) ?? "draft"} className={inputCls}>
            {VISIBILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldShell>
        {config.fields.map(renderField)}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <button type="submit" className={primaryBtnCls} disabled={pending}>
          {pending ? "저장 중…" : isNew ? "저장하고 계속" : "저장"}
        </button>
        <p
          role="status"
          className={`text-sm ${state.ok ? "text-success" : state.message ? "text-danger" : "text-subtle"}`}
        >
          {state.message ?? (dirty ? "저장하지 않은 변경 사항이 있습니다." : isNew ? "저장하면 첨부파일·업무 항목을 추가할 수 있습니다." : "")}
        </p>
      </div>
    </form>
  );
}
