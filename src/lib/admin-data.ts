import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { normalizeSectionOrder } from "@/lib/labels";
import { ADMIN_SECTION_ORDER, SECTIONS, type AdminSectionKey, type SectionConfig, type TagGroup } from "@/lib/sections";
import type { Attachment, EntityType, EntryItem, Profile, SkillStat } from "@/lib/types";

/**
 * 관리자 화면용 조회. service role 로 초안·비공개 항목까지 모두 읽는다.
 * 호출하는 페이지는 반드시 requireOwner() 뒤에 있어야 한다.
 */

export type Row = Record<string, unknown> & { id: string; visibility: string; sort_order: number; updated_at: string };

export async function listRows(cfg: SectionConfig): Promise<Row[]> {
  const db = adminClient();
  let q = db.from(cfg.table).select("*");
  if (cfg.typeFilter) q = q.in(cfg.typeFilter.column, cfg.typeFilter.values);
  const { data, error } = await q.order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw new Error(`${cfg.table}: ${error.message}`);
  return (data ?? []) as Row[];
}

export async function getRow(cfg: SectionConfig, id: string): Promise<Row | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = adminClient();
  let q = db.from(cfg.table).select("*").eq("id", id);
  if (cfg.typeFilter) q = q.in(cfg.typeFilter.column, cfg.typeFilter.values);
  const { data } = await q.maybeSingle();
  return (data as Row) ?? null;
}

export async function getProfileAdmin(): Promise<Profile> {
  const db = adminClient();
  const { data, error } = await db.from("profile").select("*").limit(1).maybeSingle();
  if (error) throw new Error(`profile: ${error.message}`);
  if (!data) throw new Error("profile 행이 없습니다. supabase/migrations/0001_init.sql 을 실행했는지 확인하세요.");
  return {
    ...(data as Profile),
    contacts: data.contacts ?? {},
    section_order: normalizeSectionOrder(data.section_order),
  };
}

export async function getCounts(): Promise<Record<AdminSectionKey, { total: number; public: number }>> {
  const result = {} as Record<AdminSectionKey, { total: number; public: number }>;
  await Promise.all(
    ADMIN_SECTION_ORDER.map(async (key) => {
      const rows = await listRows(SECTIONS[key]);
      result[key] = { total: rows.length, public: rows.filter((r) => r.visibility === "public").length };
    }),
  );
  return result;
}

export type TagSuggestions = Record<TagGroup, string[]>;

export async function getTagSuggestions(): Promise<TagSuggestions> {
  const db = adminClient();
  const [projects, items, skills, profile] = await Promise.all([
    // 영문 컬럼(0002)이 아직 없어도 실패하지 않도록 * 로 읽는다
    db.from("projects").select("*"),
    db.from("entry_items").select("tags"),
    db.from("skills").select("name, category"),
    db.from("profile").select("*").limit(1).maybeSingle(),
  ]);
  const sets: Record<TagGroup, Set<string>> = {
    topic: new Set(),
    method: new Set(),
    tool: new Set(),
    data: new Set(),
    any: new Set(),
    topic_en: new Set(),
    method_en: new Set(),
    data_en: new Set(),
  };
  for (const p of projects.data ?? []) {
    (p.methods ?? []).forEach((t: string) => sets.method.add(t));
    (p.tools ?? []).forEach((t: string) => sets.tool.add(t));
    (p.tags ?? []).forEach((t: string) => sets.topic.add(t));
    (p.data_sources ?? []).forEach((t: string) => sets.data.add(t));
    (p.methods_en ?? []).forEach((t: string) => sets.method_en.add(t));
    (p.tags_en ?? []).forEach((t: string) => sets.topic_en.add(t));
    (p.data_sources_en ?? []).forEach((t: string) => sets.data_en.add(t));
  }
  for (const s of skills.data ?? []) {
    if (s.category === "tool" || s.category === "language") sets.tool.add(s.name);
    else sets.method.add(s.name);
  }
  (profile.data?.interests ?? []).forEach((t: string) => sets.topic.add(t));
  (profile.data?.interests_en ?? []).forEach((t: string) => sets.topic_en.add(t));
  for (const i of items.data ?? []) (i.tags ?? []).forEach((t: string) => sets.any.add(t));
  // 업무 항목 태그는 모든 그룹을 제안 (역량 근거로 쓰이므로)
  for (const g of ["topic", "method", "tool"] as const) sets[g].forEach((t) => sets.any.add(t));

  const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b, "ko"));
  return {
    topic: sorted(sets.topic),
    method: sorted(sets.method),
    tool: sorted(sets.tool),
    data: sorted(sets.data),
    any: sorted(sets.any),
    topic_en: sorted(sets.topic_en),
    method_en: sorted(sets.method_en),
    data_en: sorted(sets.data_en),
  };
}

export type RelationOptions = { projects: { value: string; label: string }[]; publications: { value: string; label: string }[] };

export async function getRelationOptions(): Promise<RelationOptions> {
  const db = adminClient();
  const [projects, pubs] = await Promise.all([
    db.from("projects").select("id, title, visibility").order("sort_order"),
    db.from("publications").select("id, title, year, visibility").order("sort_order"),
  ]);
  return {
    projects: (projects.data ?? []).map((p) => ({ value: p.id, label: p.title })),
    publications: (pubs.data ?? []).map((p) => ({ value: p.id, label: p.year ? `${p.title} (${p.year})` : p.title })),
  };
}

export async function getAttachmentsAdmin(entityType: EntityType, entityId: string): Promise<Attachment[]> {
  const db = adminClient();
  const { data, error } = await db
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`attachments: ${error.message}`);
  return (data ?? []) as Attachment[];
}

export async function getEntryItemsAdmin(parentType: "project" | "experience", parentId: string): Promise<EntryItem[]> {
  const db = adminClient();
  const { data, error } = await db
    .from("entry_items")
    .select("*")
    .eq("parent_type", parentType)
    .eq("parent_id", parentId)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`entry_items: ${error.message}`);
  return (data ?? []) as EntryItem[];
}

export async function getSkillStatsAdmin(): Promise<SkillStat[]> {
  const db = adminClient();
  const { data } = await db.from("skill_stats").select("*");
  return (data ?? []) as SkillStat[];
}
