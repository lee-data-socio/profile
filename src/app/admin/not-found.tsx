import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center px-4 py-24 sm:px-6">
      <p className="text-sm text-subtle">404</p>
      <h1 className="mt-2 font-heading text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-muted">삭제되었거나 주소가 잘못된 항목입니다.</p>
      <Link href="/admin" className="mt-6 text-accent hover:underline underline-offset-4">
        ← 관리자 홈으로
      </Link>
    </main>
  );
}
