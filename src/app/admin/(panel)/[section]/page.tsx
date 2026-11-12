import { adminPage } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSection } from "@/lib/sections";
import { getSkillStatsAdmin, listRows, type Row } from "@/lib/admin-data";
import {
  APPROACH_LABEL,
  EXPERIENCE_TYPE_LABEL,
  PUB_STATUS_LABEL,
  SKILL_CATEGORY_LABEL,
} from "@/lib/labels";
import { formatMonth } from "@/lib/format";
import type { Visibility } from "@/lib/types";
import { EntityList, type ListItem } from "@/components/admin/entity-list";
import { primaryBtnCls } from "@/components/admin/fields";

const VALUE_LABELS: Record<string, Record<string, string>> = {
  pub_status: PUB_STATUS_LABEL,
  category: SKILL_CATEGORY_LABEL,
  type: EXPERIENCE_TYPE_LABEL,
  approach: APPROACH_LABEL,
};

function display(field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "string" && VALUE_LABELS[field]?.[v]) return VALUE_LABELS[field][v];
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return formatMonth(v);
  return String(v);
}

export default async function SectionListPage({ params, searchParams }: PageProps<"/admin/[section]">) {
  await adminPage();
  const { section } = await params;
  const { deleted } = await searchParams;
  const cfg = getSection(section);
  if (!cfg) notFound();

  const rows = await listRows(cfg);
  const stats = cfg.key === "skills" ? await getSkillStatsAdmin() : [];
  const items: ListItem[] = rows.map((r: Row) => {
    const st = stats.find((s) => s.id === r.id);
    return {
      id: r.id,
      title: String(r[cfg.titleField] ?? ""),
      subtitle: cfg.subtitleFields.map((f) => display(f, r[f])).filter(Boolean).join(" · "),
      visibility: r.visibility as Visibility,
      meta: st ? `근거 ${st.evidence_count}건${st.last_used ? ` · 최근 ${formatMonth(st.last_used)}` : ""}` : undefined,
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">{cfg.label}</h1>
          <p className="mt-1 text-sm text-muted">{cfg.description}</p>
        </div>
        <Link href={`/admin/${cfg.key}/new`} className={primaryBtnCls}>
          + 새 항목
        </Link>
      </div>
      {deleted && <p className="mt-4 rounded-md bg-success/10 p-3 text-sm text-success">삭제했습니다.</p>}
      <div className="mt-6">
        <EntityList key={rows.map((r) => r.id + r.updated_at).join()} section={cfg.key} items={items} />
      </div>
    </>
  );
}
