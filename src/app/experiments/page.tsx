import type { Metadata } from "next";

import { SideProjects } from "@/components/side-projects";
import { SiteSidebar } from "@/components/site-sidebar";
import { site } from "@/data/site";
import { getSideProjects } from "@/lib/cms/side-projects";

export const metadata: Metadata = {
  title: "Design Experiments",
  description: "Personal interface, interaction, and 3D experiments by Hector Heredia.",
  alternates: { canonical: `${site.url}/experiments` },
};

export default async function ExperimentsPage() {
  const projects = await getSideProjects();

  return (
    <main className="site-shell">
      <SiteSidebar active="work" horizontal />
      <div className="page-content experiments-page">
        <header className="experiments-hero">
          <p className="section-kicker">Personal practice</p>
          <h1>Experiments</h1>
          <p>Small interface, interaction, and 3D studies made to test ideas outside a client brief.</p>
        </header>
        <SideProjects projects={projects} />
      </div>
    </main>
  );
}
