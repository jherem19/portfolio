"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

type RotatorProject = {
  slug: string;
  title: string;
  cover_image: string;
  cover_position_x: number;
  cover_position_y: number;
};

export function HeroProjectRotator({ projects, interval = 4500 }: { projects: RotatorProject[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (projects.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % projects.length), interval);
    return () => window.clearInterval(timer);
  }, [interval, paused, projects.length]);

  const active = projects[index];
  if (!active) return null;

  return (
    <Link
      className="bento-card bento-project"
      href={`/work/${active.slug}`}
      onBlur={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {projects.map((project, position) => (
        <div aria-hidden="true" className="bento-project-slide" data-active={position === index ? "true" : undefined} key={project.slug}>
          <Image
            alt=""
            fill
            priority={position === 0}
            sizes="(max-width: 760px) 50vw, 24vw"
            src={project.cover_image}
            style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }}
          />
        </div>
      ))}
      <span className="bento-project-caption" key={active.slug}>
        <small>Latest project</small>
        {active.title}
        <ArrowUpRight aria-hidden="true" />
      </span>
    </Link>
  );
}
