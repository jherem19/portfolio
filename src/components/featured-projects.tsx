"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { type CSSProperties, useState } from "react";

import type { CMSProject } from "@/types/cms";

const PAGE_SIZE = 12;

export function FeaturedProjects({ projects }: { projects: CMSProject[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleProjects = projects.slice(0, visibleCount);
  const remaining = projects.length - visibleProjects.length;

  return (
    <>
      <div className="work-grid">
        {visibleProjects.map((project, index) => (
          <Link className="work-card" href={`/work/${project.slug}`} key={project.slug}>
            <div className="work-image">
              <Image
                src={project.cover_image}
                alt={`${project.title} project cover`}
                fill
                priority={index < 2}
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 70vw, 42vw"
                style={{ "--cover-scale": project.cover_zoom / 100, objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` } as CSSProperties}
                unoptimized={project.cover_image.startsWith("http")}
              />
              <span className="work-open"><ArrowUpRight aria-hidden="true" /></span>
            </div>
            <div className="work-meta">
              <div><span>{project.category}</span><h3>{project.title}</h3></div>
              <p>{project.tags.slice(0, 2).join(" · ")}<br />{project.project_date.slice(0, 4)}</p>
            </div>
          </Link>
        ))}
      </div>
      {remaining > 0 ? (
        <button className="load-more-projects" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} type="button">
          Load more projects <span>{remaining}</span><ArrowDown aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
