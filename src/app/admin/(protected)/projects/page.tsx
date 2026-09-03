import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { ProjectRowActions } from "@/components/admin/project-row-actions";
import { getAdminProjects } from "@/lib/cms/projects";

export default async function AdminProjectsPage() {
  const projects = await getAdminProjects();

  return (
    <div>
      <header className="admin-page-heading">
        <div><p className="section-kicker">Portfolio CMS</p><h1>Projects</h1><p>{projects.length} projects across drafts and published work.</p></div>
        <Link className="admin-button admin-button-primary" href="/admin/projects/new"><Plus aria-hidden="true" /> New project</Link>
      </header>
      <section className="admin-project-table">
        {projects.length ? projects.map((project) => (
          <article className="admin-project-row" key={project.id}>
            <div>
              <span className={`admin-status admin-status-${project.status}`}>{project.status}</span>
              <h2><Link href={`/admin/projects/${project.id}`}>{project.title}</Link></h2>
              <p>{project.category || "Uncategorized"} · {project.project_date.slice(0, 4)}{project.featured ? " · Featured Work" : ""}{project.show_in_3d_archive ? " · 3D Archive" : ""}</p>
            </div>
            <div className="admin-project-row-links">
              {project.status === "published" ? <a href={`/work/${project.slug}`} target="_blank" title="View public page"><ArrowUpRight aria-hidden="true" /></a> : null}
              <Link className="admin-button" href={`/admin/projects/${project.id}`}>Edit</Link>
              <ProjectRowActions id={project.id} status={project.status} />
            </div>
          </article>
        )) : <div className="admin-empty-state"><p>No projects yet.</p><Link className="admin-button admin-button-primary" href="/admin/projects/new">Create the first project</Link></div>}
      </section>
    </div>
  );
}
