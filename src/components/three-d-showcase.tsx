import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ThreeDCard } from "@/components/three-d-card";
import type { ProjectSummary } from "@/types/cms";

export function ThreeDShowcase({ projects }: { projects: ProjectSummary[] }) {
  const selected = projects.slice(0, 3);

  if (!selected.length) return null;

  return (
    <div className="three-d-showcase" aria-labelledby="three-d-showcase-title">
      <header className="three-d-showcase-heading">
        <div>
          <p className="section-kicker">3D · Selected studies</p>
          <h3 id="three-d-showcase-title">Dimensional work, curated.</h3>
        </div>
        <Link href="/3d">View 3D library <ArrowRight aria-hidden="true" /></Link>
      </header>
      <div className="three-d-showcase-grid">
        {selected.map((project) => <ThreeDCard compact key={project.id} project={project} />)}
      </div>
    </div>
  );
}
