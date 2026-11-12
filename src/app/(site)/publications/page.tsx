import type { Metadata } from "next";
import { getPublications } from "@/lib/data";
import { PUBLICATION_TYPE_LABEL, PUBLICATION_TYPE_ORDER } from "@/lib/labels";
import { PublicationItem } from "@/components/publication-item";
import { EmptyNote } from "@/components/ui";

export const metadata: Metadata = {
  title: "논문·학술발표",
  description: "학술지 논문, 학위논문, 학술대회 발표, 연구보고서, 워킹페이퍼 목록",
  alternates: { canonical: "/publications" },
};

export default async function PublicationsPage() {
  const pubs = await getPublications();
  const groups = PUBLICATION_TYPE_ORDER.map((type) => ({
    type,
    // 연도 역순, 연도 없는(준비 중) 항목은 위로
    items: pubs
      .filter((p) => p.type === type)
      .sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999) || a.sort_order - b.sort_order),
  })).filter((g) => g.items.length);

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight">논문·학술발표</h1>
      <p className="mt-2 text-muted">ASA 인용 형식, 유형별·연도 역순. 굵은 이름이 본인입니다.</p>
      {groups.length ? (
        <nav aria-label="유형 바로가기" className="no-print mt-6 flex flex-wrap gap-2 text-sm">
          {groups.map((g) => (
            <a key={g.type} href={`#${g.type}`} className="rounded-full border border-line px-3 py-1 text-muted hover:border-accent hover:text-accent">
              {PUBLICATION_TYPE_LABEL[g.type]} {g.items.length}
            </a>
          ))}
        </nav>
      ) : (
        <div className="mt-8">
          <EmptyNote>아직 공개된 논문·발표가 없습니다.</EmptyNote>
        </div>
      )}
      {groups.map((g) => (
        <section key={g.type} aria-labelledby={g.type} className="mt-10 scroll-mt-20">
          <h2 id={g.type} className="border-b border-line pb-2 font-serif text-xl font-bold">
            {PUBLICATION_TYPE_LABEL[g.type]}
          </h2>
          <ul className="divide-y divide-line">
            {g.items.map((p) => (
              <PublicationItem key={p.id} pub={p} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
