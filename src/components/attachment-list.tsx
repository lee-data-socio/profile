import type { Attachment } from "@/lib/types";
import { ATTACHMENT_KIND_LABEL, VERSION_TYPE_LABEL } from "@/lib/labels";
import { fileTypeLabel, isImage, isPdf } from "@/lib/files";
import { formatBytes } from "@/lib/format";
import { PdfPreview } from "@/components/client/file-preview";

export function AttachmentList({ files }: { files: Attachment[] }) {
  if (!files.length) return null;
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
      {files.map((f) => {
        const href = `/api/files/${f.id}`;
        const inline = `${href}?inline=1`;
        return (
          <li key={f.id} className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                {isImage(f.mime) ? (
                  // 서명 URL 로 리다이렉트되는 경로라 next/image 최적화 대상이 아니다.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inline}
                    alt={f.description || f.display_name}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded border border-line object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-14 w-11 shrink-0 items-center justify-center rounded border border-line text-[10px] font-bold text-muted"
                  >
                    {fileTypeLabel(f.original_name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-medium">{f.display_name}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    {ATTACHMENT_KIND_LABEL[f.kind]}
                    {f.version_type && ` · ${VERSION_TYPE_LABEL[f.version_type]}`} · {fileTypeLabel(f.original_name)} ·{" "}
                    {formatBytes(f.size_bytes)}
                  </p>
                  {f.description && <p className="mt-1 text-sm text-muted">{f.description}</p>}
                </div>
              </div>
              <a
                href={href}
                className="no-print shrink-0 rounded-md border border-line px-3 py-1.5 text-sm hover:border-accent hover:text-accent"
                aria-label={`${f.display_name} 다운로드 (${fileTypeLabel(f.original_name)}, ${formatBytes(f.size_bytes)})`}
              >
                다운로드
              </a>
            </div>
            {isPdf(f.mime) && <PdfPreview src={inline} title={f.display_name} />}
          </li>
        );
      })}
    </ul>
  );
}
