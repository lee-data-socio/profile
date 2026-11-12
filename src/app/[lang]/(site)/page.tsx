import Image from "next/image";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActivities,
  getAwards,
  getCvAttachmentId,
  getEducation,
  getEntryItems,
  getExperiences,
  getInterests,
  getProfile,
  getProjects,
  getPublications,
  getSkills,
  getTeaching,
} from "@/lib/data";
import { AVATAR_BUCKET, SITE_URL, SUPABASE_URL } from "@/lib/env";
import {
  getDict,
  isLang,
  languageAlternates,
  localePath,
  localizeActivity,
  localizeAll,
  localizeAward,
  localizeEducation,
  localizeEntryItem,
  localizeExperience,
  localizeInterest,
  localizeProfile,
  localizeProject,
  localizePublication,
  localizeSkill,
} from "@/lib/i18n";
import type { SectionKey } from "@/lib/types";
import { RichText, richToPlain } from "@/components/rich-text";
import { TagList } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import {
  ActivitiesSection,
  AwardsSection,
  ContactSection,
  EducationSection,
  ExperienceSection,
  HeroLinks,
  InterestsSection,
  ProjectsSection,
  PublicationsSection,
  SkillsSection,
  TeachingSection,
  contactHref,
} from "@/components/home-sections";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { alternates: { canonical: localePath(lang, "/"), languages: languageAlternates("/") } };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const [
    rawProfile,
    cvId,
    allInterests,
    allEducation,
    allPublications,
    allProjects,
    allExperiences,
    allTeaching,
    allExperienceItems,
    skillData,
    allAwards,
    allActivities,
  ] = await Promise.all([
    getProfile(),
    getCvAttachmentId(),
    getInterests(),
    getEducation(),
    getPublications(),
    getProjects(),
    getExperiences(),
    getTeaching(),
    getEntryItems("experience"),
    getSkills(),
    getAwards(),
    getActivities(),
  ]);

  // 영어면 영문 값으로 바꾸고 영문이 없는 항목은 뺀다 (캐시된 데이터는 그대로 두고 여기서 처리)
  const profile = localizeProfile(rawProfile, lang);
  const interests = localizeAll(allInterests, lang, localizeInterest);
  const education = localizeAll(allEducation, lang, localizeEducation);
  const publications = localizeAll(allPublications, lang, localizePublication);
  const projects = localizeAll(allProjects, lang, localizeProject);
  const experiences = localizeAll(allExperiences, lang, localizeExperience);
  const teaching = localizeAll(allTeaching, lang, localizeExperience);
  const experienceItems = localizeAll(allExperienceItems, lang, localizeEntryItem);
  const skills = localizeAll(skillData.skills, lang, localizeSkill);
  const awards = localizeAll(allAwards, lang, localizeAward);
  const activities = localizeAll(allActivities, lang, localizeActivity);

  const sections: Record<SectionKey, ReactNode> = {
    interests: <InterestsSection interests={interests} projects={projects} publications={publications} lang={lang} />,
    publications: <PublicationsSection publications={publications} lang={lang} />,
    projects: <ProjectsSection projects={projects} lang={lang} />,
    education: <EducationSection education={education} lang={lang} />,
    experiences: <ExperienceSection experiences={experiences} items={experienceItems} lang={lang} />,
    teaching: <TeachingSection teaching={teaching} lang={lang} />,
    skills: <SkillsSection skills={skills} stats={skillData.stats} lang={lang} />,
    awards: <AwardsSection awards={awards} lang={lang} />,
    activities: <ActivitiesSection activities={activities} lang={lang} />,
    contact: <ContactSection contacts={profile.contacts} lang={lang} />,
  };

  const photoUrl = profile.photo_path
    ? `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${profile.photo_path}`
    : null;

  const sameAs = (["scholar", "orcid", "researchgate", "github", "linkedin", "website"] as const)
    .filter((k) => profile.contacts[k])
    .map((k) => contactHref(k, profile.contacts[k]!));

  const currentEdu = education.find((e) => e.is_current) ?? education[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.name,
          ...(profile.name_en ? { alternateName: profile.name_en } : {}),
          url: lang === "ko" ? SITE_URL : `${SITE_URL}${localePath(lang, "/")}`,
          ...(profile.headline ? { jobTitle: profile.headline } : {}),
          ...(richToPlain(profile.bio) ? { description: richToPlain(profile.bio).trim().slice(0, 300) } : {}),
          ...(photoUrl ? { image: photoUrl } : {}),
          ...(currentEdu ? { affiliation: { "@type": "CollegeOrUniversity", name: currentEdu.school } } : {}),
          ...(profile.interests.length ? { knowsAbout: profile.interests } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        }}
      />

      <section aria-labelledby="intro" className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 id="intro" className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {profile.name}
            {profile.name_en && <span className="ml-3 align-middle text-lg font-normal text-subtle">{profile.name_en}</span>}
          </h1>
          {profile.headline && <p className="mt-3 text-lg text-muted">{profile.headline}</p>}
          <RichText doc={profile.bio} className="mt-6 text-[15px] text-fg/90" />
          {profile.interests.length > 0 && (
            <div className="mt-6">
              <TagList tags={profile.interests} tone="accent" label={t.tags} />
            </div>
          )}
          {(cvId || Object.values(profile.contacts).some(Boolean)) && (
            <div className="no-print mt-7 flex flex-wrap items-center gap-2">
              {cvId && (
                <a
                  href={`/api/files/${cvId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                >
                  {t.cvDownload} <span aria-hidden>↓</span>
                </a>
              )}
              <HeroLinks contacts={profile.contacts} lang={lang} />
            </div>
          )}
        </div>
        {photoUrl && (
          <Image
            src={photoUrl}
            alt={t.photoAlt(profile.name)}
            width={160}
            height={160}
            priority
            className="h-28 w-28 shrink-0 rounded-full border border-line object-cover sm:h-40 sm:w-40"
          />
        )}
      </section>

      {profile.section_order
        .filter((s) => s.visible)
        .map((s) => (
          <div key={s.key}>{sections[s.key]}</div>
        ))}
    </>
  );
}
