import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safeDecode } from "@/lib/format";
import { Suspense } from "react";
import { getAttachments, getProjects, getPublication, getPublications } from "@/lib/data";
import { PUBLICATION_TYPE_LABEL, PUB_STATUS_LABEL } from "@/lib/labels";
import { asaCitationText, bibtex, doiUrl, formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import type { Publication } from "@/lib/types";
import { Citation } from "@/components/publication-item";
import { CopyButton } from "@/components/client/copy-button";
import { AttachmentList } from "@/components/attachment-list";
import { JsonLd } from "@/components/json-ld";

export async function generateStaticParams() {
  const pubs = await getPublications();
  return pubs.length ? pubs.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

/** Google Scholar 색인용 citation_* 메타태그 */
function scholarMeta(p: Publication, pdfId: string | null): Record<string, string | string[]> {
  const meta: Record<string, string | string[]> = {
    citation_title: p.title,
    citation_author: p.authors.map((a) => a.name.trim()).filter(Boolean),
  };
  if (p.year) meta.citation_publication_date = String(p.year);
  if (p.venue) {
    const key =
      p.type === "journal"
        ? "citation_journal_title"
        : p.type === "conference"
          ? "citation_conference_title"
          : p.type === "thesis"
            ? "citation_dissertation_institution"
            : p.type === "report" || p.type === "working_paper"
              ? "citation_technical_report_institution"
              : "citation_inbook_title";
    meta[key] = p.venue;
  }
  if (p.volume) meta.citation_volume = p.volume;
  if (p.issue) meta.citation_issue = p.issue;
  if (p.pages) {
    const [first, last] = p.pages.split(/[-–]/);
    meta.citation_firstpage = first.trim();
    if (last) meta.citation_lastpage = last.trim();
  }
  if (p.doi) meta.citation_doi = p.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (p.abstract) meta.citation_abstract = p.abstract;
  if (pdfId) meta.citation_pdf_url = `${SITE_URL}/api/files/${pdfId}?inline=1`;
  return meta;
}

export async function generateMetadata({ params }: PageProps<"/publications/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pub = await getPublication(safeDecode(slug));
  if (!pub) return { title: "찾을 수 없음" };
  const files = await getAttachments("publication", pub.id);
  const pdf = files.find((f) => f.mime === "application/pdf" && f.kind === "paper") ?? files.find((f) => f.mime === "application/pdf");
  const description = pub.abstract?.slice(0, 160) || asaCitationText(pub);
  return {
    title: pub.title,
    description,
    alternates: { canonical: `/publications/${pub.slug}` },
    openGraph: { type: "article", title: pub.title, description },
    other: scholarMeta(pub, pdf?.id ?? null),
  };
}

async function PublicationDetail({ params }: Pick<PageProps<"/publications/[slug]">, "params">) {
  const { slug } = await params;
  const pub = await getPublication(safeDecode(slug));
  if (!pub) notFound();
  const [files, projects] = await Promise.all([getAttachments("publication", pub.id), getProjects()]);
  const project = pub.project_id ? projects.find((p) => p.id === pub.project_id) : null;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          headline: pub.title,
          name: pub.title,
          author: pub.authors.map((a) => ({ "@type": "Person", name: a.name })),
          ...(pub.year ? { datePublished: String(pub.year) } : {}),
          ...(pub.venue ? { isPartOf: { "@type": "Periodical", name: pub.venue } } : {}),
          ...(pub.abstract ? { abstract: pub.abstract } : {}),
          ...(pub.doi ? { sameAs: doiUrl(pub.doi) } : pub.url ? { sameAs: pub.url } : {}),
          url: `${SITE_URL}/publications/${pub.slug}`,
        }}
      />
      <nav aria-label="경로" className="no-print text-sm">
        <Link href="/publications" className="text-accent hover:underline underline-offset-4">
          ← 논문·학술발표
        </Link>
      </nav>
      <p className="mt-4 text-sm text-subtle">
        {PUBLICATION_TYPE_LABEL[pub.type]} · {PUB_STATUS_LABEL[pub.pub_status]}
        {pub.year && ` · ${pub.year}`}
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{pub.title}</h1>
      <p className="mt-3 text-muted">
        {pub.authors.map((a, i) => (
          <span key={i}>
            {i > 0 && ", "}
            {a.is_me ? <strong className="text-fg">{a.name}</strong> : a.name}
          </span>
        ))}
        {pub.venue && <span> · {pub.venue}</span>}
      </p>

      <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-sm">
        <h2 className="mb-2 text-xs font-bold text-subtle">인용 (ASA)</h2>
        <Citation pub={pub} linkTitle={false} />
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={asaCitationText(pub)} label="ASA 복사" />
          <CopyButton text={bibtex(pub)} label="BibTeX 복사" />
          {pub.doi && (
            <a href={doiUrl(pub.doi)} className="text-xs text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              doi.org 에서 보기
            </a>
          )}
          {!pub.doi && pub.url && (
            <a href={pub.url} className="text-xs text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              원문 링크
            </a>
          )}
        </div>
      </div>

      {pub.abstract && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold">초록</h2>
          <p className="whitespace-pre-line leading-8">{pub.abstract}</p>
        </section>
      )}

      {project && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold">관련 연구 프로젝트</h2>
          <Link href={`/projects/${project.slug}`} className="text-accent hover:underline underline-offset-4">
            {project.title}
          </Link>
        </section>
      )}

      {files.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold">첨부파일</h2>
          <AttachmentList files={files} />
        </section>
      )}

      <p className="mt-12 text-xs text-subtle">
        마지막 업데이트 <time dateTime={pub.updated_at}>{formatDate(pub.updated_at)}</time>
      </p>
    </article>
  );
}

export default function PublicationPage({ params }: PageProps<"/publications/[slug]">) {
  return (
    <Suspense fallback={<p className="text-sm text-subtle">불러오는 중…</p>}>
      <PublicationDetail params={params} />
    </Suspense>
  );
}
