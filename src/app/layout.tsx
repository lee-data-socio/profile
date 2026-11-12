import type { Metadata, Viewport } from "next";
import { cacheLife } from "next/cache";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/env";
import { getProfile } from "@/lib/data";
import { richToPlain } from "@/components/rich-text";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const serif = Noto_Serif_KR({
  variable: "--font-serif-kr",
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  "use cache";
  cacheLife("max");
  const profile = await getProfile();
  const title = profile.name_en ? `${profile.name} (${profile.name_en})` : profile.name;
  const description =
    profile.headline || richToPlain(profile.bio).slice(0, 160) || `${profile.name}의 연구·경력 포트폴리오`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${profile.name}` },
    description,
    openGraph: {
      type: "profile",
      siteName: profile.name,
      title,
      description,
      locale: "ko_KR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#121315" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        {/* Vercel 대시보드에서 Web Analytics 를 켠 뒤 NEXT_PUBLIC_ENABLE_ANALYTICS=1 로 활성화 */}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1" && <Analytics />}
      </body>
    </html>
  );
}
