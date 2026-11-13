import Image from "next/image";
import Link from "next/link";

import type { ProjectSummary } from "@/types/cms";

const ROWS = 3;
const TILE_SIZES = "(max-width: 760px) 62vw, 30vw";

export function FeaturedShowcase({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) return null;

  const rows = Array.from({ length: ROWS }, (_, row) => {
    const offset = (row * 2) % projects.length;
    return [...projects.slice(offset), ...projects.slice(0, offset)];
  });

  return (
    <div className="showcase-rows">
      {rows.map((row, rowIndex) => (
        <div className="showcase-row" key={rowIndex}>
          <div className="showcase-track">
            {[0, 1].map((copy) => (
              <div className="showcase-set" aria-hidden={copy === 1 ? true : undefined} key={copy}>
                {row.map((project) => (
                  <Link
                    className="showcase-tile"
                    href={`/work/${project.slug}`}
                    key={project.slug}
                    tabIndex={copy === 1 || rowIndex > 0 ? -1 : undefined}
                  >
                    <Image
                      src={project.cover_image}
                      alt={copy === 0 && rowIndex === 0 ? `${project.title} project cover` : ""}
                      fill
                      quality={60}
                      sizes={TILE_SIZES}
                      style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }}
                    />
                    <span>{project.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
