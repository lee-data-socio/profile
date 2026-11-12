import type { MetadataRoute } from "next";
import { getProfile, getProjects, getPublications } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, projects, pubs] = await Promise.all([getProfile(), getProjects(), getPublications()]);
  return [
    { url: `${SITE_URL}/`, lastModified: profile.updated_at || undefined, priority: 1 },
    { url: `${SITE_URL}/projects`, priority: 0.8 },
    { url: `${SITE_URL}/publications`, priority: 0.8 },
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
    ...pubs.map((p) => ({ url: `${SITE_URL}/publications/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
  ];
}
