import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { getSideProjectName } from "@/lib/side-project-name";
import type { SideProject } from "@/types/cms";

export function SideProjects({ projects }: { projects: SideProject[] }) {
  if (!projects.length) return null;

  return (
    <section className="side-projects-section" aria-labelledby="side-projects-title">
      <header className="side-projects-heading">
        <p className="section-kicker">Personal experiments</p>
        <h2 id="side-projects-title">Side projects</h2>
      </header>
      <div className="side-projects-grid">
        {projects.map((project) => (
          <a className="side-project-card" href={project.url} key={project.id} rel="noreferrer" target="_blank">
            <div className="side-project-thumbnail">
              <Image
                alt={`${getSideProjectName(project.url)} preview`}
                fill
                quality={60}
                sizes="(max-width: 760px) calc(100vw - 72px), (max-width: 1050px) 180px, 220px"
                src={project.thumbnail}
              />
            </div>
            <div className="side-project-content">
              <div className="side-project-title">
                <h3>{getSideProjectName(project.url)}</h3>
                <ArrowUpRight aria-hidden="true" />
              </div>
              <ul aria-label="Tools used">
                {project.tools.map((tool) => <li key={tool}>{tool}</li>)}
              </ul>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
