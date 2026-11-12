import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/env";
import { getDict } from "@/lib/i18n";
import { rootViewport, sans } from "./fonts";
import "./globals.css";

/**
 * 어떤 경로와도 맞지 않는 주소의 404. 루트 레이아웃이 공개([lang])·관리자 둘이라
 * 레이아웃 없이 완전한 문서를 돌려준다 (next.config 의 experimental.globalNotFound).
 * 언어를 알 수 없으므로 한국어·영어를 함께 보여 준다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "404",
  robots: { index: false, follow: false },
};

export const viewport = rootViewport;

export default function GlobalNotFound() {
  const ko = getDict("ko").notFound;
  const en = getDict("en").notFound;
  // 번역 확장 프로그램(Trancy 등)이 <html> 에 class 를 붙여 생기는 hydration 경고를 무시 (이 태그 속성에만 적용)
  return (
    <html lang="ko" className={`${sans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center px-4 py-24 sm:px-6">
          <p className="text-sm text-subtle">404</p>
          <h1 className="mt-2 font-heading text-2xl font-bold">{ko.heading}</h1>
          <p className="mt-2 text-muted">{ko.body}</p>
          <p lang="en" className="mt-4 text-sm text-subtle">
            {en.heading}. {en.body}
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/" className="text-accent hover:underline underline-offset-4">
              {ko.home}
            </Link>
            <Link href="/en" lang="en" className="text-accent hover:underline underline-offset-4">
              {en.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
