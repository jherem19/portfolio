import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { type CSSProperties } from "react";

import type { ProjectSummary } from "@/types/cms";

const PAGE_SIZE = 12;

export function FeaturedProjects({ projects }: { projects: ProjectSummary[] }) {
  const visibleProjects = projects.slice(0, PAGE_SIZE);
  const remainingProjects = projects.slice(PAGE_SIZE);

  return (
    <>
      <div className="work-grid">
        {visibleProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      {remainingProjects.length > 0 ? (
        <details className="more-projects">
          <summary className="load-more-projects">
            <span className="load-more-label">Load more projects</span>
            <span className="load-less-label">Show fewer projects</span>
            <span className="load-more-count">{remainingProjects.length}</span>
            <ArrowDown aria-hidden="true" />
          </summary>
          <div className="work-grid work-grid-more">
            {remainingProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <a className="work-card" href={`/work/${project.slug}`}>
      <div className="work-image">
        <Image
          src={project.cover_image}
          alt={`${project.title} project cover`}
          fill
          quality={60}
          sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1050px) calc((100vw - 346px) / 2), calc((100vw - 300px - 14vw - 28px) / 2)"
          style={{ "--cover-scale": project.cover_zoom / 100, objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` } as CSSProperties}
        />
        <span className="work-open"><ArrowUpRight aria-hidden="true" /></span>
      </div>
      <div className="work-meta">
        <div><span>{project.category}</span><h3>{project.title}</h3></div>
        <p>{project.tags.slice(0, 2).join(" · ")}<br />{project.project_date.slice(0, 4)}</p>
      </div>
    </a>
  );
}
