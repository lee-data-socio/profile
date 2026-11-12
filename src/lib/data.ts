import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import { normalizeSectionOrder, TEACHING_TYPES } from "@/lib/labels";
import type {
  Activity,
  Attachment,
  Award,
  EntityType,
  EntryItem,
  Education,
  Experience,
  Profile,
  Project,
  Publication,
  ResearchInterest,
  SkillStat,
  Skill,
} from "@/lib/types";

/**
 * 공개 페이지용 데이터 함수. 모두 "use cache" + cacheTag(CONTENT_TAG) 로 묶여 있어
 * 정적 셸에 들어가고, 관리자가 저장하면 updateTag(CONTENT_TAG) 로 한꺼번에 무효화된다.
 * RLS 때문에 공개(visibility='public') 행만 받는다.
 */
export const CONTENT_TAG = "content";

function mark() {
  // 관리자 저장 시에는 updateTag 로 즉시 갱신된다. 대시보드에서 직접 고친 내용도 1시간 안에 반영되도록 hours.
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
}

/**
 * 조회 실패는 throw 한다. "use cache" 는 예외를 캐시하지 않으므로, 일시 장애 때 빈 사이트가
 * 캐시에 굳는 일을 막는다 (빌드 중 실패하면 배포가 실패하고 기존 배포가 유지된다).
 */
function fail(what: string, message: string): never {
  throw new Error(`[data] ${what}: ${message} — supabase/migrations/0001_init.sql 을 실행했는지, 환경변수가 맞는지 확인하세요.`);
}

async function selectAll<T>(table: string, order: { column: string; ascending: boolean }[] = []): Promise<T[]> {
  const db = publicClient();
  if (!db) return [];
  let q = db.from(table).select("*");
  for (const o of order) q = q.order(o.column, { ascending: o.ascending, nullsFirst: false });
  q = q.order("sort_order", { ascending: true });
  const { data, error } = await q;
  if (error) fail(table, error.message);
  return (data ?? []) as T[];
}

const EMPTY_PROFILE: Profile = {
  id: "",
  visibility: "public",
  sort_order: 0,
  created_at: "",
  updated_at: "",
  name: "이름을 입력하세요",
  name_en: null,
  headline: null,
  headline_en: null,
  bio: null,
  bio_en: null,
  interests: [],
  contacts: {},
  photo_path: null,
  cv_attachment_id: null,
  section_order: normalizeSectionOrder(null),
};

export async function getProfile(): Promise<Profile> {
  "use cache";
  mark();
  const db = publicClient();
  if (!db) return EMPTY_PROFILE;
  const { data, error } = await db.from("profile").select("*").limit(1).maybeSingle();
  if (error) fail("profile", error.message);
  if (!data) return EMPTY_PROFILE;
  return {
    ...(data as Profile),
    contacts: (data.contacts ?? {}) as Profile["contacts"],
    section_order: normalizeSectionOrder(data.section_order),
  };
}

export async function getInterests() {
  "use cache";
  mark();
  return selectAll<ResearchInterest>("research_interests");
}

export async function getEducation() {
  "use cache";
  mark();
  // sort_order 를 먼저 쓰고, 같으면 최신순
  const rows = await selectAll<Education>("education", [{ column: "start_date", ascending: false }]);
  return rows;
}

export async function getPublications() {
  "use cache";
  mark();
  return selectAll<Publication>("publications", [{ column: "year", ascending: false }]);
}

export async function getPublication(slug: string) {
  "use cache";
  mark();
  const rows = await getPublications();
  return rows.find((p) => p.slug === slug) ?? null;
}

export async function getProjects() {
  "use cache";
  mark();
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: false });
  if (error) fail("projects", error.message);
  return (data ?? []) as Project[];
}

export async function getProject(slug: string) {
  "use cache";
  mark();
  const rows = await getProjects();
  return rows.find((p) => p.slug === slug) ?? null;
}

async function getAllExperiences() {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("experiences")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: false });
  if (error) fail("experiences", error.message);
  return (data ?? []) as Experience[];
}

export async function getExperiences() {
  "use cache";
  mark();
  return (await getAllExperiences()).filter((e) => !TEACHING_TYPES.includes(e.type));
}

export async function getTeaching() {
  "use cache";
  mark();
  return (await getAllExperiences()).filter((e) => TEACHING_TYPES.includes(e.type));
}

export async function getEntryItems(parentType: "project" | "experience") {
  "use cache";
  mark();
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("entry_items")
    .select("*")
    .eq("parent_type", parentType)
    .order("sort_order", { ascending: true });
  if (error) fail("entry_items", error.message);
  return (data ?? []) as EntryItem[];
}

export async function getSkills() {
  "use cache";
  mark();
  const db = publicClient();
  if (!db) return { skills: [] as Skill[], stats: [] as SkillStat[] };
  const [skills, stats] = await Promise.all([
    selectAll<Skill>("skills"),
    db.from("skill_stats").select("*"),
  ]);
  if (stats.error) fail("skill_stats", stats.error.message);
  return { skills, stats: (stats.data ?? []) as SkillStat[] };
}

export async function getAwards() {
  "use cache";
  mark();
  return selectAll<Award>("awards", [{ column: "year", ascending: false }]);
}

export async function getActivities() {
  "use cache";
  mark();
  return selectAll<Activity>("activities", [{ column: "start_date", ascending: false }]);
}

export async function getAttachments(entityType: EntityType, entityId: string) {
  "use cache";
  mark();
  const db = publicClient();
  if (!db || !entityId) return [];
  const { data, error } = await db
    .from("attachments")
    // 영문 컬럼(0002)이 아직 없어도 실패하지 않도록 * 로 읽는다
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) fail("attachments", error.message);
  return (data ?? []) as Attachment[];
}

/** 공개된 CV 첨부가 있으면 그 id 를 돌려준다 */
export async function getCvAttachmentId(): Promise<string | null> {
  "use cache";
  mark();
  const profile = await getProfile();
  if (!profile.cv_attachment_id || !profile.id) return null;
  const files = await getAttachments("profile", profile.id);
  return files.some((f) => f.id === profile.cv_attachment_id) ? profile.cv_attachment_id : null;
}

export async function getLastUpdated(): Promise<string | null> {
  "use cache";
  mark();
  const db = publicClient();
  if (!db) return null;
  const { data, error } = await db.from("site_last_updated").select("last_updated").maybeSingle();
  if (error) fail("site_last_updated", error.message);
  return (data?.last_updated as string | null) ?? null;
}
