import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { adminPage } from "@/lib/auth";
import { signOut } from "@/app/admin/actions";
import { ADMIN_SECTION_ORDER, SECTIONS } from "@/lib/sections";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

// 관리자 화면은 매 요청마다 세션을 확인하므로 즉시 내비게이션 검증에서 제외한다.
export const instant = false;

async function OwnerGate({ children }: { children: ReactNode }) {
  const owner = await adminPage();
  return (
    <>
      <p className="mb-6 text-right text-xs text-subtle">{owner.email}</p>
      {children}
    </>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const links = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/profile", label: "프로필·CV·섹션 순서" },
    ...ADMIN_SECTION_ORDER.map((k) => ({ href: `/admin/${k}`, label: SECTIONS[k].label })),
  ];
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:self-start md:overflow-y-auto md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin" className="font-serif font-bold">
            사이트 관리
          </Link>
          <Link href="/" className="text-xs text-accent hover:underline" target="_blank">
            사이트 보기 ↗
          </Link>
        </div>
        <AdminNav links={links} />
        <form action={signOut} className="hidden px-4 py-4 md:block">
          <button type="submit" className="text-xs text-subtle hover:text-danger">
            로그아웃
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Suspense fallback={<p className="text-sm text-subtle">불러오는 중…</p>}>
            <OwnerGate>{children}</OwnerGate>
          </Suspense>
          <form action={signOut} className="mt-10 md:hidden">
            <button type="submit" className="text-xs text-subtle hover:text-danger">
              로그아웃
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
