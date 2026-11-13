import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/env";
import { getProfile } from "@/lib/data";
import { getDict, isLang, LANGS, localizeProfile, siteTitle, type Lang } from "@/lib/i18n";
import { richToPlain } from "@/components/rich-text";
import { rootViewport, sans } from "../fonts";
import "../globals.css";

/**
 * 공개 페이지의 루트 레이아웃. 한국어는 next.config 의 rewrites 로 /ko 아래에서 렌더링되고
 * (주소창에는 /, /projects …), 영어는 /en 아래에 있다.
 */
export async function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  // URL 객체는 "use cache" 결과로 직렬화할 수 없어 바깥에서 붙인다
  return { metadataBase: new URL(SITE_URL), ...(await siteMetadata(isLang(lang) ? lang : "ko")) };
}

async function siteMetadata(lang: Lang): Promise<Metadata> {
  "use cache";
  cacheLife("hours");
  const original = await getProfile();
  const profile = localizeProfile(original, lang);
  const t = getDict(lang);
  const title =
    lang === "ko" && original.name_en ? `${original.name} (${original.name_en})` : profile.name;
  const description =
    profile.headline || richToPlain(profile.bio).slice(0, 160) || t.siteDescription(profile.name);
  return {
    title: { default: title, template: `%s | ${siteTitle(profile)}` },
    description,
    openGraph: {
      type: "profile",
      siteName: siteTitle(profile),
      title,
      description,
      locale: t.locale,
      alternateLocale: getDict(lang === "ko" ? "en" : "ko").locale,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport = rootViewport;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  // 번역 확장 프로그램(Trancy 등)이 <html> 에 class 를 붙여 생기는 hydration 경고를 무시 (이 태그 속성에만 적용)
  return (
    <html lang={lang} className={`${sans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {children}
        {/* Vercel 대시보드에서 Web Analytics 를 켠 뒤 NEXT_PUBLIC_ENABLE_ANALYTICS=1 로 활성화 */}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1" && <Analytics />}
      </body>
    </html>
  );
}
