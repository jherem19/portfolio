"use client";

import { useEffect } from "react";

const GLOW_SELECTOR = ".glow-label, .hero-availability, .inquiry-availability, .hero-cta:not(.hero-cta-primary), .service-brief li, .agency-engagements li, .side-project-content li, .resource-badge, .three-d-filters button, .contact-choice span";

export function GlowHover() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const track = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(GLOW_SELECTOR) : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      target.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };

    document.addEventListener("pointermove", track, { passive: true });
    return () => document.removeEventListener("pointermove", track);
  }, []);

  return null;
}
