import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProjectSummary } from "@/types/cms";

export function WorkCaseStudies({ projects }: { projects: ProjectSummary[] }) {
  if (!projects.length) return null;
  return (
    <section className="work-case-studies" aria-labelledby="work-case-studies-title">
      <div className="work-stories-heading"><h2 id="work-case-studies-title">Case studies</h2><span>The thinking behind the work.</span></div>
      <div className={`work-stories-grid${projects.length === 1 ? " is-single" : projects.length === 2 ? " is-pair" : ""}`}>
        {projects.map((project, index) => (
          <Link className={`work-story${index === 0 ? " is-lead" : ""}`} href={`/work/${project.slug}`} key={project.id}>
            <div className="work-story-media"><Image alt="" src={project.cover_image} fill priority={index === 0} sizes={projects.length === 1 ? "(max-width: 760px) 100vw, 90vw" : "(max-width: 760px) 100vw, 65vw"} style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%`, transform: `scale(${project.cover_zoom / 100})` }} /></div>
            <div className="work-story-copy">
              <p className="work-story-category">{project.category} <span> / {project.project_date.slice(0, 4)}</span></p>
              <h3>{project.title}</h3>
              {index === 0 ? <><p className="work-story-description">{project.short_description}</p><span className="work-story-cta">Read the case study <ArrowUpRight aria-hidden="true" /></span></> : <ArrowUpRight className="work-story-arrow" aria-hidden="true" />}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
