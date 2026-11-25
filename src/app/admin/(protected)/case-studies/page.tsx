import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { CaseOrderControls } from "@/components/admin/case-order-controls";
import { getAdminProjects } from "@/lib/cms/projects";
import { isCaseStudy, compareCaseStudies } from "@/lib/case-studies";
export default async function AdminCaseStudiesPage() {
 const projects = (await getAdminProjects()).filter(isCaseStudy).sort(compareCaseStudies);
 return <div><header className="admin-page-heading"><div><p className="section-kicker">Portfolio CMS</p><h1>Case studies</h1><p>Use the arrows to set the order shown on Home and Work. Changes save automatically.</p></div><Link className="admin-button admin-button-primary" href="/admin/case-studies/new"><Plus aria-hidden="true" /> New case study</Link></header><div className="admin-project-table">{projects.map((project, index) => <article className="admin-project-row" key={project.id}><div className="admin-project-main"><span>{index + 1}</span><Link className="admin-project-thumb" href={`/admin/projects/${project.id}`}><Image src={project.cover_image} alt="" fill sizes="120px" unoptimized /></Link><div><span className="case-study-badge">Case study</span> <span className={`admin-status admin-status-${project.status}`}>{project.status}</span><h2><Link href={`/admin/projects/${project.id}`}>{project.title}</Link></h2><p>{project.status === "draft" ? "Draft · hidden on the public site" : "Published"}</p></div></div><div className="admin-project-row-links"><CaseOrderControls id={project.id} first={index === 0} last={index === projects.length - 1} /><Link className="admin-button" href={`/admin/projects/${project.id}`}>Edit</Link></div></article>)}{!projects.length ? <div className="admin-empty-state">Mark a project as a case study to order it here.</div> : null}</div></div>;
}
