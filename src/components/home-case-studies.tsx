"use client";

import Image from "next/image";
import { RollText } from "@/components/motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  const rotating = multiple && !paused && !hovered && !focused && !reducedMotion && visible && pageVisible;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % projects.length), 6500);
    return () => window.clearTimeout(timer);
  }, [rotating, index, projects.length]);

  if (!active) return null;
  const displayTitle = active.title.split(/\s+[—–]\s+/)[0];
  const move = (direction: number) => setIndex((activeIndex + direction + projects.length) % projects.length);

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
      <div className="home-case-banner">
        <div className="home-case-slide" key={`slide-${active.slug}`} role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} of ${projects.length}`}>
          <div className="home-case-copy">
            <p className="home-case-eyebrow">Case study <span> / {active.project_date.slice(0, 4)}</span></p>
            <h2>{displayTitle}</h2>
            <p className="home-case-description">{active.short_description}</p>
            <Link className="hero-cta hero-cta-primary" href={`/work/${active.slug}`} aria-label={`Read the case study: ${active.title}`}><RollText text="Read the case study" /> <ArrowRight aria-hidden="true" /></Link>
        {multiple ? (
          <div className="home-case-controls" aria-label="Case study navigation">
            <span className="home-case-counter" aria-live={rotating ? "off" : "polite"}>{String(activeIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
            <button type="button" aria-label="Previous case study" onClick={() => move(-1)}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" aria-label="Next case study" onClick={() => move(1)}><ArrowRight aria-hidden="true" /></button>
            {!reducedMotion ? <button type="button" aria-label={paused ? "Resume automatic rotation" : "Pause automatic rotation"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</button> : null}
          </div>
        ) : null}
          </div>
          <Link className="home-case-thumbnail" href={`/work/${active.slug}`} aria-label={`View ${displayTitle}`}>
            <Image src={active.cover_image} alt={`${displayTitle} project preview`} width={720} height={480} sizes="(max-width: 640px) 85vw, 36vw" style={{ width: "100%", height: "auto" }} />
          </Link>
        </div>

      </div>
    </section>
  );
}
