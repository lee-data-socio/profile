import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { getProjects } from "@/lib/data";
import { ProjectCard } from "@/components/project-card";
import { ProjectFilter, type FilterableProject } from "@/components/client/project-filter";
import { EmptyNote } from "@/components/ui";

export const metadata: Metadata = {
  title: "연구 프로젝트",
  description: "수행한 연구과제와 개인 연구 프로젝트 목록",
  alternates: { canonical: "/projects" },
};

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

export default async function ProjectsPage() {
  const [projects, thisYear] = await Promise.all([getProjects(), currentYear()]);
  const filterable: FilterableProject[] = projects.map((p) => ({
    id: p.id,
    approach: p.approach,
    tags: p.tags,
    years: yearsOf(p.start_date, p.end_date, p.is_current, thisYear),
  }));
  const cards = Object.fromEntries(projects.map((p) => [p.id, <ProjectCard key={p.id} project={p} headingLevel={2} />]));

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight">연구 프로젝트</h1>
      <p className="mt-2 text-muted">연구과제와 개인 연구를 방법·주제·연도로 골라 볼 수 있습니다.</p>
      <div className="mt-8">
        {projects.length ? (
          <ProjectFilter projects={filterable} cards={cards} />
        ) : (
          <EmptyNote>아직 공개된 프로젝트가 없습니다.</EmptyNote>
        )}
      </div>
    </>
  );
}
