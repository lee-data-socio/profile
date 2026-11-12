import Link from "next/link";
import { cacheLife } from "next/cache";
import { getCvAttachmentId, getLastUpdated, getProfile } from "@/lib/data";
import { formatDate } from "@/lib/format";

export async function SiteHeader() {
  "use cache";
  cacheLife("max");
  const [profile, cvId] = await Promise.all([getProfile(), getCvAttachmentId()]);
  return (
    <header className="no-print border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75 sticky top-0 z-20">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:shadow"
      >
        본문으로 건너뛰기
      </a>
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-heading text-base font-bold tracking-tight sm:text-lg">
          {profile.name}
        </Link>
        <nav aria-label="주 메뉴" className="flex items-center gap-1 text-sm sm:gap-2">
          <Link href="/projects" className="rounded px-2 py-1.5 text-muted hover:text-fg">
            프로젝트
          </Link>
          <Link href="/publications" className="rounded px-2 py-1.5 text-muted hover:text-fg">
            논문·발표
          </Link>
          {cvId && (
            <a
              href={`/api/files/${cvId}`}
              className="ml-1 rounded-md border border-line bg-surface px-2.5 py-1.5 font-medium hover:border-accent hover:text-accent"
            >
              CV<span className="sr-only"> 다운로드</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  "use cache";
  cacheLife("max");
  const [profile, lastUpdated] = await Promise.all([getProfile(), getLastUpdated()]);
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-col gap-1 px-4 py-8 text-sm text-subtle sm:flex-row sm:justify-between sm:px-6">
        <p>© {profile.name_en || profile.name}</p>
        {lastUpdated && (
          <p>
            마지막 업데이트 <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
          </p>
        )}
      </div>
    </footer>
  );
}
