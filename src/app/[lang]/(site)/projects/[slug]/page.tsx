import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { safeDecode } from "@/lib/format";
import { Suspense } from "react";
import { getAttachments, getEntryItems, getProject, getProjects, getPublications } from "@/lib/data";
import { formatDate, formatPeriod } from "@/lib/format";
import {
  getDict,
  isLang,
  languageAlternates,
  localePath,
  localizeAll,
  localizeAttachment,
  localizeEntryItem,
  localizeProject,
  localizePublication,
  type Lang,
} from "@/lib/i18n";
import { RichText, isRichEmpty } from "@/components/rich-text";
import { Linkified, TagList } from "@/components/ui";
import { AttachmentList } from "@/components/attachment-list";
import { PublicationItem } from "@/components/publication-item";

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang: Lang = isLang(params.lang) ? params.lang : "ko";
  const projects = localizeAll(await getProjects(), lang, localizeProject);
  // Cache Components 는 최소 1개를 요구한다. 아직 프로젝트가 없으면 자리표시자를 쓰고 페이지에서 404 처리.
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

/** 언어에 맞게 바꾼 프로젝트. 없거나(영어인데 영문 제목이 없으면) null */
async function loadProject(lang: string, slug: string) {
  if (!isLang(lang)) return null;
  const raw = await getProject(safeDecode(slug));
  const project = raw && localizeProject(raw, lang);
  return project ? { lang, raw, project } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const found = await loadProject(lang, slug);
  if (!found) return { title: getDict(isLang(lang) ? lang : "ko").notFoundTitle };
  const { project, raw } = found;
  const t = getDict(found.lang);
  const description = project.summary || t.projectFallbackDescription(project.title);
  const path = `/projects/${project.slug}`;
  return {
    title: project.title,
    description,
    alternates: {
      canonical: localePath(found.lang, path),
      // 영문판이 있을 때만 hreflang
      ...(localizeProject(raw, "en") ? { languages: languageAlternates(path) } : {}),
    },
    openGraph: { type: "article", title: project.title, description, locale: t.locale },
  };
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-heading text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

async function ProjectDetail({ params }: Pick<PageProps<"/[lang]/projects/[slug]">, "params">) {
  const { lang: langParam, slug } = await params;
  const found = await loadProject(langParam, slug);
  if (!found) notFound();
  const { lang, project } = found;
  const t = getDict(lang);

  const [items, files, pubs] = await Promise.all([
    getEntryItems("project"),
    getAttachments("project", project.id),
    getPublications(),
  ]);
  const myItems = localizeAll(
    items.filter((i) => i.parent_id === project.id),
    lang,
    localizeEntryItem,
  );
  const related = localizeAll(
    pubs.filter((p) => p.project_id === project.id),
    lang,
    localizePublication,
  );
  const approach = project.approach ? t.approach[project.approach] : null;

  const facts: [string, ReactNode][] = [
    [t.fact.period, formatPeriod(project.start_date, project.end_date, project.is_current, lang)],
    [t.fact.role, project.role],
    [t.fact.org, project.org],
    [t.fact.funder, project.funder],
    [t.fact.methods, approach ? approach + (project.methods.length ? ` · ${project.methods.join(", ")}` : "") : project.methods.join(", ")],
    [t.fact.data, project.data_sources.join(", ")],
    [t.fact.tools, project.tools.join(", ")],
  ];

  return (
    <article>
      <nav aria-label={t.breadcrumb} className="no-print text-sm">
        <Link href={localePath(lang, "/projects")} className="text-accent hover:underline underline-offset-4">
          ← {t.section.projects}
        </Link>
      </nav>
      <h1 className="mt-4 font-heading text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{project.title}</h1>
      {project.summary && <p className="mt-4 max-w-prose leading-7 text-muted sm:text-lg sm:leading-8">{project.summary}</p>}
      <div className="mt-4">
        <TagList tags={project.tags} tone="accent" label={t.tags} />
      </div>

      <dl className="mt-8 grid gap-x-6 gap-y-0.5 rounded-xl border border-line bg-surface p-5 pb-2 text-sm sm:grid-cols-[7rem_1fr] sm:gap-y-2.5 sm:pb-5">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-xs text-subtle sm:text-sm">{k}</dt>
              <dd className="mb-3 sm:mb-0">{v}</dd>
            </div>
          ))}
      </dl>

      {!isRichEmpty(project.research_question) && (
        <Block title={t.researchQuestion}>
          <RichText doc={project.research_question} />
        </Block>
      )}

      {myItems.length > 0 && (
        <Block title={t.work}>
          <ul className="list-disc space-y-1.5 pl-5 leading-relaxed marker:text-subtle">
            {myItems.map((it) => (
              <li key={it.id}>
                <Linkified text={it.text} />
                {it.metrics.length > 0 && <span className="text-muted"> ({it.metrics.join(", ")})</span>}
                {it.evidence_url && (
                  <>
                    {" "}
                    <a href={it.evidence_url} className="text-sm text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                      {t.evidence}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {!isRichEmpty(project.findings) && (
        <Block title={t.findings}>
          <RichText doc={project.findings} />
        </Block>
      )}

      {related.length > 0 && (
        <Block title={t.relatedPublications}>
          <ul className="divide-y divide-line">
            {related.map((p) => (
              <PublicationItem key={p.id} pub={p} lang={lang} />
            ))}
          </ul>
        </Block>
      )}

      {files.length > 0 && (
        <Block title={t.attachments}>
          <AttachmentList files={files.map((f) => localizeAttachment(f, lang))} lang={lang} />
        </Block>
      )}

      <p className="mt-12 text-xs text-subtle">
        {t.lastUpdated} <time dateTime={project.updated_at}>{formatDate(project.updated_at, lang)}</time>
      </p>
    </article>
  );
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/projects/[slug]">) {
  // slug 는 요청 때 정해질 수 있어 Suspense 안에서만 읽고, 대체 문구의 언어는 루트 파라미터로 정한다
  const lang = await rootLang();
  return (
    <Suspense fallback={<p className="text-sm text-subtle">{getDict(isLang(lang) ? lang : "ko").loading}</p>}>
      <ProjectDetail params={params} />
    </Suspense>
  );
}
