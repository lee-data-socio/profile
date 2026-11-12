import { adminPage } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSection } from "@/lib/sections";
import { getRelationOptions, getTagSuggestions } from "@/lib/admin-data";
import { saveEntity } from "@/app/admin/actions";
import { EntityForm } from "@/components/admin/entity-form";

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
