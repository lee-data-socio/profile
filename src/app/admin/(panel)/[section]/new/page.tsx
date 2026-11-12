import { adminPage } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSection } from "@/lib/sections";
import { getRelationOptions, getTagSuggestions } from "@/lib/admin-data";
import { saveEntity } from "@/app/admin/actions";
import { EntityForm } from "@/components/admin/entity-form";


// 관리자 화면은 매 요청마다 세션을 확인하므로(adminPage → connection) 즉시 내비게이션 검증에서 제외한다.
// layout 의 instant = false 는 page 세그먼트까지 덮지 않아 페이지마다 둔다.
export const instant = false;

export default async function NewEntityPage({ params }: PageProps<"/admin/[section]/new">) {
  await adminPage();
  const { section } = await params;
  const cfg = getSection(section);
  if (!cfg) notFound();
  const [tags, relations] = await Promise.all([getTagSuggestions(), getRelationOptions()]);

  return (
    <>
      <Link href={`/admin/${cfg.key}`} className="text-sm text-accent hover:underline">
        ← {cfg.label}
      </Link>
      <h1 className="mb-6 mt-2 font-heading text-2xl font-bold">새 {cfg.label}</h1>
      <EntityForm
        config={cfg}
        initial={{ visibility: "draft", ...(cfg.defaults ?? {}) }}
        action={saveEntity.bind(null, cfg.key, null)}
        tagSuggestions={tags}
        relations={relations}
        isNew
      />
    </>
  );
}
