import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTeaching } from "@/lib/data";
import { getDict, isLang, languageAlternates, localePath, localizeAll, localizeExperience } from "@/lib/i18n";
import { TeachingList } from "@/components/home-sections";
import { EmptyNote } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/training">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.section.teaching,
    description: t.teachingDescription,
    alternates: { canonical: localePath(lang, "/training"), languages: languageAlternates("/training") },
  };
}

export default async function TrainingPage({ params }: PageProps<"/[lang]/training">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const teaching = localizeAll(await getTeaching(), lang, localizeExperience);

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight">{t.section.teaching}</h1>
      <div className="mt-8">
        {teaching.length ? <TeachingList teaching={teaching} lang={lang} detailed /> : <EmptyNote>{t.listEmpty}</EmptyNote>}
      </div>
    </>
  );
}
