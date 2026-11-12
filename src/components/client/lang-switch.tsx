"use client";

import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";

const NAME: Record<Lang, { short: string; full: string }> = {
  ko: { short: "KO", full: "한국어" },
  en: { short: "EN", full: "English" },
};

const linkCls = "rounded px-2 py-1.5 text-muted hover:text-fg";

/** 다른 언어의 같은 페이지로 가는 링크. 영문이 없는 상세 페이지에서는 /en 홈으로 보낸다. */
export function LangSwitch({
  lang,
  enSlugs,
}: {
  lang: Lang;
  /** 한국어 페이지에서만: 영문 상세 페이지가 있는 slug */
  enSlugs?: { projects: string[]; publications: string[] };
}) {
  const pathname = usePathname();
  // 사전 렌더링 때는 내부 경로(/ko/...), 브라우저에서는 실제 주소(/...)가 들어오므로 접두어를 떼고 비교한다
  const path = pathname.replace(/^\/(ko|en)(?=\/|$)/, "") || "/";
  let href: string;
  if (lang === "en") {
    href = path;
  } else {
    const detail = path.match(/^\/(projects|publications)\/([^/]+)$/);
    const hasEnglish = !detail || Boolean(enSlugs?.[detail[1] as "projects" | "publications"].includes(detail[2]));
    href = !hasEnglish || path === "/" ? "/en" : `/en${path}`;
  }
  return <LangLink lang={lang === "ko" ? "en" : "ko"} href={href} />;
}

/** 경로를 아직 모를 때(사전 렌더링 중 Suspense 대체 화면) 쓰는 다른 언어 홈 링크 */
export function LangLink({ lang, href }: { lang: Lang; href: string }) {
  // 언어가 바뀌면 <html lang> 도 바뀌어야 하므로 전체 페이지를 새로 불러오는 <a> 를 쓴다
  return (
    <a href={href} hrefLang={lang} lang={lang} aria-label={NAME[lang].full} className={linkCls}>
      <span className="sm:hidden">{NAME[lang].short}</span>
      <span className="hidden sm:inline">{NAME[lang].full}</span>
    </a>
  );
}
