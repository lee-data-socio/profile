import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  link: "로그인 링크가 만료되었거나 잘못되었습니다. 다시 요청하세요. (링크는 요청한 브라우저에서 열어야 합니다)",
  owner: "관리자 계정이 아닙니다.",
  config: "서버에 Supabase 환경변수가 설정되지 않았습니다. README 의 배포 안내를 확인하세요.",
};

async function ErrorNote({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { error } = await searchParams;
  const msg = typeof error === "string" ? ERRORS[error] : undefined;
  return msg ? (
    <p role="alert" className="mb-4 rounded-md bg-danger/10 p-3 text-sm text-danger">
      {msg}
    </p>
  ) : null;
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold">관리자 로그인</h1>
        <p className="mt-1 mb-6 text-sm text-muted">이메일로 받은 링크를 눌러 로그인합니다.</p>
        <Suspense>
          <ErrorNote searchParams={searchParams} />
        </Suspense>
        <LoginForm />
        <Link href="/" className="mt-6 block text-center text-xs text-subtle hover:text-accent">
          ← 사이트로 돌아가기
        </Link>
      </div>
    </main>
  );
}
