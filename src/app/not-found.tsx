import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center px-4 py-24 sm:px-6">
      <p className="text-sm text-subtle">404</p>
      <h1 className="mt-2 font-heading text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-muted">주소가 바뀌었거나 비공개로 전환된 항목일 수 있습니다.</p>
      <Link href="/" className="mt-6 text-accent hover:underline underline-offset-4">
        ← 홈으로
      </Link>
    </main>
  );
}
