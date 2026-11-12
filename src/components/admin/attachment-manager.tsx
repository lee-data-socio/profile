"use client";

import { useId, useRef, useState, useTransition, type DragEvent } from "react";
import {
  createUploadUrl,
  deleteAttachment,
  registerAttachment,
  reorderAttachments,
  setCvAttachment,
  updateAttachment,
} from "@/app/admin/actions";
import type { Attachment, AttachmentKind, EntityType } from "@/lib/types";
import { ATTACHMENT_KIND_LABEL, VERSION_TYPE_LABEL } from "@/lib/labels";
import { ACCEPT_ATTRIBUTE, fileTypeLabel, isImage, mimeFor } from "@/lib/files";
import { formatBytes } from "@/lib/format";
import { SortableList } from "@/components/admin/sortable";
import { btnCls, dangerBtnCls, inputCls } from "@/components/admin/fields";
import { putToSignedUrl } from "@/components/admin/upload";

type Upload = {
  key: string;
  file: File;
  progress: number;
  status: "uploading" | "error";
  error?: string;
};

export function AttachmentManager({
  entityType,
  entityId,
  initial,
  maxMb,
  cvAttachmentId,
}: {
  entityType: EntityType;
  entityId: string;
  initial: Attachment[];
  maxMb: number;
  /** 프로필(CV) 모드일 때 현재 지정된 CV */
  cvAttachmentId?: string | null;
}) {
  const [files, setFiles] = useState(initial);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [ethics, setEthics] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cvId, setCvId] = useState(cvAttachmentId ?? null);
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const ethicsId = useId();
  const isProfile = entityType === "profile";
  const isPublication = entityType === "publication";

  /* ---------------- 업로드 ---------------- */

  const runUpload = async (u: Upload) => {
    const patch = (p: Partial<Upload>) => setUploads((list) => list.map((x) => (x.key === u.key ? { ...x, ...p } : x)));
    patch({ status: "uploading", progress: 0, error: undefined });
    try {
      const ticket = await createUploadUrl({
        entityType,
        entityId,
        fileName: u.file.name,
        size: u.file.size,
        ethicsChecked: ethics,
      });
      if (!ticket.ok) throw new Error(ticket.error);
      await putToSignedUrl(ticket.signedUrl, u.file, ticket.contentType, (r) => patch({ progress: r }));
      const reg = await registerAttachment({
        entityType,
        entityId,
        path: ticket.path,
        fileName: u.file.name,
        size: u.file.size,
        ethicsChecked: ethics,
      });
      if (!reg.ok) throw new Error(reg.error);
      setFiles((list) => [...list, reg.attachment]);
      setUploads((list) => list.filter((x) => x.key !== u.key));
      setMessage(`${u.file.name} 업로드 완료 (기본 비공개)`);
    } catch (e) {
      patch({ status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  };

  const addFiles = (list: FileList | File[]) => {
    if (!ethics) {
      setRejected(["먼저 연구윤리 확인 항목에 체크하세요."]);
      return;
    }
    const bad: string[] = [];
    const ok: Upload[] = [];
    for (const file of Array.from(list)) {
      if (!mimeFor(file.name)) bad.push(`${file.name}: 허용되지 않는 형식`);
      else if (file.size > maxMb * 1024 * 1024) bad.push(`${file.name}: ${maxMb}MB 초과 (${formatBytes(file.size)})`);
      else if (file.size === 0) bad.push(`${file.name}: 빈 파일`);
      else ok.push({ key: `${file.name}-${file.size}-${Math.random()}`, file, progress: 0, status: "uploading" });
    }
    setRejected(bad);
    setUploads((u) => [...u, ...ok]);
    ok.forEach((u) => void runUpload(u));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  /* ---------------- 메타데이터 ---------------- */

  const patchFile = (id: string, patch: Parameters<typeof updateAttachment>[1]) => {
    const prev = files;
    setFiles((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    startTransition(async () => {
      const res = await updateAttachment(id, patch);
      if (!res.ok) {
        setFiles(prev);
        setMessage(res.error);
      } else setMessage("저장했습니다.");
    });
  };

  const remove = (f: Attachment) => {
    if (!window.confirm(`"${f.display_name}" 파일을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    startTransition(async () => {
      await deleteAttachment(f.id);
      setFiles((list) => list.filter((x) => x.id !== f.id));
      if (cvId === f.id) setCvId(null);
      setMessage("삭제했습니다.");
    });
  };

  const reorder = (next: Attachment[]) => {
    setFiles(next);
    startTransition(async () => {
      await reorderAttachments(next.map((f) => f.id));
    });
  };

  const chooseCv = (id: string | null) => {
    setCvId(id);
    startTransition(async () => {
      await setCvAttachment(id);
      setMessage(id ? "CV 로 지정했습니다. 공개 상태여야 방문자가 내려받을 수 있습니다." : "CV 지정을 해제했습니다.");
    });
  };

  return (
    <div className="space-y-4">
      {/* 연구윤리 확인 (F-07) */}
      <label htmlFor={ethicsId} className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/5 p-3 text-sm">
        <input id={ethicsId} type="checkbox" className="mt-0.5" checked={ethics} onChange={(e) => setEthics(e.target.checked)} />
        <span>
          <strong>연구윤리 확인 (필수)</strong> — 올리는 파일에 연구참여자 식별정보나 원자료(녹취록, 응답 원자료 등)가 포함되어
          있지 않음을 확인합니다.
        </span>
      </label>

      {/* 드롭존 (F-04) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (ethics) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
          !ethics ? "border-line opacity-60" : dragOver ? "border-accent bg-accent-soft" : "border-line"
        }`}
      >
        <p className="text-sm">파일을 여기로 끌어 놓거나</p>
        <button type="button" className={`${btnCls} mt-2`} disabled={!ethics} onClick={() => inputRef.current?.click()}>
          파일 선택 (여러 개 가능)
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple={!isProfile}
          accept={isProfile ? ".pdf" : ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-subtle">
          {isProfile ? "PDF" : "PDF, DOCX, HWP·HWPX, PPTX, XLSX, CSV, PNG, JPG"} · 파일당 최대 {maxMb}MB
        </p>
      </div>

      {rejected.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {rejected.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      {/* 진행 중 업로드 */}
      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.key} className="rounded-lg border border-line bg-surface p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{u.file.name}</span>
                <span className="shrink-0 text-xs text-subtle">{formatBytes(u.file.size)}</span>
              </div>
              {u.status === "uploading" ? (
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
                  role="progressbar"
                  aria-label={`${u.file.name} 업로드 진행률`}
                  aria-valuenow={Math.round(u.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(u.progress * 100)}%` }} />
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-danger">{u.error}</span>
                  <button type="button" className={`${btnCls} px-2 py-1 text-xs`} onClick={() => void runUpload(u)}>
                    다시 시도
                  </button>
                  <button
                    type="button"
                    className={`${btnCls} px-2 py-1 text-xs`}
                    onClick={() => setUploads((l) => l.filter((x) => x.key !== u.key))}
                  >
                    목록에서 제거
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-subtle" aria-live="polite">
        {message}
      </p>

      {/* 올린 파일 (F-05, F-06, F-08) */}
      {files.length > 0 && (
        <SortableList
          label="첨부파일 목록"
          items={files}
          onReorder={reorder}
          renderItem={(f, handle) => (
            <div className="flex gap-2 rounded-lg border border-line bg-surface p-3">
              {handle}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                  <span className="rounded border border-line px-1.5 py-0.5 font-bold">{fileTypeLabel(f.original_name)}</span>
                  <span className="truncate">{f.original_name}</span>
                  <span>{formatBytes(f.size_bytes)}</span>
                  <a href={`/api/files/${f.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {isImage(f.mime) || f.mime === "application/pdf" ? "미리보기" : "열기"}
                  </a>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-subtle">
                    표시 이름
                    <input
                      defaultValue={f.display_name}
                      onBlur={(e) => e.target.value.trim() !== f.display_name && patchFile(f.id, { display_name: e.target.value })}
                      className={`${inputCls} mt-1`}
                    />
                  </label>
                  <label className="text-xs text-subtle">
                    종류
                    <select
                      value={f.kind}
                      onChange={(e) => patchFile(f.id, { kind: e.target.value as AttachmentKind })}
                      className={`${inputCls} mt-1`}
                    >
                      {(Object.keys(ATTACHMENT_KIND_LABEL) as AttachmentKind[]).map((k) => (
                        <option key={k} value={k}>
                          {ATTACHMENT_KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-subtle sm:col-span-2">
                    설명
                    <input
                      defaultValue={f.description ?? ""}
                      onBlur={(e) => e.target.value.trim() !== (f.description ?? "") && patchFile(f.id, { description: e.target.value })}
                      className={`${inputCls} mt-1`}
                      placeholder="선택"
                    />
                  </label>
                  <label className="text-xs text-subtle">
                    공개 여부
                    <select
                      value={f.visibility === "public" ? "public" : "private"}
                      onChange={(e) => patchFile(f.id, { visibility: e.target.value as "public" | "private" })}
                      className={`${inputCls} mt-1 ${f.visibility === "public" ? "text-success" : ""}`}
                    >
                      <option value="private">비공개 — 관리자만</option>
                      <option value="public">공개 — 누구나 다운로드</option>
                    </select>
                  </label>
                  {isPublication && (
                    <label className="text-xs text-subtle">
                      논문 버전
                      <select
                        value={f.version_type ?? ""}
                        onChange={(e) =>
                          patchFile(f.id, { version_type: (e.target.value || null) as Attachment["version_type"] })
                        }
                        className={`${inputCls} mt-1`}
                      >
                        <option value="">해당 없음</option>
                        <option value="preprint">{VERSION_TYPE_LABEL.preprint}</option>
                        <option value="published">{VERSION_TYPE_LABEL.published}</option>
                      </select>
                    </label>
                  )}
                </div>
                {isPublication && f.version_type === "published" && (
                  <p className="rounded bg-warn/10 p-2 text-xs text-warn">
                    게재본은 출판사 셀프 아카이빙 정책에 따라 공개가 금지될 수 있습니다.{" "}
                    <a href="https://v2.sherpa.ac.uk/romeo/" target="_blank" rel="noopener noreferrer" className="underline">
                      Sherpa Romeo
                    </a>{" "}
                    등에서 학술지 정책을 확인한 뒤 공개하세요.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {isProfile && (
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="radio" name="cv-choice" checked={cvId === f.id} onChange={() => chooseCv(f.id)} />
                      홈의 &lsquo;CV 다운로드&rsquo;에 사용
                    </label>
                  )}
                  <button type="button" className={`${dangerBtnCls} ml-auto px-2 py-1 text-xs`} onClick={() => remove(f)}>
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      )}
      {isProfile && cvId && (
        <button type="button" className={`${btnCls} text-xs`} onClick={() => chooseCv(null)}>
          CV 지정 해제
        </button>
      )}
    </div>
  );
}
