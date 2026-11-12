"use client";

import { useActionState, useRef, useState, startTransition, type FormEvent } from "react";
import Image from "next/image";
import { saveProfile, createAvatarUpload, setPhotoPath, type FormState } from "@/app/admin/actions";
import type { Profile } from "@/lib/types";
import { FieldShell, TagInput, btnCls, inputCls, primaryBtnCls } from "@/components/admin/fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { putToSignedUrl } from "@/components/admin/upload";

const CONTACT_FIELDS = [
  { key: "email", label: "이메일", placeholder: "name@example.com", help: "공개 페이지에서는 '이메일 주소 보기'를 눌러야 보입니다." },
  { key: "scholar", label: "Google Scholar", placeholder: "https://scholar.google.com/citations?user=..." },
  { key: "orcid", label: "ORCID", placeholder: "0000-0000-0000-0000" },
  { key: "researchgate", label: "ResearchGate", placeholder: "https://www.researchgate.net/profile/..." },
  { key: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/..." },
  { key: "website", label: "기타 웹사이트", placeholder: "https://" },
] as const;

export function ProfileForm({ profile, interestSuggestions }: { profile: Profile; interestSuggestions: string[] }) {
  const [state, formAction, pending] = useActionState(saveProfile, { ok: false } as FormState);
  const [interests, setInterests] = useState(profile.interests);
  const errors = state.errors ?? {};

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
        <FieldShell id="p-name" label="이름" required error={errors.name}>
          <input id="p-name" name="name" defaultValue={profile.name} className={inputCls} aria-invalid={errors.name ? true : undefined} />
        </FieldShell>
        <FieldShell id="p-name_en" label="이름 (영문)">
          <input id="p-name_en" name="name_en" defaultValue={profile.name_en ?? ""} className={inputCls} placeholder="Sangwon Lee" />
        </FieldShell>
        <FieldShell id="p-headline" label="헤드라인" className="sm:col-span-2" help="예: OO대학교 사회학과 석사과정 · 노동·불평등·조사방법">
          <input id="p-headline" name="headline" defaultValue={profile.headline ?? ""} className={inputCls} />
        </FieldShell>
        <FieldShell id="p-headline_en" label="헤드라인 (영문)" className="sm:col-span-2">
          <input id="p-headline_en" name="headline_en" defaultValue={profile.headline_en ?? ""} className={inputCls} />
        </FieldShell>
        <FieldShell id="p-bio" label="소개 문단" className="sm:col-span-2">
          <RichTextEditor id="p-bio" name="bio" initial={profile.bio} placeholder="연구 관심사와 지금 하고 있는 연구를 3~5문장으로" />
        </FieldShell>
        <FieldShell id="p-bio_en" label="소개 문단 (영문)" className="sm:col-span-2">
          <RichTextEditor id="p-bio_en" name="bio_en" initial={profile.bio_en} />
        </FieldShell>
        <FieldShell id="p-interests" label="연구 관심사 키워드" className="sm:col-span-2" help="홈 상단에 태그로 표시됩니다.">
          <TagInput id="p-interests" name="interests" value={interests} onChange={setInterests} suggestions={interestSuggestions} />
        </FieldShell>
      </div>

      <fieldset className="grid gap-5 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
        <legend className="px-1 text-sm font-bold">연락처·학술 프로필</legend>
        {CONTACT_FIELDS.map((c) => (
          <FieldShell
            key={c.key}
            id={`p-contact_${c.key}`}
            label={c.label}
            help={"help" in c ? c.help : undefined}
            error={errors[`contact_${c.key}`]}
          >
            <input
              id={`p-contact_${c.key}`}
              name={`contact_${c.key}`}
              defaultValue={profile.contacts[c.key] ?? ""}
              placeholder={c.placeholder}
              className={inputCls}
              aria-invalid={errors[`contact_${c.key}`] ? true : undefined}
            />
          </FieldShell>
        ))}
      </fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <button type="submit" className={primaryBtnCls} disabled={pending}>
          {pending ? "저장 중…" : "프로필 저장"}
        </button>
        <p role="status" className={`text-sm ${state.ok ? "text-success" : "text-danger"}`}>
          {state.message}
        </p>
      </div>
    </form>
  );
}

export function PhotoUploader({ initialUrl, publicBase }: { initialUrl: string | null; publicBase: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError("");
    setProgress(0);
    try {
      const ticket = await createAvatarUpload(file.name, file.size);
      if (!ticket.ok) throw new Error(ticket.error);
      await putToSignedUrl(ticket.signedUrl, file, file.type, setProgress);
      await setPhotoPath(ticket.path);
      setUrl(`${publicBase}/${ticket.path}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {url ? (
        <Image src={url} alt="프로필 사진" width={96} height={96} className="h-24 w-24 rounded-full border border-line object-cover" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-line text-xs text-subtle">
          사진 없음
        </div>
      )}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button type="button" className={btnCls} onClick={() => inputRef.current?.click()} disabled={progress !== null}>
            {progress !== null ? `업로드 중 ${Math.round(progress * 100)}%` : url ? "사진 바꾸기" : "사진 올리기"}
          </button>
          {url && (
            <button
              type="button"
              className={btnCls}
              onClick={async () => {
                await setPhotoPath(null);
                setUrl(null);
              }}
            >
              삭제
            </button>
          )}
        </div>
        <p className="text-xs text-subtle">PNG·JPG·WEBP, 5MB 이하. 정사각형 사진을 권장합니다.</p>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
