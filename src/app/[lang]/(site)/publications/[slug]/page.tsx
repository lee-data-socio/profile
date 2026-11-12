import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { safeDecode } from "@/lib/format";
import { Suspense } from "react";
import { getAttachments, getProjects, getPublication, getPublications } from "@/lib/data";
import { asaCitationText, bibtex, doiUrl, formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import {
  getDict,
  isLang,
  languageAlternates,
  localePath,
  localizeAll,
  localizeAttachment,
  localizeProject,
  localizePublication,
  type Lang,
} from "@/lib/i18n";
import type { Publication } from "@/lib/types";
import { Authors, Citation, SourceLinks, StatusBadge, Venue } from "@/components/publication-item";
import { CopyButton } from "@/components/client/copy-button";
import { AttachmentList } from "@/components/attachment-list";
import { JsonLd } from "@/components/json-ld";

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang: Lang = isLang(params.lang) ? params.lang : "ko";
  const pubs = localizeAll(await getPublications(), lang, localizePublication);
  return pubs.length ? pubs.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

/** 언어에 맞게 바꾼 논문. 없거나(영어인데 영문 제목이 없으면) null */
async function loadPublication(lang: string, slug: string) {
  if (!isLang(lang)) return null;
  const raw = await getPublication(safeDecode(slug));
  const pub = raw && localizePublication(raw, lang);
  return pub ? { lang, raw, pub } : null;
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

export async function generateMetadata({ params }: PageProps<"/[lang]/publications/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const found = await loadPublication(lang, slug);
  if (!found) return { title: getDict(isLang(lang) ? lang : "ko").notFoundTitle };
  const { pub, raw } = found;
  const description = pub.abstract?.slice(0, 160) || asaCitationText(pub, found.lang);
  const path = `/publications/${pub.slug}`;
  return {
    title: pub.title,
    description,
    alternates: {
      canonical: localePath(found.lang, path),
      // 영문판이 있을 때만 hreflang
      ...(localizePublication(raw, "en") ? { languages: languageAlternates(path) } : {}),
    },
    openGraph: { type: "article", title: pub.title, description, locale: getDict(found.lang).locale },
    // Google Scholar 메타는 정식(한국어) 페이지에만, 원래 값으로 (한 논문이 두 번 색인되지 않게)
    ...(found.lang === "ko" ? { other: scholarMeta(raw, await pdfAttachmentId(raw.id)) } : {}),
  };
}

async function pdfAttachmentId(pubId: string): Promise<string | null> {
  const files = await getAttachments("publication", pubId);
  const pdf = files.find((f) => f.mime === "application/pdf" && f.kind === "paper") ?? files.find((f) => f.mime === "application/pdf");
  return pdf?.id ?? null;
}

async function PublicationDetail({ params }: Pick<PageProps<"/[lang]/publications/[slug]">, "params">) {
  const { lang: langParam, slug } = await params;
  const found = await loadPublication(langParam, slug);
  if (!found) notFound();
  const { lang, pub } = found;
  const t = getDict(lang);
  const [files, projects] = await Promise.all([getAttachments("publication", pub.id), getProjects()]);
  const rawProject = pub.project_id ? projects.find((p) => p.id === pub.project_id) : null;
  const project = rawProject ? localizeProject(rawProject, lang) : null;

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
          url: `${SITE_URL}${localePath(lang, `/publications/${pub.slug}`)}`,
        }}
      />
      <nav aria-label={t.breadcrumb} className="no-print text-sm">
        <Link href={localePath(lang, "/publications")} className="text-accent hover:underline underline-offset-4">
          ← {t.section.publications}
        </Link>
      </nav>
      <p className="mt-6 text-sm text-subtle">
        {t.pubType[pub.type]}
        {pub.year && ` · ${pub.year}`}
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{pub.title}</h1>
      <p className="mt-4 text-muted">
        <Authors pub={pub} lang={lang} />
      </p>
      {pub.venue && (
        <p className="mt-1 text-muted">
          <Venue pub={pub} />
        </p>
      )}
      <div className="no-print mt-5 flex flex-wrap items-center gap-2">
        <StatusBadge pub={pub} lang={lang} />
        <SourceLinks pub={pub} lang={lang} />
      </div>

      <section className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm">
        <h2 className="mb-2 text-xs font-bold text-subtle">{t.citation}</h2>
        <Citation pub={pub} lang={lang} />
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={asaCitationText(pub, lang)} label={t.copy.asa} copiedLabel={t.copy.copied} promptLabel={t.copy.prompt} />
          <CopyButton text={bibtex(pub, lang)} label={t.copy.bibtex} copiedLabel={t.copy.copied} promptLabel={t.copy.prompt} />
        </div>
      </section>

      {pub.abstract && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold">{t.abstract}</h2>
          <p className="max-w-prose whitespace-pre-line leading-8">{pub.abstract}</p>
        </section>
      )}

      {project && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold">{t.relatedProject}</h2>
          <Link href={localePath(lang, `/projects/${project.slug}`)} className="text-accent hover:underline underline-offset-4">
            {project.title}
          </Link>
        </section>
      )}

      {files.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-heading text-lg font-bold">{t.attachments}</h2>
          <AttachmentList files={files.map((f) => localizeAttachment(f, lang))} lang={lang} />
        </section>
      )}

      <p className="mt-12 text-xs text-subtle">
        {t.lastUpdated} <time dateTime={pub.updated_at}>{formatDate(pub.updated_at, lang)}</time>
      </p>
    </article>
  );
}

export default async function PublicationPage({ params }: PageProps<"/[lang]/publications/[slug]">) {
  // slug 는 요청 때 정해질 수 있어 Suspense 안에서만 읽고, 대체 문구의 언어는 루트 파라미터로 정한다
  const lang = await rootLang();
  return (
    <Suspense fallback={<p className="text-sm text-subtle">{getDict(isLang(lang) ? lang : "ko").loading}</p>}>
      <PublicationDetail params={params} />
    </Suspense>
  );
}
