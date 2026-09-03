import type { Metadata } from "next";

import { SiteSidebar } from "@/components/site-sidebar";
import { ThreeDLibrary } from "@/components/three-d-library";
import { getPublishedProjects } from "@/lib/cms/projects";

export const metadata: Metadata = {
  title: "3D Archive",
  description: "Selected 3D environments, product visualizations, and motion studies by Hector Heredia.",
  alternates: { canonical: "/3d" },
};

export const revalidate = 60;

export default async function ThreeDArchivePage() {
  const projects = (await getPublishedProjects()).filter((project) => project.show_in_3d_archive);

  return (
    <main className="site-shell">
      <SiteSidebar active="3d" />
      <div className="page-content three-d-page">
        <header className="three-d-page-hero">
          <p className="section-kicker">A focused collection</p>
          <h1>3D Archive</h1>
          <p>Environments, product studies, and motion experiments built through modeling, materials, lighting, and real-time workflows.</p>
        </header>
        <section className="three-d-library" aria-label="3D project library">
          <ThreeDLibrary projects={projects} />
        </section>
      </div>
    </main>
  );
}
