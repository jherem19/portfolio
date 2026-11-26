"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProjectSummary } from "@/types/cms";

export function FeaturedShowcase({ projects }: { projects: ProjectSummary[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const manualUntilRef = useRef(0);
  const [active, setActive] = useState(0);
  const cards = projects.length > 1 ? [...projects, ...projects, ...projects] : projects;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || projects.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = 0;
    let inView = false;
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
    observer.observe(rail);
    const position = (i: number) => {
      const card = rail.children[i] as HTMLElement;
      return card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
    };
    rail.scrollLeft = position(projects.length);
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 40) : 0;
      previous = now;
      if (!motion.matches && inView && !document.hidden && !hoveredRef.current && now > manualUntilRef.current && !rail.contains(document.activeElement)) {
        rail.scrollLeft += elapsed * .035;
        if (rail.scrollLeft >= position(projects.length * 2)) rail.scrollLeft -= position(projects.length * 2) - position(projects.length);
        if (rail.scrollLeft < position(0)) rail.scrollLeft += position(projects.length) - position(0);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [projects.length]);

  if (!projects.length) return null;

  const move = (direction: number) => {
    manualUntilRef.current = performance.now() + 1500;
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
      <div className="featured-editorial-rail" ref={railRef} onScroll={() => {
        const rail = railRef.current;
        if (!rail) return;
        const center = rail.scrollLeft + rail.clientWidth / 2;
        let nearest = 0;
        let distance = Infinity;
        Array.from(rail.children).forEach((child, i) => {
          const card = child as HTMLElement;
          const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (delta < distance) { distance = delta; nearest = i; }
        });
        setActive(nearest);
      }} tabIndex={0} aria-label="Scroll featured projects">
        {cards.map((project, i) => <Link className="featured-editorial-card" data-position={i < active ? "previous" : i > active ? "next" : "active"} onMouseEnter={() => { hoveredRef.current = true; }} onMouseLeave={() => { hoveredRef.current = false; }} tabIndex={i >= projects.length && i < projects.length * 2 || projects.length === 1 ? 0 : -1} key={`${project.slug}-${i}`} href={`/work/${project.slug}`}>
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
