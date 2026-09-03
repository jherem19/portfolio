import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import type { ProjectSummary } from "@/types/cms";

export function ThreeDCard({ project, compact = false }: { project: ProjectSummary; compact?: boolean }) {
  const content = (
    <>
      <div className="three-d-card-image">
        <Image
          alt={`${project.title} 3D project preview`}
          fill
          quality={75}
          sizes={compact ? "(max-width: 760px) calc(100vw - 40px), 30vw" : "(max-width: 760px) calc(100vw - 40px), 38vw"}
          src={project.cover_image}
        />
        <span className="three-d-card-open"><ArrowUpRight aria-hidden="true" /></span>
      </div>
      <div className="three-d-card-meta">
        <h3>{project.title}</h3>
      </div>
    </>
  );

  return <a className={compact ? "three-d-card is-compact" : "three-d-card"} href={`/work/${project.slug}`}>{content}</a>;
}
