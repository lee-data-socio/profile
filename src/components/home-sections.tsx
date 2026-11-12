import type { ReactNode } from "react";
import Link from "next/link";
import type {
  Activity,
  Award,
  Contacts,
  Education,
  EntryItem,
  Experience,
  Project,
  Publication,
  ResearchInterest,
  Skill,
  SkillStat,
} from "@/lib/types";
import {
  EXPERIENCE_TYPE_LABEL,
  PUBLICATION_TYPE_LABEL,
  PUBLICATION_TYPE_ORDER,
  SKILL_CATEGORY_LABEL,
} from "@/lib/labels";
import { formatMonth, formatPeriod } from "@/lib/format";
import { EmptyNote, Section } from "@/components/ui";
import { ProjectCard } from "@/components/project-card";
import { PublicationItem } from "@/components/publication-item";
import { EmailReveal } from "@/components/client/email-reveal";

const HOME_LIMIT = 5;

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="no-print text-sm text-accent hover:underline underline-offset-4">
      {children} →
    </Link>
  );
}

/* ------------------------------------------------------------------ */

export function InterestsSection({
  interests,
  projects,
  publications,
}: {
  interests: ResearchInterest[];
  projects: Project[];
  publications: Publication[];
}) {
  if (!interests.length) return null;
  return (
    <Section id="interests" title="연구 관심사">
      <div className="grid gap-4 sm:grid-cols-2">
        {interests.map((it) => {
          const relProjects = projects.filter((p) => it.project_ids.includes(p.id));
          const relPubs = publications.filter((p) => it.publication_ids.includes(p.id));
          return (
            <article key={it.id} className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-serif text-lg font-bold">{it.title}</h3>
              {it.description && <p className="mt-2 text-sm leading-relaxed text-muted">{it.description}</p>}
              {(relProjects.length > 0 || relPubs.length > 0) && (
                <ul className="mt-3 space-y-1 text-sm">
                  {relProjects.map((p) => (
                    <li key={p.id}>
                      <span className="text-subtle">프로젝트 · </span>
                      <Link href={`/projects/${p.slug}`} className="text-accent hover:underline underline-offset-4">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                  {relPubs.map((p) => (
                    <li key={p.id}>
                      <span className="text-subtle">논문 · </span>
                      <Link href={`/publications/${p.slug}`} className="text-accent hover:underline underline-offset-4">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function PublicationsSection({ publications }: { publications: Publication[] }) {
  if (!publications.length) return null;
  const groups = PUBLICATION_TYPE_ORDER.map((type) => ({
    type,
    items: publications.filter((p) => p.type === type),
  })).filter((g) => g.items.length);
  const shown = publications.length > HOME_LIMIT * 2;
  return (
    <Section
      id="publications"
      title="논문·학술발표"
      action={<MoreLink href="/publications">전체 {publications.length}건</MoreLink>}
    >
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.type}>
            <h3 className="text-sm font-bold text-muted">{PUBLICATION_TYPE_LABEL[g.type]}</h3>
            <ul className="divide-y divide-line">
              {(shown ? g.items.slice(0, 3) : g.items).map((p) => (
                <PublicationItem key={p.id} pub={p} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function ProjectsSection({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  return (
    <Section
      id="projects"
      title="연구 프로젝트"
      action={<MoreLink href="/projects">전체 {projects.length}건</MoreLink>}
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.slice(0, HOME_LIMIT - 1).map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function TimelineRow({
  period,
  title,
  subtitle,
  children,
}: {
  period: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="grid gap-1 py-4 sm:grid-cols-[9.5rem_1fr] sm:gap-6">
      <p className="text-sm tabular-nums text-subtle">{period}</p>
      <div>
        <h3 className="font-bold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        {children}
      </div>
    </li>
  );
}

export function EducationSection({ education }: { education: Education[] }) {
  if (!education.length) return null;
  return (
    <Section id="education" title="학력">
      <ul className="divide-y divide-line">
        {education.map((e) => (
          <TimelineRow
            key={e.id}
            period={formatPeriod(e.start_date, e.end_date, e.is_current)}
            title={`${e.school} ${e.major} ${e.degree}`}
            subtitle={[e.status, e.advisor && `지도교수 ${e.advisor}`].filter(Boolean).join(" · ")}
          >
            {e.thesis_title && <p className="mt-1 text-sm text-muted">학위논문: “{e.thesis_title}”</p>}
          </TimelineRow>
        ))}
      </ul>
    </Section>
  );
}

function ItemBullets({ items }: { items: EntryItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted marker:text-subtle">
      {items.map((it) => (
        <li key={it.id}>
          {it.text}
          {it.metrics.length > 0 && <span className="text-fg"> ({it.metrics.join(", ")})</span>}
          {it.evidence_url && (
            <>
              {" "}
              <a href={it.evidence_url} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                근거
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ExperienceSection({ experiences, items }: { experiences: Experience[]; items: EntryItem[] }) {
  if (!experiences.length) return null;
  return (
    <Section id="experiences" title="경력">
      <ul className="divide-y divide-line">
        {experiences.map((e) => (
          <TimelineRow
            key={e.id}
            period={formatPeriod(e.start_date, e.end_date, e.is_current)}
            title={`${e.org} · ${e.title}`}
            subtitle={EXPERIENCE_TYPE_LABEL[e.type]}
          >
            {e.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.description}</p>}
            <ItemBullets items={items.filter((i) => i.parent_id === e.id)} />
          </TimelineRow>
        ))}
      </ul>
    </Section>
  );
}

export function TeachingSection({ teaching }: { teaching: Experience[] }) {
  if (!teaching.length) return null;
  return (
    <Section id="teaching" title="교육 경력">
      <ul className="divide-y divide-line">
        {teaching.map((e) => (
          <TimelineRow
            key={e.id}
            period={e.semester || formatPeriod(e.start_date, e.end_date, e.is_current)}
            title={e.course_name || e.title}
            subtitle={[EXPERIENCE_TYPE_LABEL[e.type], e.org, e.supervisor && `담당 교수 ${e.supervisor}`]
              .filter(Boolean)
              .join(" · ")}
          >
            {e.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.description}</p>}
          </TimelineRow>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function SkillsSection({ skills, stats }: { skills: Skill[]; stats: SkillStat[] }) {
  if (!skills.length) return null;
  const statById = new Map(stats.map((s) => [s.id, s]));
  const categories = Object.keys(SKILL_CATEGORY_LABEL) as Skill["category"][];
  return (
    <Section id="skills" title="연구방법·역량">
      <div className="space-y-6">
        {categories.map((cat) => {
          const list = skills.filter((s) => s.category === cat);
          if (!list.length) return null;
          return (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-bold text-muted">{SKILL_CATEGORY_LABEL[cat]}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {list.map((s) => {
                  const st = statById.get(s.id);
                  const meta = [
                    st && st.evidence_count > 0 ? `근거 ${st.evidence_count}건` : null,
                    st?.last_used ? `최근 ${formatMonth(st.last_used)}` : null,
                  ].filter(Boolean);
                  return (
                    <li key={s.id} className="rounded-lg border border-line bg-surface px-4 py-3">
                      <p className="font-medium">
                        {s.name}
                        {meta.length > 0 && <span className="ml-2 text-xs font-normal text-subtle">{meta.join(" · ")}</span>}
                      </p>
                      {s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function AwardsSection({ awards }: { awards: Award[] }) {
  if (!awards.length) return null;
  return (
    <Section id="awards" title="수상·장학·연구비">
      <ul className="divide-y divide-line">
        {awards.map((a) => (
          <TimelineRow
            key={a.id}
            period={a.year ? String(a.year) : ""}
            title={a.name}
            subtitle={[a.org, a.amount].filter(Boolean).join(" · ")}
          >
            {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
          </TimelineRow>
        ))}
      </ul>
    </Section>
  );
}

export function ActivitiesSection({ activities }: { activities: Activity[] }) {
  if (!activities.length) return null;
  return (
    <Section id="activities" title="학술활동">
      <ul className="divide-y divide-line">
        {activities.map((a) => (
          <TimelineRow
            key={a.id}
            period={formatPeriod(a.start_date, a.end_date, a.is_current)}
            title={a.name}
            subtitle={[a.org, a.role].filter(Boolean).join(" · ")}
          />
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const CONTACT_LINKS: { key: keyof Contacts; label: string; prefix?: string }[] = [
  { key: "scholar", label: "Google Scholar" },
  { key: "orcid", label: "ORCID", prefix: "https://orcid.org/" },
  { key: "researchgate", label: "ResearchGate" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "website", label: "웹사이트" },
];

export function contactHref(key: keyof Contacts, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const link = CONTACT_LINKS.find((c) => c.key === key);
  return link?.prefix ? `${link.prefix}${value}` : `https://${value}`;
}

export function encodeEmail(email: string): string {
  return Buffer.from(email, "utf8").toString("base64").split("").reverse().join("");
}

export function ContactSection({ contacts }: { contacts: Contacts }) {
  const links = CONTACT_LINKS.filter((c) => contacts[c.key]);
  if (!contacts.email && !links.length) return null;
  return (
    <Section id="contact" title="연락처">
      <dl className="grid gap-3 text-sm sm:grid-cols-[9.5rem_1fr] sm:gap-x-6">
        {contacts.email && (
          <>
            <dt className="text-subtle">이메일</dt>
            <dd>
              <EmailReveal encoded={encodeEmail(contacts.email)} />
            </dd>
          </>
        )}
        {links.map((c) => (
          <div key={c.key} className="contents">
            <dt className="text-subtle">{c.label}</dt>
            <dd>
              <a
                href={contactHref(c.key, contacts[c.key]!)}
                className="break-all text-accent hover:underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer me"
              >
                {contacts[c.key]!.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export { EmptyNote };
