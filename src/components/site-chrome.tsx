import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { getCvAttachmentId, getLastUpdated, getProfile, getProjects, getPublications } from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  getDict,
  localePath,
  localizeAll,
  localizeProfile,
  localizeProject,
  localizePublication,
  type Lang,
} from "@/lib/i18n";
import { LangLink, LangSwitch } from "@/components/client/lang-switch";

export async function SiteHeader({ lang }: { lang: Lang }) {
  "use cache";
  cacheLife("max");
  const [original, cvId, projects, pubs] = await Promise.all([
    getProfile(),
    getCvAttachmentId(),
    getProjects(),
    getPublications(),
  ]);
  const profile = localizeProfile(original, lang);
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
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-6">
        <Link href={localePath(lang, "/")} className="font-heading text-base font-bold tracking-tight sm:text-lg">
          {profile.name}
        </Link>
        <nav aria-label={t.mainNav} className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href={localePath(lang, "/projects")} className={linkCls}>
            {t.navProjects}
          </Link>
          <Link href={localePath(lang, "/publications")} className={linkCls}>
            {t.navPublications}
          </Link>
          {cvId && (
            <a
              href={`/api/files/${cvId}`}
              className="ml-1 rounded-md border border-line bg-surface px-2.5 py-1.5 font-medium hover:border-accent hover:text-accent"
            >
              CV<span className="sr-only">{t.cvDownloadSr}</span>
            </a>
          )}
          <Suspense fallback={<LangLink lang={other} href={localePath(other, "/")} />}>
            <LangSwitch lang={lang} enSlugs={enSlugs} />
          </Suspense>
        </nav>
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
