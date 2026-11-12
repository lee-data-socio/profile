import Link from "next/link";
import type { Project } from "@/lib/types";
import { APPROACH_LABEL } from "@/lib/labels";
import { formatPeriod } from "@/lib/format";
import { Tag } from "@/components/ui";

export function ProjectCard({ project, headingLevel = 3 }: { project: Project; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-accent/60 hover:shadow-sm">
      <p className="text-xs text-subtle">
        {formatPeriod(project.start_date, project.end_date, project.is_current)}
        {project.role && ` · ${project.role}`}
      </p>
      <H className="mt-1.5 font-serif text-lg font-bold leading-snug">
        <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
          {project.title}
        </Link>
      </H>
      {(project.org || project.funder) && (
        <p className="mt-1 text-sm text-muted">{[project.org, project.funder].filter(Boolean).join(" · ")}</p>
      )}
      {project.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>}
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {project.approach && <Tag tone="accent">{APPROACH_LABEL[project.approach]}</Tag>}
        {project.tags.slice(0, 4).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </article>
  );
}
