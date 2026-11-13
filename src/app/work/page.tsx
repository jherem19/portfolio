import type { Metadata } from "next";

import { FeaturedProjects } from "@/components/featured-projects";
import { SiteSidebar } from "@/components/site-sidebar";
import { site } from "@/data/site";
import { getPublishedProjects } from "@/lib/cms/projects";

export const metadata: Metadata = {
  title: "Selected Design Work",
  description:
    "Product design, websites, motion, visual identity, and interactive 3D projects by Hector Heredia.",
  alternates: { canonical: `${site.url}/work` },
};

export const revalidate = 60;

export default async function WorkArchivePage() {
  const projects = await getPublishedProjects();

  return (
    <main className="site-shell">
      <SiteSidebar active="work" horizontal />
      <div className="page-content work-archive-page">
        <header className="work-archive-hero">
          <p className="section-kicker">Selected work · 2022—2026</p>
          <h1>Work</h1>
          <div>
            <p>Product interfaces, websites, visual systems, motion, and interactive 3D built for launches, releases, and evolving products.</p>
            <span>{String(projects.length).padStart(2, "0")} projects</span>
          </div>
        </header>
        <section className="work-archive-library" aria-label="All projects">
          <FeaturedProjects projects={projects} />
        </section>
      </div>
    </main>
  );
}
