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
import { formatMonth, formatPeriod } from "@/lib/format";
import { getDict, localePath, sectionHref, type Lang } from "@/lib/i18n";
import { EmptyNote, ExternalMark, Linkified, Section } from "@/components/ui";
import { ProjectCard } from "@/components/project-card";
import { PublicationItem } from "@/components/publication-item";
import { EmailReveal } from "@/components/client/email-reveal";

/* 모든 섹션은 localize* 를 거친 행을 받는다 (영어면 영문 값으로 바뀌고, 영문이 없는 항목은 빠져 있음). */

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
  lang,
}: {
  interests: ResearchInterest[];
  projects: Project[];
  publications: Publication[];
  lang: Lang;
}) {
  if (!interests.length) return null;
  const t = getDict(lang);
  const relLink = "text-accent hover:underline underline-offset-4";
  return (
    <Section id="interests" title={t.section.interests}>
      <ul className="divide-y divide-line">
        {interests.map((it) => {
          const relProjects = projects.filter((p) => it.project_ids.includes(p.id));
          const relPubs = publications.filter((p) => it.publication_ids.includes(p.id));
          return (
            <li key={it.id} className="grid gap-2 py-5 first:pt-1 sm:grid-cols-[12rem_1fr] sm:gap-8">
              <h3 className="font-heading text-base font-bold leading-snug sm:text-[1.0625rem]">{it.title}</h3>
              <div className="min-w-0">
                {it.description && (
                  <p className="text-[15px] leading-7 text-muted whitespace-pre-line">
                    <Linkified text={it.description} />
                  </p>
                )}
                {(relProjects.length > 0 || relPubs.length > 0) && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {relProjects.map((p) => (
                      <li key={p.id}>
                        <span className="text-subtle">{t.relProject} · </span>
                        <Link href={localePath(lang, `/projects/${p.slug}`)} className={relLink}>
                          {p.title}
                        </Link>
                      </li>
                    ))}
                    {relPubs.map((p) => (
                      <li key={p.id}>
                        <span className="text-subtle">{t.relPublication} · </span>
                        <Link href={localePath(lang, `/publications/${p.slug}`)} className={relLink}>
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

/** 연도 역순, 연도 없는(준비 중) 항목은 위로 */
export function byYearDesc(a: Publication, b: Publication): number {
  return (b.year ?? 9999) - (a.year ?? 9999) || a.sort_order - b.sort_order;
}

export function PublicationsSection({ publications, lang }: { publications: Publication[]; lang: Lang }) {
  if (!publications.length) return null;
  const t = getDict(lang);
  const shown = [...publications].sort(byYearDesc).slice(0, HOME_LIMIT);
  return (
    <Section
      id="publications"
      title={t.section.publications}
      action={
        publications.length > shown.length && (
          <MoreLink href={localePath(lang, "/publications")}>{t.more(publications.length)}</MoreLink>
        )
      }
    >
      <ul className="divide-y divide-line">
        {shown.map((p) => (
          <PublicationItem key={p.id} pub={p} lang={lang} showType />
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function ProjectsSection({ projects, lang }: { projects: Project[]; lang: Lang }) {
  if (!projects.length) return null;
  const t = getDict(lang);
  const shown = projects.slice(0, HOME_LIMIT - 1);
  return (
    <Section
      id="projects"
      title={t.section.projects}
      action={
        projects.length > shown.length && (
          <MoreLink href={localePath(lang, "/projects")}>{t.more(projects.length)}</MoreLink>
        )
      }
    >
      <ul className={`grid gap-4 ${shown.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {shown.map((p) => (
          <li key={p.id}>
            <ProjectCard project={p} lang={lang} compact />
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
  headingLevel = 3,
  children,
}: {
  period: string;
  title: ReactNode;
  subtitle?: ReactNode;
  headingLevel?: 2 | 3;
  children?: ReactNode;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <li className="grid gap-1 py-5 first:pt-1 sm:grid-cols-[9.5rem_1fr] sm:gap-6">
      <p className="text-sm tabular-nums text-subtle sm:pt-0.5">{period}</p>
      <div className="min-w-0">
        <H className="font-heading font-bold leading-snug">{title}</H>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        {children}
      </div>
    </li>
  );
}

export function EducationSection({ education, lang }: { education: Education[]; lang: Lang }) {
  if (!education.length) return null;
  const t = getDict(lang);
  return (
    <Section id="education" title={t.section.education}>
      <ul className="divide-y divide-line">
        {education.map((e) => (
          <TimelineRow
            key={e.id}
            period={formatPeriod(e.start_date, e.end_date, e.is_current, lang)}
            title={t.educationTitle({ school: e.school, major: e.major, degree: t.degree[e.degree] ?? e.degree })}
            subtitle={[t.eduStatus[e.status] ?? e.status, e.advisor && t.advisor(e.advisor)].filter(Boolean).join(" · ")}
          >
            {e.thesis_title && <p className="mt-1 text-sm text-muted">{t.thesis(e.thesis_title)}</p>}
          </TimelineRow>
        ))}
      </ul>
    </Section>
  );
}

function ItemBullets({ items, lang }: { items: EntryItem[]; lang: Lang }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted marker:text-subtle">
      {items.map((it) => (
        <li key={it.id}>
          <Linkified text={it.text} />
          {it.metrics.length > 0 && <span className="text-fg"> ({it.metrics.join(", ")})</span>}
          {it.evidence_url && (
            <>
              {" "}
              <a href={it.evidence_url} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                {getDict(lang).evidence}
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 경력 목록. detailed 이면 설명·업무 항목까지 보여 준다 (홈은 요약, /experience 는 전체). */
export function ExperienceList({
  experiences,
  items,
  lang,
  detailed = false,
}: {
  experiences: Experience[];
  items: EntryItem[];
  lang: Lang;
  detailed?: boolean;
}) {
  const t = getDict(lang);
  return (
    <ul className="divide-y divide-line">
      {experiences.map((e) => (
        <TimelineRow
          key={e.id}
          period={formatPeriod(e.start_date, e.end_date, e.is_current, lang)}
          title={e.org}
          subtitle={[e.title, t.experienceType[e.type]].filter(Boolean).join(" · ")}
          headingLevel={detailed ? 2 : 3}
        >
          {detailed && e.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted whitespace-pre-line">
              <Linkified text={e.description} />
            </p>
          )}
          {detailed && <ItemBullets items={items.filter((i) => i.parent_id === e.id)} lang={lang} />}
        </TimelineRow>
      ))}
    </ul>
  );
}

export function ExperienceSection({
  experiences,
  items,
  lang,
}: {
  experiences: Experience[];
  items: EntryItem[];
  lang: Lang;
}) {
  if (!experiences.length) return null;
  const t = getDict(lang);
  const hasDetail = experiences.some((e) => e.description) || items.some((i) => experiences.some((e) => e.id === i.parent_id));
  return (
    <Section
      id="experiences"
      title={t.section.experiences}
      action={hasDetail && <MoreLink href={sectionHref(lang, "experiences")}>{t.details}</MoreLink>}
    >
      <ExperienceList experiences={experiences} items={items} lang={lang} />
    </Section>
  );
}

/** 교육 이수 목록. detailed 이면 설명까지 보여 준다 (홈은 요약, /training 은 전체). */
export function TeachingList({ teaching, lang, detailed = false }: { teaching: Experience[]; lang: Lang; detailed?: boolean }) {
  const t = getDict(lang);
  return (
    <ul className="divide-y divide-line">
      {teaching.map((e) => (
        <TimelineRow
          key={e.id}
          period={e.semester || formatPeriod(e.start_date, e.end_date, e.is_current, lang)}
          title={e.course_name || e.title}
          subtitle={[e.title, e.org, e.supervisor && t.supervisor(e.supervisor)].filter(Boolean).join(" · ")}
          headingLevel={detailed ? 2 : 3}
        >
          {detailed && e.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted whitespace-pre-line">
              <Linkified text={e.description} />
            </p>
          )}
        </TimelineRow>
      ))}
    </ul>
  );
}

export function TeachingSection({ teaching, lang }: { teaching: Experience[]; lang: Lang }) {
  if (!teaching.length) return null;
  const t = getDict(lang);
  return (
    <Section
      id="teaching"
      title={t.section.teaching}
      action={teaching.some((e) => e.description) && <MoreLink href={sectionHref(lang, "teaching")}>{t.details}</MoreLink>}
    >
      <TeachingList teaching={teaching} lang={lang} />
    </Section>
  );
}

/* ------------------------------------------------------------------ */

export function SkillsSection({ skills, stats, lang }: { skills: Skill[]; stats: SkillStat[]; lang: Lang }) {
  if (!skills.length) return null;
  const t = getDict(lang);
  const statById = new Map(stats.map((s) => [s.id, s]));
  const categories = Object.keys(t.skillCategory) as Skill["category"][];
  return (
    <Section id="skills" title={t.section.skills}>
      <div className="space-y-6">
        {categories.map((cat) => {
          const list = skills.filter((s) => s.category === cat);
          if (!list.length) return null;
          return (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-bold text-muted">{t.skillCategory[cat]}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {list.map((s) => {
                  const st = statById.get(s.id);
                  const meta = [
                    st && st.evidence_count > 0 ? t.skillEvidence(st.evidence_count) : null,
                    st?.last_used ? t.skillRecent(formatMonth(st.last_used, lang)) : null,
                  ].filter(Boolean);
                  return (
                    <li key={s.id} className="rounded-lg border border-line bg-surface px-4 py-3">
                      <p className="font-medium">
                        {s.name}
                        {meta.length > 0 && <span className="ml-2 text-xs font-normal text-subtle">{meta.join(" · ")}</span>}
                      </p>
                      {s.description && <p className="mt-1 text-sm text-muted whitespace-pre-line">{s.description}</p>}
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

export function AwardsSection({ awards, lang }: { awards: Award[]; lang: Lang }) {
  if (!awards.length) return null;
  return (
    <Section id="awards" title={getDict(lang).section.awards}>
      <ul className="divide-y divide-line">
        {awards.map((a) => (
          <TimelineRow
            key={a.id}
            period={a.year ? String(a.year) : ""}
            title={a.name}
            subtitle={[a.org, a.amount].filter(Boolean).join(" · ")}
          >
            {a.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted whitespace-pre-line">
                <Linkified text={a.description} />
              </p>
            )}
          </TimelineRow>
        ))}
      </ul>
    </Section>
  );
}

export function ActivitiesSection({ activities, lang }: { activities: Activity[]; lang: Lang }) {
  if (!activities.length) return null;
  return (
    <Section id="activities" title={getDict(lang).section.activities}>
      <ul className="divide-y divide-line">
        {activities.map((a) => (
          <TimelineRow
            key={a.id}
            period={formatPeriod(a.start_date, a.end_date, a.is_current, lang)}
            title={a.name}
            subtitle={[a.org, a.role].filter(Boolean).join(" · ")}
          />
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

const CONTACT_LINKS: { key: keyof Contacts; label?: string; prefix?: string }[] = [
  { key: "scholar", label: "Google Scholar" },
  { key: "orcid", label: "ORCID", prefix: "https://orcid.org/" },
  { key: "researchgate", label: "ResearchGate" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  // label 이 없으면 언어별 "웹사이트"
  { key: "website" },
];

export function contactHref(key: keyof Contacts, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const link = CONTACT_LINKS.find((c) => c.key === key);
  return link?.prefix ? `${link.prefix}${value}` : `https://${value}`;
}

export function encodeEmail(email: string): string {
  return Buffer.from(email, "utf8").toString("base64").split("").reverse().join("");
}

/** 소개 영역의 바로가기 줄 (이메일·Scholar·GitHub 등) */
export function HeroLinks({ contacts, lang }: { contacts: Contacts; lang: Lang }) {
  const links = CONTACT_LINKS.filter((c) => contacts[c.key]);
  const t = getDict(lang);
  const cls =
    "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent";
  return (
    <>
      {contacts.email && <EmailReveal encoded={encodeEmail(contacts.email)} label={t.email} className={cls} />}
      {links.map((c) => (
        <a key={c.key} href={contactHref(c.key, contacts[c.key]!)} className={cls} target="_blank" rel="noopener noreferrer me">
          {c.label ?? t.website} <ExternalMark />
        </a>
      ))}
    </>
  );
}

export function ContactSection({ contacts, lang }: { contacts: Contacts; lang: Lang }) {
  const links = CONTACT_LINKS.filter((c) => contacts[c.key]);
  if (!contacts.email && !links.length) return null;
  const t = getDict(lang);
  return (
    <Section id="contact" title={t.section.contact}>
      <dl className="grid gap-3 text-sm sm:grid-cols-[9.5rem_1fr] sm:gap-x-6">
        {contacts.email && (
          <>
            <dt className="text-subtle">{t.email}</dt>
            <dd>
              <EmailReveal encoded={encodeEmail(contacts.email)} label={t.showEmail} />
            </dd>
          </>
        )}
        {links.map((c) => (
          <div key={c.key} className="contents">
            <dt className="text-subtle">{c.label ?? t.website}</dt>
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
