"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { sessionClient } from "@/lib/supabase/server";
import { isOwnerEmail, requireOwner } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/data";
import { ATTACHMENT_BUCKET, AVATAR_BUCKET, MAX_UPLOAD_MB, SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { mimeFor, safeStorageName, stripExtension, guessKind, extensionOf } from "@/lib/files";
import { monthToDate } from "@/lib/format";
import { normalizeSectionOrder } from "@/lib/labels";
import {
  DOI_RE,
  SLUG_RE,
  getSection,
  isHttpUrl,
  normalizeDoi,
  type FieldDef,
  type SectionConfig,
} from "@/lib/sections";
import type { Attachment, AttachmentKind, EntityType, EntryItem, SectionOrderEntry, Visibility } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* 공통                                                                */
/* ------------------------------------------------------------------ */

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  savedAt?: number;
};

/** 저장 후 공개 페이지를 즉시 다시 만들게 한다 (재배포 없이 반영, 목표 10초 이내). */
function refreshPublic() {
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISIBILITIES: Visibility[] = ["draft", "public", "private"];

function str(fd: FormData, name: string): string {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function parseJson<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function cleanTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of v) {
    if (typeof t !== "string") continue;
    const s = t.trim().slice(0, 60);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out.slice(0, 40);
}

function isEmptyRich(doc: unknown): boolean {
  const walk = (n: unknown): string => {
    if (!n || typeof n !== "object") return "";
    const node = n as { text?: string; content?: unknown[] };
    return (node.text ?? "") + (node.content ?? []).map(walk).join("");
  };
  return walk(doc).trim() === "";
}

/* ------------------------------------------------------------------ */
/* 로그인 (A-01)                                                       */
/* ------------------------------------------------------------------ */

export async function sendMagicLink(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase 환경변수가 설정되지 않았습니다." };
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, errors: { email: "이메일 형식이 올바르지 않습니다." } };
  }
  // 관리자 이메일이 아니면 메일을 보내지 않지만, 응답은 같게 해서 관리자 주소를 추측할 수 없게 한다.
  if (isOwnerEmail(email)) {
    const h = await headers();
    const origin = h.get("origin") || SITE_URL;
    const supabase = await sessionClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: true },
    });
    // 오류도 같은 응답으로 돌려 관리자 주소를 추측할 수 없게 한다. 실제 원인은 서버 로그(Vercel Logs)에서 확인.
    if (error) console.error("[auth] signInWithOtp:", error.message);
  }
  return { ok: true, message: "관리자 이메일이라면 로그인 링크를 보냈습니다. 메일함을 확인하세요." };
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* 섹션 항목 CRUD (A-02, A-04, A-06, A-08)                              */
/* ------------------------------------------------------------------ */

