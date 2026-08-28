import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { SideProjectRowActions } from "@/components/admin/side-project-row-actions";
import { getAdminSideProjects } from "@/lib/cms/side-projects";
import { getSideProjectName } from "@/lib/side-project-name";

export default async function AdminSideProjectsPage() {
  const projects = await getAdminSideProjects();

  return (
    <div>
      <header className="admin-page-heading">
        <div><p className="section-kicker">Portfolio CMS</p><h1>Side projects</h1><p>{projects.length} personal experiments visible on the portfolio.</p></div>
        <Link className="admin-button admin-button-primary" href="/admin/side-projects/new"><Plus aria-hidden="true" /> New side project</Link>
      </header>
      <section className="admin-project-table">
        {projects.length ? projects.map((project) => (
          <article className="admin-project-row" key={project.id}>
            <div><h2><Link href={`/admin/side-projects/${project.id}`}>{getSideProjectName(project.url)}</Link></h2><p>{project.tools.join(" · ") || "No tools added"}</p></div>
            <div className="admin-project-row-links">
              <a href={project.url} rel="noreferrer" target="_blank" title="Open side project"><ArrowUpRight aria-hidden="true" /></a>
              <Link className="admin-button" href={`/admin/side-projects/${project.id}`}>Edit</Link>
              <SideProjectRowActions id={project.id} />
            </div>
          </article>
        )) : <div className="admin-empty-state"><p>No side projects yet.</p><Link className="admin-button admin-button-primary" href="/admin/side-projects/new">Add the first side project</Link></div>}
      </section>
    </div>
  );
}
