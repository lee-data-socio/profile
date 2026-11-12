import { adminPage } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSection } from "@/lib/sections";
import {
  getAttachmentsAdmin,
  getEntryItemsAdmin,
  getRelationOptions,
  getRow,
  getTagSuggestions,
} from "@/lib/admin-data";
import { saveEntity } from "@/app/admin/actions";
import { MAX_UPLOAD_MB } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { EntityForm } from "@/components/admin/entity-form";
import { EntryItemsEditor } from "@/components/admin/entry-items-editor";
import { AttachmentManager } from "@/components/admin/attachment-manager";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function EditEntityPage({ params, searchParams }: PageProps<"/admin/[section]/[id]">) {
  await adminPage();
  const { section, id } = await params;
  const { created } = await searchParams;
  const cfg = getSection(section);
  if (!cfg) notFound();
  const row = await getRow(cfg, id);
  if (!row) notFound();

  const [tags, relations, items, files] = await Promise.all([
    getTagSuggestions(),
    getRelationOptions(),
    cfg.itemsParent ? getEntryItemsAdmin(cfg.itemsParent, id) : Promise.resolve([]),
    cfg.attachEntity ? getAttachmentsAdmin(cfg.attachEntity, id) : Promise.resolve([]),
  ]);

  const title = String(row[cfg.titleField] ?? "");
  const publicHref =
    row.visibility === "public" && typeof row.slug === "string"
      ? `/${cfg.key === "projects" ? "projects" : "publications"}/${row.slug}`
      : row.visibility === "public"
        ? "/"
        : null;

  return (
    <>
      <Link href={`/admin/${cfg.key}`} className="text-sm text-accent hover:underline">
        ← {cfg.label}
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-2xl font-bold">{title || "(제목 없음)"}</h1>
        <p className="text-xs text-subtle">
          마지막 저장 {formatDate(row.updated_at)}
          {publicHref && (
            <>
              {" · "}
              <a href={publicHref} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                공개 페이지 보기 ↗
              </a>
            </>
          )}
        </p>
      </div>
      {created && (
        <p className="mb-4 rounded-md bg-success/10 p-3 text-sm text-success">
          저장했습니다.{cfg.attachEntity || cfg.itemsParent ? " 이제 아래에서 업무 항목과 첨부파일을 추가할 수 있습니다." : ""}
        </p>
      )}

      <EntityForm
        key={row.id}
        config={cfg}
        initial={row}
        action={saveEntity.bind(null, cfg.key, id)}
        tagSuggestions={tags}
        relations={relations}
        isNew={false}
      />

      {cfg.itemsParent && (
        <section className="mt-12">
          <h2 className="font-bold">업무 항목</h2>
          <p className="mb-3 mt-1 text-sm text-muted">수행한 일을 사실 단위로 나눠 적습니다. 태그는 역량 근거로 집계됩니다.</p>
          <EntryItemsEditor parentType={cfg.itemsParent} parentId={id} initial={items} tagSuggestions={tags.any} />
        </section>
      )}

      {cfg.attachEntity && (
        <section className="mt-12">
          <h2 className="font-bold">첨부파일</h2>
          <p className="mb-3 mt-1 text-sm text-muted">
            원문, 보고서, 발표자료 등. 업로드한 파일은 기본 비공개이며, 항목과 파일이 모두 공개여야 방문자가 내려받을 수 있습니다.
          </p>
          <AttachmentManager entityType={cfg.attachEntity} entityId={id} initial={files} maxMb={MAX_UPLOAD_MB} />
        </section>
      )}

      <section className="mt-16 border-t border-line pt-6">
        <DeleteButton section={cfg.key} id={id} title={title} fileCount={files.length} />
      </section>
    </>
  );
}
