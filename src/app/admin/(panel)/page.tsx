import { adminPage } from "@/lib/auth";
import Link from "next/link";
import { getCounts } from "@/lib/admin-data";
import { ADMIN_SECTION_ORDER, SECTIONS } from "@/lib/sections";

export default async function AdminHome() {
  await adminPage();
  const counts = await getCounts();
  return (
    <>
      <h1 className="font-heading text-2xl font-bold">대시보드</h1>
      <p className="mt-1 text-sm text-muted">
        저장하면 재배포 없이 공개 페이지에 바로 반영됩니다. 초안·비공개 항목은 공개 페이지에 나오지 않습니다.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <li>
          <Link href="/admin/profile" className="block rounded-xl border border-line bg-surface p-4 hover:border-accent">
            <p className="font-medium">프로필·CV·섹션 순서</p>
            <p className="mt-1 text-xs text-subtle">이름, 소개, 연락처, 사진, CV 파일, 홈 섹션 순서</p>
          </Link>
        </li>
        {ADMIN_SECTION_ORDER.map((k) => (
          <li key={k}>
            <Link href={`/admin/${k}`} className="block rounded-xl border border-line bg-surface p-4 hover:border-accent">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium">{SECTIONS[k].label}</p>
                <p className="text-xs tabular-nums text-subtle">
                  공개 {counts[k].public} / 전체 {counts[k].total}
                </p>
              </div>
              <p className="mt-1 text-xs text-subtle">{SECTIONS[k].description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-bold">백업</h2>
        <p className="mt-1 text-sm text-muted">
          전체 데이터를 JSON 으로 내려받습니다 (첨부파일 본문 제외). 월 1회 내려받아 따로 보관하세요.
        </p>
        <a href="/admin/export" className="mt-3 inline-block text-sm text-accent hover:underline" download>
          JSON 내보내기 ↓
        </a>
      </section>
    </>
  );
}
