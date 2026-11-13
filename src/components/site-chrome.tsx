import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import {
  getActivities,
  getAwards,
  getCvAttachmentId,
  getEducation,
  getExperiences,
  getInterests,
  getLastUpdated,
  getProfile,
  getProjects,
  getPublications,
  getSkills,
  getTeaching,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  getDict,
  localePath,
  localizeActivity,
  localizeAll,
  localizeAward,
  localizeEducation,
  localizeExperience,
  localizeInterest,
  localizeProfile,
  localizeProject,
  localizePublication,
  localizeSkill,
  sectionHref,
  type Lang,
} from "@/lib/i18n";
import type { SectionKey } from "@/lib/types";
import { LangLink, LangSwitch } from "@/components/client/lang-switch";

export async function SiteHeader({ lang }: { lang: Lang }) {
  "use cache";
  cacheLife("max");
  const [original, cvId, projects, pubs, interests, education, experiences, teaching, skillData, awards, activities] =
    await Promise.all([
      getProfile(),
      getCvAttachmentId(),
      getProjects(),
      getPublications(),
      getInterests(),
      getEducation(),
      getExperiences(),
      getTeaching(),
      getSkills(),
      getAwards(),
      getActivities(),
    ]);
  const profile = localizeProfile(original, lang);
  // 홈 화면과 같은 기준: 켜져 있고, 이 언어로 보여 줄 항목이 있는 섹션만 메뉴에 넣는다
  const hasContent: Record<SectionKey, boolean> = {
    interests: localizeAll(interests, lang, localizeInterest).length > 0,
    publications: localizeAll(pubs, lang, localizePublication).length > 0,
    projects: localizeAll(projects, lang, localizeProject).length > 0,
    education: localizeAll(education, lang, localizeEducation).length > 0,
    experiences: localizeAll(experiences, lang, localizeExperience).length > 0,
    teaching: localizeAll(teaching, lang, localizeExperience).length > 0,
    skills: localizeAll(skillData.skills, lang, localizeSkill).length > 0,
    awards: localizeAll(awards, lang, localizeAward).length > 0,
    activities: localizeAll(activities, lang, localizeActivity).length > 0,
    contact: Object.values(profile.contacts).some(Boolean),
  };
  const navSections = profile.section_order.filter((s) => s.visible && hasContent[s.key]).map((s) => s.key);
  const t = getDict(lang);
  const other: Lang = lang === "ko" ? "en" : "ko";
  // 한국어 상세 페이지에서 영문판이 있는지 판단하는 데 쓴다
  const enSlugs =
    lang === "ko"
      ? {
          projects: localizeAll(projects, "en", localizeProject).map((p) => p.slug),
          publications: localizeAll(pubs, "en", localizePublication).map((p) => p.slug),
        }
      : undefined;
  const linkCls = "rounded px-2 py-1.5 text-muted hover:text-fg";
  return (
    <header className="no-print border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75 sticky top-0 z-20">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:shadow"
      >
        {t.skipToContent}
      </a>
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap sm:px-6">
        <Link
          href={localePath(lang, "/")}
          className="mr-auto shrink-0 font-heading text-base font-bold tracking-tight sm:text-lg"
        >
          {profile.name}
        </Link>
        {/* 섹션 메뉴: 모바일에서는 아래 줄에서 가로로 밀어 보고, 넓은 화면에서는 오른쪽에 줄바꿈해 놓는다 */}
        <nav
          aria-label={t.mainNav}
          className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-2 text-sm sm:order-none sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0"
        >
          <ul className="flex whitespace-nowrap sm:flex-wrap sm:justify-end">
            {navSections.map((key) => (
              <li key={key}>
                <Link href={sectionHref(lang, key)} className={`block ${linkCls}`}>
                  {t.section[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center gap-1 text-sm">
          {cvId && (
            <a
              href={`/api/files/${cvId}`}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 font-medium hover:border-accent hover:text-accent"
            >
              CV<span className="sr-only">{t.cvDownloadSr}</span>
            </a>
          )}
          <Suspense fallback={<LangLink lang={other} href={localePath(other, "/")} />}>
            <LangSwitch lang={lang} enSlugs={enSlugs} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter({ lang }: { lang: Lang }) {
  "use cache";
  cacheLife("max");
  const [original, lastUpdated] = await Promise.all([getProfile(), getLastUpdated()]);
  const profile = localizeProfile(original, lang);
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-col gap-1 px-4 py-8 text-sm text-subtle sm:flex-row sm:justify-between sm:px-6">
        <p>© {profile.name_en || profile.name}</p>
        {lastUpdated && (
          <p>
            {getDict(lang).lastUpdated} <time dateTime={lastUpdated}>{formatDate(lastUpdated, lang)}</time>
          </p>
        )}
      </div>
    </footer>
  );
}
