import { ArrowDown } from "lucide-react";

import { ProjectCoverPreview } from "@/components/project-cover-preview";
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
      <ProjectCoverPreview project={project} />
      <div className="work-meta">
        <div><span>{project.category}</span><h3>{project.title}</h3></div>
        <p>{project.tags.slice(0, 2).join(" · ")}<br />{project.project_date.slice(0, 4)}</p>
      </div>
    </a>
  );
}
