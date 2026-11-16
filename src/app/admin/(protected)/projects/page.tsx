import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { ProjectRowActions } from "@/components/admin/project-row-actions";
import { getAdminProjects } from "@/lib/cms/projects";
import type { ProjectSummary } from "@/types/cms";

type SearchParams = { year?: string; month?: string; order?: string };

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ProjectRow({ project }: { project: ProjectSummary }) {
  return (
    <article className="admin-project-row">
      <div>
        <span className={`admin-status admin-status-${project.status}`}>{project.status}</span>
        <h2><Link href={`/admin/projects/${project.id}`}>{project.title}</Link></h2>
        <p>{project.category || "Uncategorized"} · {project.project_date}{project.featured ? " · Featured Work" : ""}{project.show_in_3d_archive ? " · 3D Archive" : ""}</p>
      </div>
      <div className="admin-project-row-links">
        {project.status === "published" ? <a href={`/work/${project.slug}`} target="_blank" title="View public page"><ArrowUpRight aria-hidden="true" /></a> : null}
        <Link className="admin-button" href={`/admin/projects/${project.id}`}>Edit</Link>
        <ProjectRowActions featured={project.featured} id={project.id} status={project.status} />
      </div>
    </article>
  );
}

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { year = "", month = "", order = "newest" } = await searchParams;
  const all = await getAdminProjects();

  const years = [...new Set(all.map((project) => project.project_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const direction = order === "oldest" ? 1 : -1;
  const filtered = all
    .filter((project) => (!year || project.project_date.startsWith(year)) && (!month || project.project_date.slice(5, 7) === month))
    .sort((a, b) => direction * a.project_date.localeCompare(b.project_date));

  const featured = filtered.filter((project) => project.featured);
  const others = filtered.filter((project) => !project.featured);
  const filtering = Boolean(year || month || order === "oldest");

  return (
    <div>
      <header className="admin-page-heading">
        <div><p className="section-kicker">Portfolio CMS</p><h1>Projects</h1><p>{filtering ? `${filtered.length} of ${all.length}` : all.length} projects across drafts and published work.</p></div>
        <Link className="admin-button admin-button-primary" href="/admin/projects/new"><Plus aria-hidden="true" /> New project</Link>
      </header>

      <form className="admin-filter-bar" method="get">
        <label className="admin-field"><span>Year</span>
          <select defaultValue={year} name="year"><option value="">All years</option>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        </label>
        <label className="admin-field"><span>Month</span>
          <select defaultValue={month} name="month"><option value="">All months</option>{monthNames.map((name, index) => <option key={name} value={String(index + 1).padStart(2, "0")}>{name}</option>)}</select>
        </label>
        <label className="admin-field"><span>Order</span>
          <select defaultValue={order} name="order"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
        </label>
        <button className="admin-button admin-button-primary" type="submit">Filter</button>
        {filtering ? <Link className="admin-button" href="/admin/projects">Clear</Link> : null}
      </form>

      {featured.length ? (
        <section className="admin-project-group">
          <h2 className="admin-group-title">Featured Work <span>{featured.length}</span></h2>
          <div className="admin-project-table">{featured.map((project) => <ProjectRow key={project.id} project={project} />)}</div>
        </section>
      ) : null}

      <section className="admin-project-group">
        <h2 className="admin-group-title">{featured.length ? "Other projects" : "All projects"} <span>{others.length}</span></h2>
        <div className="admin-project-table">
          {others.length ? others.map((project) => <ProjectRow key={project.id} project={project} />) : filtered.length ? <div className="admin-empty-state"><p>Every matching project is featured.</p></div> : (
            <div className="admin-empty-state"><p>{all.length ? "No projects match these filters." : "No projects yet."}</p>{all.length ? <Link className="admin-button" href="/admin/projects">Clear filters</Link> : <Link className="admin-button admin-button-primary" href="/admin/projects/new">Create the first project</Link>}</div>
          )}
        </div>
      </section>
    </div>
  );
}
