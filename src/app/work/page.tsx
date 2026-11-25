import type { Metadata } from "next";

import { WorkLibrary } from "@/components/work-library";
import { WorkCaseStudies } from "@/components/work-case-studies";
import { isCaseStudy, compareCaseStudies } from "@/lib/case-studies";
import { SiteFooter } from "@/components/site-footer";
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
  // Newest first by project date (stable sort keeps the default order for ties)
  const projects = [...(await getPublishedProjects())].sort((a, b) => b.project_date.localeCompare(a.project_date));

  return (
    <main className="site-shell">
      <SiteSidebar active="work" horizontal />
      <div className="page-content work-archive-page">
        <header className="work-archive-intro">
          <h1>Selected work.</h1>
          <p>Design for products, brands, and the people behind them.</p>
        </header>
        <WorkCaseStudies projects={projects.filter(isCaseStudy).sort(compareCaseStudies)} />
        <section className="work-archive-library" aria-label="All projects">
          <div className="work-library-heading"><h2>Explore the work</h2><span>{projects.length} projects</span></div>
          <WorkLibrary projects={projects} />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