function parseField(f: FieldDef, fd: FormData, errors: Record<string, string>): unknown {
  const raw = str(fd, f.name);
  const need = (cond: boolean) => {
    if (f.required && cond) errors[f.name] = `${f.label}은(는) 필수입니다.`;
  };
  switch (f.type) {
    case "text":
    case "textarea": {
      need(!raw);
      return raw || null;
    }
    case "url": {
      need(!raw);
      if (raw && !isHttpUrl(raw)) errors[f.name] = "http:// 또는 https:// 로 시작하는 주소를 입력하세요.";
      return raw || null;
    }
    case "doi": {
      const doi = normalizeDoi(raw);
      need(!doi);
      if (doi && !DOI_RE.test(doi)) errors[f.name] = "DOI 형식이 아닙니다. 예: 10.1177/0003122420912345";
      return doi || null;
    }
    case "number": {
      need(!raw);
      if (!raw) return null;
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        errors[f.name] = "정수를 입력하세요.";
        return null;
      }
      if (f.name === "year" && (n < 1900 || n > 2100)) errors[f.name] = "1900–2100 사이의 연도를 입력하세요.";
      return n;
    }
    case "slug": {
      const slug = raw.toLowerCase();
      need(!slug);
      if (slug && !SLUG_RE.test(slug)) errors[f.name] = "영문 소문자, 숫자, 하이픈(-)만 쓸 수 있습니다.";
      return slug || null;
    }
    case "select": {
      need(!raw);
      if (raw && !f.options.some((o) => o.value === raw)) errors[f.name] = "목록에서 선택하세요.";
      return raw || null;
    }
    case "month": {
      need(!raw);
      const d = monthToDate(raw);
      if (raw && !d) errors[f.name] = "연·월을 선택하세요.";
      return d;
    }
    case "current":
      return fd.get(f.name) === "on";
    case "tags":
      return cleanTags(parseJson(raw, []));
    case "richtext": {
      const doc = parseJson<unknown>(raw, null);
      const empty = !doc || isEmptyRich(doc);
      need(empty);
      return empty ? null : doc;
    }
    case "authors": {
      const list = parseJson<{ name?: unknown; is_me?: unknown }[]>(raw, []);
      const authors = (Array.isArray(list) ? list : [])
        .map((a) => ({ name: typeof a.name === "string" ? a.name.trim() : "", is_me: a.is_me === true }))
        .filter((a) => a.name);
      need(authors.length === 0);
      return authors;
    }
    case "relation":
      if (raw && !UUID_RE.test(raw)) errors[f.name] = "잘못된 선택입니다.";
      return raw || null;
    case "relations":
      return parseJson<unknown[]>(raw, []).filter((v): v is string => typeof v === "string" && UUID_RE.test(v));
  }
}

function buildRow(cfg: SectionConfig, fd: FormData) {
  const errors: Record<string, string> = {};
  const row: Record<string, unknown> = {};
  for (const f of cfg.fields) row[f.name] = parseField(f, fd, errors);

  const visibility = str(fd, "visibility") as Visibility;
  row.visibility = VISIBILITIES.includes(visibility) ? visibility : "draft";

  // "현재" 체크 시 종료일 비움 (A-04)
  for (const f of cfg.fields) {
    if (f.type === "current" && row[f.name] === true) row[f.endField] = null;
  }
  // 종료일 ≥ 시작일 (A-08)
  if (cfg.dateRange) {
    const [s, e] = cfg.dateRange;
    if (row[s] && row[e] && String(row[e]) < String(row[s])) errors[e] = "종료일은 시작일보다 같거나 늦어야 합니다.";
  }
  return { row, errors };
}

export async function saveEntity(sectionKey: string, id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireOwner();
  const cfg = getSection(sectionKey);
  if (!cfg) return { ok: false, message: "알 수 없는 섹션입니다." };
  if (id && !UUID_RE.test(id)) return { ok: false, message: "잘못된 항목입니다." };

  const { row, errors } = buildRow(cfg, fd);
  const db = adminClient();

  // slug 중복 (A-08)
  if (typeof row.slug === "string" && !errors.slug) {
    let q = db.from(cfg.table).select("id").eq("slug", row.slug);
    if (id) q = q.neq("id", id);
    const { data } = await q.limit(1);
    if (data && data.length) errors.slug = "이미 사용 중인 주소입니다. 다른 slug 를 입력하세요.";
  }
  if (Object.keys(errors).length) {
    return { ok: false, errors, message: "입력값을 확인하세요." };
  }

  let savedId = id;
  if (id) {
    const { error } = await db.from(cfg.table).update(row).eq("id", id);
    if (error) return { ok: false, message: dbMessage(error) };
  } else {
    // 새 항목은 목록 맨 위에
    const { data: first } = await db.from(cfg.table).select("sort_order").order("sort_order").limit(1);
    row.sort_order = (first?.[0]?.sort_order ?? 0) - 1;
    const { data, error } = await db.from(cfg.table).insert(row).select("id").single();
    if (error) return { ok: false, message: dbMessage(error) };
    savedId = data.id;
  }

  refreshPublic();
  if (!id) redirect(`/admin/${cfg.key}/${savedId}?created=1`);
  return { ok: true, message: "저장했습니다. 공개 페이지에 바로 반영됩니다.", savedAt: Date.now() };
}

function dbMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "중복된 값이 있습니다 (slug 등).";
  if (error.code === "23514") return "입력값이 허용 범위를 벗어났습니다 (기간·형식 확인).";
  return `저장 실패: ${error.message}`;
}

export async function deleteEntity(sectionKey: string, id: string) {
  await requireOwner();
  const cfg = getSection(sectionKey);
  if (!cfg || !UUID_RE.test(id)) throw new Error("잘못된 요청입니다.");
  const db = adminClient();

  // 연결된 첨부파일과 업무 항목도 함께 삭제 (F-11)
  if (cfg.attachEntity) await removeAttachmentsOf(cfg.attachEntity, id);
  if (cfg.itemsParent) await db.from("entry_items").delete().eq("parent_type", cfg.itemsParent).eq("parent_id", id);
  // 다른 항목의 참조 정리
  if (cfg.table === "projects") {
    const { data: interests } = await db.from("research_interests").select("id, project_ids").contains("project_ids", [id]);
    for (const it of interests ?? []) {
      await db.from("research_interests").update({ project_ids: it.project_ids.filter((x: string) => x !== id) }).eq("id", it.id);
    }
  }
  if (cfg.table === "publications") {
    const { data: interests } = await db.from("research_interests").select("id, publication_ids").contains("publication_ids", [id]);
    for (const it of interests ?? []) {
      await db
        .from("research_interests")
        .update({ publication_ids: it.publication_ids.filter((x: string) => x !== id) })
        .eq("id", it.id);
    }
  }

  const { error } = await db.from(cfg.table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  refreshPublic();
  redirect(`/admin/${cfg.key}?deleted=1`);
}

/** 드래그로 바꾼 순서 저장 (A-09) */
export async function reorderEntities(sectionKey: string, ids: string[]) {
  await requireOwner();
  const cfg = getSection(sectionKey);
  if (!cfg) throw new Error("알 수 없는 섹션입니다.");
  await reorder(cfg.table, ids);
  refreshPublic();
}

async function reorder(table: string, ids: string[]) {
  const valid = ids.filter((id) => UUID_RE.test(id));
  const db = adminClient();
  await Promise.all(valid.map((id, i) => db.from(table).update({ sort_order: i }).eq("id", id)));
}

export async function setEntityVisibility(sectionKey: string, id: string, visibility: Visibility) {
  await requireOwner();
  const cfg = getSection(sectionKey);
  if (!cfg || !UUID_RE.test(id) || !VISIBILITIES.includes(visibility)) throw new Error("잘못된 요청입니다.");
  const { error } = await adminClient().from(cfg.table).update({ visibility }).eq("id", id);
  if (error) throw new Error(error.message);
  refreshPublic();
}

/* ------------------------------------------------------------------ */
/* 프로필                                                              */
/* ------------------------------------------------------------------ */

const CONTACT_KEYS = ["email", "scholar", "orcid", "researchgate", "github", "linkedin", "website"] as const;

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireOwner();
  const errors: Record<string, string> = {};
  const name = str(fd, "name");
  if (!name) errors.name = "이름은 필수입니다.";

  const contacts: Record<string, string> = {};
  for (const k of CONTACT_KEYS) {
    const v = str(fd, `contact_${k}`);
    if (!v) continue;
    if (k === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[`contact_${k}`] = "이메일 형식이 아닙니다.";
    } else if (k === "orcid") {
      if (!/^(https:\/\/orcid\.org\/)?\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(v)) errors[`contact_${k}`] = "ORCID 형식: 0000-0000-0000-0000";
    } else if (!isHttpUrl(v)) {
      errors[`contact_${k}`] = "https:// 로 시작하는 주소를 입력하세요.";
    }
    contacts[k] = v;
  }
  if (Object.keys(errors).length) return { ok: false, errors, message: "입력값을 확인하세요." };

  const bio = parseJson<unknown>(str(fd, "bio"), null);
  const bioEn = parseJson<unknown>(str(fd, "bio_en"), null);
  const db = adminClient();
  const { error } = await db
    .from("profile")
    .update({
      name,
      name_en: str(fd, "name_en") || null,
      headline: str(fd, "headline") || null,
      headline_en: str(fd, "headline_en") || null,
      bio: bio && !isEmptyRich(bio) ? bio : null,
      bio_en: bioEn && !isEmptyRich(bioEn) ? bioEn : null,
      interests: cleanTags(parseJson(str(fd, "interests"), [])),
      contacts,
    })
    .eq("singleton", true);
  if (error) return { ok: false, message: dbMessage(error) };
  refreshPublic();
  return { ok: true, message: "프로필을 저장했습니다.", savedAt: Date.now() };
}

