import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/env";
import { rootViewport, sans } from "../fonts";
import "../globals.css";

/** 관리자 화면의 루트 레이아웃 (한국어 전용). 공개 페이지의 루트 레이아웃은 app/[lang]/layout.tsx */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false },
};

export const viewport = rootViewport;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  // 번역 확장 프로그램(Trancy 등)이 <html> 에 class 를 붙여 생기는 hydration 경고를 무시 (이 태그 속성에만 적용)
  return (
    <html lang="ko" className={`${sans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {children}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1" && <Analytics />}
      </body>
    </html>
  );
}
