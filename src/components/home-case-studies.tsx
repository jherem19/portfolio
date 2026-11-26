"use client";

import Image from "next/image";
import { RollText } from "@/components/motion";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectSummary } from "@/types/cms";

type CaseStudy = Pick<ProjectSummary, "slug" | "title" | "short_description" | "cover_image" | "project_date">;

export function HomeCaseStudies({ projects }: { projects: CaseStudy[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const multiple = projects.length > 1;
  const activeIndex = index % Math.max(projects.length, 1);
  const active = projects[activeIndex];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () => setPageVisible(!document.hidden);
    syncMotion();
    syncVisibility();
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      media.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer.disconnect();
    };
  }, []);

  const moveTo = useCallback((next: number) => {
    const track = trackRef.current;
    const card = track?.children[next] as HTMLElement | undefined;
    const first = track?.children[0] as HTMLElement | undefined;
    if (track && card && first) track.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: reducedMotion ? "instant" : "smooth" });
  }, [reducedMotion]);

  const rotating = multiple && !paused && !hovered && !focused && !reducedMotion && visible && pageVisible;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => moveTo((activeIndex + 1) % projects.length), 6500);
    return () => window.clearTimeout(timer);
  }, [rotating, activeIndex, projects.length, moveTo]);

  if (!active) return null;

  return (
    <section
      ref={sectionRef}
      className="home-case-studies"
      aria-label="Case studies"
      aria-roledescription={multiple ? "carousel" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className={`home-case-frame${multiple ? " has-multiple" : ""}`}>
        {multiple ? (
          <div className="home-case-controls" aria-label="Case study navigation">
            {projects.map((project, dotIndex) => <button className="home-case-dot" key={project.slug} type="button" aria-label={`Show case study: ${project.title}`} aria-current={dotIndex === activeIndex ? "true" : undefined} onClick={() => moveTo(dotIndex)}><span /></button>)}
            {!reducedMotion ? <button type="button" aria-label={paused ? "Resume automatic rotation" : "Pause automatic rotation"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</button> : null}
          </div>
        ) : null}
      <div className="home-case-track" ref={trackRef} tabIndex={0} aria-label="Scroll case studies horizontally" onScroll={() => {
        const track = trackRef.current;
        if (!track) return;
        const first = track.children[0] as HTMLElement;
        let nearest = 0;
        let distance = Infinity;
        projects.forEach((_, candidate) => {
          const card = track.children[candidate] as HTMLElement;
          const delta = Math.abs(card.offsetLeft - first.offsetLeft - track.scrollLeft);
          if (delta < distance) { distance = delta; nearest = candidate; }
        });
        setIndex(nearest);
      }}>
        {projects.map((project, slideIndex) => {
          const displayTitle = project.title.split(/\s+[—–]\s+/)[0];
          return (
      <div className="home-case-banner" data-active={slideIndex === activeIndex} key={`${project.slug}-${slideIndex}`} inert={slideIndex !== activeIndex} aria-hidden={slideIndex !== activeIndex}>
        <div className="home-case-slide" role="group" aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${projects.length}`}>
          <div className="home-case-copy">
            <p className="home-case-eyebrow">Case study <span> / {project.project_date.slice(0, 4)}</span></p>
            <h2>{displayTitle}</h2>
            <p className="home-case-description">{project.short_description}</p>
            <Link className="hero-cta hero-cta-primary" href={`/work/${project.slug}`} aria-label={`Read the case study: ${project.title}`}><RollText text="Read the case study" /> <ArrowRight aria-hidden="true" /></Link>

          </div>
          <Link className="home-case-thumbnail" href={`/work/${project.slug}`} aria-label={`View ${displayTitle}`}>
            <Image src={project.cover_image} alt={`${displayTitle} project preview`} width={720} height={480} sizes="(max-width: 640px) 85vw, 36vw" style={{ width: "100%", height: "auto" }} />
          </Link>
        </div>

      </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