export async function saveSectionOrder(order: SectionOrderEntry[]) {
  await requireOwner();
  const { error } = await adminClient()
    .from("profile")
    .update({ section_order: normalizeSectionOrder(order) })
    .eq("singleton", true);
  if (error) throw new Error(error.message);
  refreshPublic();
}

export async function setCvAttachment(attachmentId: string | null) {
  await requireOwner();
  if (attachmentId && !UUID_RE.test(attachmentId)) throw new Error("잘못된 요청입니다.");
  const { error } = await adminClient().from("profile").update({ cv_attachment_id: attachmentId }).eq("singleton", true);
  if (error) throw new Error(error.message);
  refreshPublic();
}

export async function createAvatarUpload(
  fileName: string,
  size: number,
): Promise<{ ok: true; signedUrl: string; path: string } | { ok: false; error: string }> {
  await requireOwner();
  const ext = extensionOf(fileName);
  if (!["png", "jpg", "jpeg", "webp"].includes(ext)) return { ok: false, error: "PNG, JPG, WEBP 이미지만 올릴 수 있습니다." };
  if (size > 5 * 1024 * 1024) return { ok: false, error: "프로필 사진은 5MB 이하여야 합니다." };
  const path = `profile/${crypto.randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  const { data, error } = await adminClient().storage.from(AVATAR_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: error?.message ?? "업로드 URL 을 만들지 못했습니다." };
  return { ok: true, signedUrl: data.signedUrl, path };
}

export async function setPhotoPath(path: string | null) {
  await requireOwner();
  if (path && !/^profile\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path)) throw new Error("잘못된 경로입니다.");
  const db = adminClient();
  const { data: prev } = await db.from("profile").select("photo_path").eq("singleton", true).maybeSingle();
  const { error } = await db.from("profile").update({ photo_path: path }).eq("singleton", true);
  if (error) throw new Error(error.message);
  if (prev?.photo_path && prev.photo_path !== path) await db.storage.from(AVATAR_BUCKET).remove([prev.photo_path]);
  refreshPublic();
}

/* ------------------------------------------------------------------ */
/* 업무 항목 (A-03)                                                     */
/* ------------------------------------------------------------------ */

export type EntryItemInput = {
  text: string;
  metrics: string[];
  evidence_url: string;
  tags: string[];
  last_used: string; // YYYY-MM
};

export async function saveEntryItem(
  parentType: "project" | "experience",
  parentId: string,
  itemId: string | null,
  input: EntryItemInput,
): Promise<{ ok: true; item: EntryItem } | { ok: false; error: string }> {
  await requireOwner();
  if (!["project", "experience"].includes(parentType) || !UUID_RE.test(parentId)) return { ok: false, error: "잘못된 요청입니다." };
  if (itemId && !UUID_RE.test(itemId)) return { ok: false, error: "잘못된 요청입니다." };
  const text = input.text?.trim() ?? "";
  if (!text) return { ok: false, error: "문장을 입력하세요." };
  const evidence = input.evidence_url?.trim() ?? "";
  if (evidence && !isHttpUrl(evidence)) return { ok: false, error: "근거 링크는 https:// 로 시작해야 합니다." };

  const row = {
    parent_type: parentType,
    parent_id: parentId,
    text: text.slice(0, 1000),
    metrics: cleanTags(input.metrics),
    evidence_url: evidence || null,
    tags: cleanTags(input.tags),
    last_used: monthToDate(input.last_used),
  };
  const db = adminClient();
  let nextOrder = 0;
  if (!itemId) {
    const { data: last } = await db
      .from("entry_items")
      .select("sort_order")
      .eq("parent_type", parentType)
      .eq("parent_id", parentId)
      .order("sort_order", { ascending: false })
      .limit(1);
    nextOrder = (last?.[0]?.sort_order ?? -1) + 1;
  }
  const query = itemId
    ? db.from("entry_items").update(row).eq("id", itemId).select("*").single()
    : db
        .from("entry_items")
        .insert({ ...row, visibility: "public", sort_order: nextOrder })
        .select("*")
        .single();
  const { data, error } = await query;
  if (error) return { ok: false, error: dbMessage(error) };
  refreshPublic();
  return { ok: true, item: data as EntryItem };
}

export async function deleteEntryItem(itemId: string) {
  await requireOwner();
  if (!UUID_RE.test(itemId)) throw new Error("잘못된 요청입니다.");
  const { error } = await adminClient().from("entry_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  refreshPublic();
}

export async function reorderEntryItems(ids: string[]) {
  await requireOwner();
  await reorder("entry_items", ids);
  refreshPublic();
}

/* ------------------------------------------------------------------ */
/* 첨부파일 (F-01 ~ F-09)                                               */
/* ------------------------------------------------------------------ */

const ENTITY_TABLE: Record<EntityType, string> = {
  project: "projects",
  publication: "publications",
  experience: "experiences",
  profile: "profile",
};

async function assertEntity(entityType: EntityType, entityId: string) {
  if (!ENTITY_TABLE[entityType] || !UUID_RE.test(entityId)) throw new Error("잘못된 첨부 대상입니다.");
  const { data } = await adminClient().from(ENTITY_TABLE[entityType]).select("id").eq("id", entityId).maybeSingle();
  if (!data) throw new Error("첨부 대상 항목이 없습니다. 먼저 항목을 저장하세요.");
}

function validateFile(fileName: string, size: number) {
  if (!mimeFor(fileName)) throw new Error("허용되지 않는 형식입니다. PDF, DOCX, HWP·HWPX, PPTX, XLSX, CSV, PNG, JPG 만 올릴 수 있습니다.");
  if (!Number.isFinite(size) || size <= 0) throw new Error("빈 파일입니다.");
  if (size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`파일당 최대 ${MAX_UPLOAD_MB}MB 까지 올릴 수 있습니다.`);
}

/**
 * 서명 업로드 URL 발급 (F-04). 파일은 이 URL 로 브라우저에서 Storage 에 직접 올라가므로
 * Vercel 함수의 4.5MB 본문 제한을 거치지 않는다.
 */
export async function createUploadUrl(input: {
  entityType: EntityType;
  entityId: string;
  fileName: string;
  size: number;
  ethicsChecked: boolean;
}): Promise<{ ok: true; signedUrl: string; path: string; contentType: string } | { ok: false; error: string }> {
  await requireOwner();
  try {
    if (input.ethicsChecked !== true) throw new Error("연구윤리 확인 항목에 체크해야 업로드할 수 있습니다.");
    validateFile(input.fileName, input.size);
    await assertEntity(input.entityType, input.entityId);
    const path = `${input.entityType}/${input.entityId}/${crypto.randomUUID()}-${safeStorageName(input.fileName)}`;
    const { data, error } = await adminClient().storage.from(ATTACHMENT_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "업로드 URL 을 만들지 못했습니다.");
    return { ok: true, signedUrl: data.signedUrl, path, contentType: mimeFor(input.fileName)! };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function registerAttachment(input: {
  entityType: EntityType;
  entityId: string;
  path: string;
  fileName: string;
  size: number;
  ethicsChecked: boolean;
}): Promise<{ ok: true; attachment: Attachment } | { ok: false; error: string }> {
  await requireOwner();
  try {
    if (input.ethicsChecked !== true) throw new Error("연구윤리 확인이 필요합니다.");
    validateFile(input.fileName, input.size);
    await assertEntity(input.entityType, input.entityId);
    const prefix = `${input.entityType}/${input.entityId}/`;
    if (!input.path.startsWith(prefix) || input.path.includes("..")) throw new Error("잘못된 저장 경로입니다.");

    const db = adminClient();
    const { data: last } = await db
      .from("attachments")
      .select("sort_order")
      .eq("entity_type", input.entityType)
      .eq("entity_id", input.entityId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const kind: AttachmentKind = input.entityType === "profile" ? "cv" : guessKind(input.fileName);
    const { data, error } = await db
      .from("attachments")
      .insert({
        entity_type: input.entityType,
        entity_id: input.entityId,
        storage_path: input.path,
        display_name: stripExtension(input.fileName).slice(0, 200) || input.fileName,
        original_name: input.fileName.slice(0, 255),
        kind,
        mime: mimeFor(input.fileName)!,
        size_bytes: input.size,
        // 기본은 비공개. 확인 후 관리자가 공개로 바꾼다.
        visibility: "private",
        version_type: input.entityType === "publication" ? "preprint" : null,
        ethics_checked: true,
        sort_order: (last?.[0]?.sort_order ?? -1) + 1,
      })
      .select("*")
      .single();
    if (error) throw new Error(dbMessage(error));
    refreshPublic();
    return { ok: true, attachment: data as Attachment };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateAttachment(
  id: string,
  patch: Partial<Pick<Attachment, "display_name" | "description" | "kind" | "visibility" | "version_type">>,
): Promise<{ ok: true; attachment: Attachment } | { ok: false; error: string }> {
  await requireOwner();
  if (!UUID_RE.test(id)) return { ok: false, error: "잘못된 요청입니다." };
  const row: Record<string, unknown> = {};
  if (patch.display_name !== undefined) {
    const v = patch.display_name.trim();
    if (!v) return { ok: false, error: "표시 이름을 입력하세요." };
    row.display_name = v.slice(0, 200);
  }
  if (patch.description !== undefined) row.description = patch.description?.trim() || null;
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.visibility !== undefined) {
    if (!["public", "private"].includes(patch.visibility)) return { ok: false, error: "잘못된 공개 설정입니다." };
    row.visibility = patch.visibility;
  }
  if (patch.version_type !== undefined) row.version_type = patch.version_type;
  const { data, error } = await adminClient().from("attachments").update(row).eq("id", id).select("*").single();
  if (error) return { ok: false, error: dbMessage(error) };
  refreshPublic();
  return { ok: true, attachment: data as Attachment };
}

async function removeAttachmentsOf(entityType: EntityType, entityId: string) {
  const db = adminClient();
  const { data } = await db.from("attachments").select("id, storage_path").eq("entity_type", entityType).eq("entity_id", entityId);
  if (!data?.length) return;
  // DB 행을 먼저 지워 공개 페이지에서 사라지게 하고, 그다음 파일을 지운다.
  const del = await db.from("attachments").delete().in("id", data.map((d) => d.id));
  if (del.error) throw new Error(del.error.message);
  const rm = await db.storage.from(ATTACHMENT_BUCKET).remove(data.map((d) => d.storage_path));
  if (rm.error) console.error("[storage] remove:", rm.error.message);
}

export async function deleteAttachment(id: string) {
  await requireOwner();
  if (!UUID_RE.test(id)) throw new Error("잘못된 요청입니다.");
  const db = adminClient();
  const { data } = await db.from("attachments").select("storage_path").eq("id", id).maybeSingle();
  if (!data) return;
  await db.from("profile").update({ cv_attachment_id: null }).eq("cv_attachment_id", id);
  const del = await db.from("attachments").delete().eq("id", id);
  if (del.error) throw new Error(del.error.message);
  const rm = await db.storage.from(ATTACHMENT_BUCKET).remove([data.storage_path]);
  if (rm.error) console.error("[storage] remove:", rm.error.message);
  refreshPublic();
}

export async function reorderAttachments(ids: string[]) {
  await requireOwner();
  await reorder("attachments", ids);
  refreshPublic();
}
