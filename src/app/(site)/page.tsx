import Image from "next/image";
import type { ReactNode } from "react";
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
  InterestsSection,
  ProjectsSection,
  PublicationsSection,
  SkillsSection,
  TeachingSection,
  contactHref,
} from "@/components/home-sections";

export default async function HomePage() {
  const [
    profile,
    cvId,
    interests,
    education,
    publications,
    projects,
    experiences,
    teaching,
    experienceItems,
    skills,
    awards,
    activities,
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

  const sections: Record<SectionKey, ReactNode> = {
    interests: <InterestsSection interests={interests} projects={projects} publications={publications} />,
    publications: <PublicationsSection publications={publications} />,
    projects: <ProjectsSection projects={projects} />,
    education: <EducationSection education={education} />,
    experiences: <ExperienceSection experiences={experiences} items={experienceItems} />,
    teaching: <TeachingSection teaching={teaching} />,
    skills: <SkillsSection skills={skills.skills} stats={skills.stats} />,
    awards: <AwardsSection awards={awards} />,
    activities: <ActivitiesSection activities={activities} />,
    contact: <ContactSection contacts={profile.contacts} />,
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
          url: SITE_URL,
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
          <h1 id="intro" className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {profile.name}
            {profile.name_en && <span className="ml-3 align-middle text-lg font-normal text-subtle">{profile.name_en}</span>}
          </h1>
          {profile.headline && <p className="mt-3 text-lg text-muted">{profile.headline}</p>}
          <RichText doc={profile.bio} className="mt-6 text-[15px] text-fg/90" />
          {profile.interests.length > 0 && (
            <div className="mt-6">
              <TagList tags={profile.interests} tone="accent" />
            </div>
          )}
          {cvId && (
            <a
              href={`/api/files/${cvId}`}
              className="no-print mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90"
            >
              CV 다운로드 <span aria-hidden>↓</span>
            </a>
          )}
        </div>
        {photoUrl && (
          <Image
            src={photoUrl}
            alt={`${profile.name} 프로필 사진`}
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
