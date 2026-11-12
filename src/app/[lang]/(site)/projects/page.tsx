import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { getProjects } from "@/lib/data";
import { getDict, isLang, languageAlternates, localePath, localizeAll, localizeProject } from "@/lib/i18n";
import { ProjectCard } from "@/components/project-card";
import { ProjectFilter, type FilterableProject } from "@/components/client/project-filter";
import { EmptyNote } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/projects">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.section.projects,
    description: t.projectsDescription,
    alternates: { canonical: localePath(lang, "/projects"), languages: languageAlternates("/projects") },
  };
}

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function yearsOf(start: string, end: string | null, isCurrent: boolean, thisYear: number): number[] {
  const s = Number(start.slice(0, 4));
  const e = isCurrent ? thisYear : end ? Number(end.slice(0, 4)) : s;
  const years: number[] = [];
  for (let y = s; y <= Math.max(s, e); y++) years.push(y);
  return years;
}

export default async function ProjectsPage({ params }: PageProps<"/[lang]/projects">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const [all, thisYear] = await Promise.all([getProjects(), currentYear()]);
  const projects = localizeAll(all, lang, localizeProject);
  const filterable: FilterableProject[] = projects.map((p) => ({
    id: p.id,
    approach: p.approach,
    tags: p.tags,
    years: yearsOf(p.start_date, p.end_date, p.is_current, thisYear),
  }));
  const cards = Object.fromEntries(
    projects.map((p) => [p.id, <ProjectCard key={p.id} project={p} lang={lang} headingLevel={2} />]),
  );

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight">{t.section.projects}</h1>
      <p className="mt-2 text-muted">{t.projectsIntro}</p>
      <div className="mt-8">
        {projects.length ? (
          <ProjectFilter projects={filterable} cards={cards} lang={lang} labels={t.filter} approachLabels={t.approach} />
        ) : (
          <EmptyNote>{t.projectsEmpty}</EmptyNote>
        )}
      </div>
    </>
  );
}
