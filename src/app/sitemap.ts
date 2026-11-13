import type { MetadataRoute } from "next";
import { getProfile, getProjects, getPublications } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { languageAlternates, localePath, localizeProject, localizePublication } from "@/lib/i18n";

type Entry = MetadataRoute.Sitemap[number];

/** 한국어 주소와, 영문판이 있으면 /en 주소를 hreflang 대체 주소와 함께 넣는다 */
function entries(path: string, hasEnglish: boolean, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  if (!hasEnglish) return [{ url: `${SITE_URL}${path}`, ...rest }];
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([k, v]) => [k, `${SITE_URL}${v}`]),
  );
  return [
    { url: `${SITE_URL}${path}`, alternates: { languages }, ...rest },
    { url: `${SITE_URL}${localePath("en", path)}`, alternates: { languages }, ...rest },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, projects, pubs] = await Promise.all([getProfile(), getProjects(), getPublications()]);
  return [
    ...entries("/", true, { lastModified: profile.updated_at || undefined, priority: 1 }),
    ...entries("/projects", true, { priority: 0.8 }),
    ...entries("/publications", true, { priority: 0.8 }),
    ...entries("/experience", true, { priority: 0.7 }),
    ...entries("/training", true, { priority: 0.7 }),
    ...projects.flatMap((p) =>
      entries(`/projects/${p.slug}`, Boolean(localizeProject(p, "en")), { lastModified: p.updated_at, priority: 0.6 }),
    ),
    ...pubs.flatMap((p) =>
      entries(`/publications/${p.slug}`, Boolean(localizePublication(p, "en")), { lastModified: p.updated_at, priority: 0.6 }),
    ),
  ];
}
