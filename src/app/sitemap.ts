import type { MetadataRoute } from "next";

import { site } from "@/data/site";
import { getPublishedProjects } from "@/lib/cms/projects";

const lastModified = new Date("2026-08-21T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  return [
    {
      url: site.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${site.url}${site.image}`],
    },
    {
      url: `${site.url}/3d`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...projects.map((project) => ({
      url: `${site.url}/work/${project.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
      images: [project.cover_image.startsWith("http") ? project.cover_image : `${site.url}${project.cover_image}`],
    })),
  ];
}
