import type { MetadataRoute } from "next";

import { site } from "@/data/site";
import { getPublishedProjects } from "@/lib/cms/projects";

const siteLastModified = new Date("2026-11-13T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  return [
    {
      url: site.url,
      lastModified: siteLastModified,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${site.url}${site.image}`],
    },
    {
      url: `${site.url}/3d`,
      lastModified: siteLastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/services`,
      lastModified: siteLastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/contact`,
      lastModified: siteLastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map((project) => ({
      url: `${site.url}/work/${project.slug}`,
      lastModified: new Date(
        project.updated_at ?? project.published_at ?? project.project_date,
      ),
      changeFrequency: "yearly" as const,
      priority: 0.8,
      images: [project.cover_image.startsWith("http") ? project.cover_image : `${site.url}${project.cover_image}`],
    })),
    ...["/resources", "/resources/ae-bridge"].map((path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date("2026-10-13T00:00:00.000Z"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
