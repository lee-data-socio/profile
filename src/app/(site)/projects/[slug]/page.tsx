import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { safeDecode } from "@/lib/format";
import { Suspense } from "react";
import { getAttachments, getEntryItems, getProject, getProjects, getPublications } from "@/lib/data";
import { APPROACH_LABEL } from "@/lib/labels";
import { formatDate, formatPeriod } from "@/lib/format";
import { RichText, isRichEmpty } from "@/components/rich-text";
import { TagList } from "@/components/ui";
import { AttachmentList } from "@/components/attachment-list";
import { PublicationItem } from "@/components/publication-item";

export async function generateStaticParams() {
  const projects = await getProjects();
  // Cache Components 는 최소 1개를 요구한다. 아직 프로젝트가 없으면 자리표시자를 쓰고 페이지에서 404 처리.
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(safeDecode(slug));
  if (!project) return { title: "찾을 수 없음" };
  const description = project.summary || `${project.title} 연구 프로젝트`;
  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { type: "article", title: project.title, description },
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

async function ProjectDetail({ params }: Pick<PageProps<"/projects/[slug]">, "params">) {
  const { slug } = await params;
  const project = await getProject(safeDecode(slug));
  if (!project) notFound();

  const [items, files, pubs] = await Promise.all([
    getEntryItems("project"),
    getAttachments("project", project.id),
    getPublications(),
  ]);
  const myItems = items.filter((i) => i.parent_id === project.id);
  const related = pubs.filter((p) => p.project_id === project.id);

  const facts: [string, ReactNode][] = [
    ["기간", formatPeriod(project.start_date, project.end_date, project.is_current)],
    ["역할", project.role],
    ["소속", project.org],
    ["발주·지원", project.funder],
    ["연구 방법", project.approach ? APPROACH_LABEL[project.approach] + (project.methods.length ? ` · ${project.methods.join(", ")}` : "") : project.methods.join(", ")],
    ["데이터", project.data_sources.join(", ")],
    ["사용 도구", project.tools.join(", ")],
  ];

  return (
    <article>
      <nav aria-label="경로" className="no-print text-sm">
        <Link href="/projects" className="text-accent hover:underline underline-offset-4">
          ← 연구 프로젝트
        </Link>
      </nav>
      <h1 className="mt-4 font-heading text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{project.title}</h1>
      {project.summary && <p className="mt-3 text-lg text-muted">{project.summary}</p>}
      <div className="mt-4">
        <TagList tags={project.tags} tone="accent" />
      </div>

      <dl className="mt-8 grid gap-x-6 gap-y-2 rounded-xl border border-line bg-surface p-5 text-sm sm:grid-cols-[7rem_1fr]">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-subtle">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>

      {!isRichEmpty(project.research_question) && (
        <Block title="연구 질문">
          <RichText doc={project.research_question} />
        </Block>
      )}

      {myItems.length > 0 && (
        <Block title="수행 내용">
          <ul className="list-disc space-y-1.5 pl-5 leading-relaxed marker:text-subtle">
            {myItems.map((it) => (
              <li key={it.id}>
                {it.text}
                {it.metrics.length > 0 && <span className="text-muted"> ({it.metrics.join(", ")})</span>}
                {it.evidence_url && (
                  <>
                    {" "}
                    <a href={it.evidence_url} className="text-sm text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                      근거
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {!isRichEmpty(project.findings) && (
        <Block title="결과">
          <RichText doc={project.findings} />
        </Block>
      )}

      {related.length > 0 && (
        <Block title="관련 논문·발표">
          <ul className="divide-y divide-line">
            {related.map((p) => (
              <PublicationItem key={p.id} pub={p} />
            ))}
          </ul>
        </Block>
      )}

      {files.length > 0 && (
        <Block title="첨부파일">
          <AttachmentList files={files} />
        </Block>
      )}

      <p className="mt-12 text-xs text-subtle">
        마지막 업데이트 <time dateTime={project.updated_at}>{formatDate(project.updated_at)}</time>
      </p>
    </article>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<p className="text-sm text-subtle">불러오는 중…</p>}>
      <ProjectDetail params={params} />
    </Suspense>
  );
}
