"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { useRef } from "react";
import type { ProjectSummary } from "@/types/cms";

export function FeaturedShowcase({ projects }: { projects: ProjectSummary[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  if (!projects.length) return null;

  const move = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.children) as HTMLElement[];
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let current = 0;
    cards.forEach((card, i) => {
      if (Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(cards[current].offsetLeft + cards[current].offsetWidth / 2 - center)) current = i;
    });
    const card = cards[Math.max(0, Math.min(cards.length - 1, current + direction))];
    rail.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return (
    <div className="featured-editorial">
      {projects.length > 1 ? <div className="featured-editorial-controls" aria-label="Featured work navigation">
        <button type="button" aria-label="Previous featured project" onClick={() => move(-1)}><ArrowLeft aria-hidden="true" /></button>
        <button type="button" aria-label="Next featured project" onClick={() => move(1)}><ArrowRight aria-hidden="true" /></button>
      </div> : null}
      <div className="featured-editorial-rail" ref={railRef} tabIndex={0} aria-label="Scroll featured projects">
        {projects.map((project) => <Link className="featured-editorial-card" key={project.slug} href={`/work/${project.slug}`}>
          <Image src={project.cover_image} alt={`${project.title} project cover`} fill quality={80} sizes="(max-width: 760px) 86vw, 60vw" style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }} />
          <div className="featured-editorial-blur" aria-hidden="true"><span /><span /><span /></div>
          <div className="featured-editorial-caption">
            <h3>{project.title}</h3>
            <p>{project.short_description}</p>
            <span className="featured-editorial-view">View <ArrowUpRight aria-hidden="true" /></span>
          </div>
        </Link>)}
      </div>
    </div>
  );
}
