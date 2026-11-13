import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEntryItems, getExperiences } from "@/lib/data";
import {
  getDict,
  isLang,
  languageAlternates,
  localePath,
  localizeAll,
  localizeEntryItem,
  localizeExperience,
} from "@/lib/i18n";
import { ExperienceList } from "@/components/home-sections";
import { EmptyNote } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/experience">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.section.experiences,
    description: t.experiencesDescription,
    alternates: { canonical: localePath(lang, "/experience"), languages: languageAlternates("/experience") },
  };
}

export default async function ExperiencePage({ params }: PageProps<"/[lang]/experience">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const [allExperiences, allItems] = await Promise.all([getExperiences(), getEntryItems("experience")]);
  const experiences = localizeAll(allExperiences, lang, localizeExperience);
  const items = localizeAll(allItems, lang, localizeEntryItem);

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight">{t.section.experiences}</h1>
      <div className="mt-8">
        {experiences.length ? (
          <ExperienceList experiences={experiences} items={items} lang={lang} detailed />
        ) : (
          <EmptyNote>{t.listEmpty}</EmptyNote>
        )}
      </div>
    </>
  );
}
