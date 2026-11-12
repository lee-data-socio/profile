import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublications } from "@/lib/data";
import { PUBLICATION_TYPE_ORDER } from "@/lib/labels";
import { getDict, isLang, languageAlternates, localePath, localizeAll, localizePublication } from "@/lib/i18n";
import { PublicationItem } from "@/components/publication-item";
import { EmptyNote } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/publications">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.section.publications,
    description: t.publicationsDescription,
    alternates: { canonical: localePath(lang, "/publications"), languages: languageAlternates("/publications") },
  };
}

export default async function PublicationsPage({ params }: PageProps<"/[lang]/publications">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const pubs = localizeAll(await getPublications(), lang, localizePublication);
  const groups = PUBLICATION_TYPE_ORDER.map((type) => ({
    type,
    // 연도 역순, 연도 없는(준비 중) 항목은 위로
    items: pubs
      .filter((p) => p.type === type)
      .sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999) || a.sort_order - b.sort_order),
  })).filter((g) => g.items.length);

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight">{t.section.publications}</h1>
      <p className="mt-2 text-muted">{t.publicationsIntro}</p>
      {groups.length ? (
        <nav aria-label={t.publicationsJump} className="no-print mt-6 flex flex-wrap gap-2 text-sm">
          {groups.map((g) => (
            <a key={g.type} href={`#${g.type}`} className="rounded-full border border-line px-3 py-1 text-muted hover:border-accent hover:text-accent">
              {t.pubType[g.type]} {g.items.length}
            </a>
          ))}
        </nav>
      ) : (
        <div className="mt-8">
          <EmptyNote>{t.publicationsEmpty}</EmptyNote>
        </div>
      )}
      {groups.map((g) => (
        <section key={g.type} aria-labelledby={g.type} className="mt-10 scroll-mt-20">
          <h2 id={g.type} className="border-b border-line pb-2 font-heading text-xl font-bold">
            {t.pubType[g.type]}
          </h2>
          <ul className="divide-y divide-line">
            {g.items.map((p) => (
              <PublicationItem key={p.id} pub={p} lang={lang} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
