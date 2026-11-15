"use client";

import { useEffect, useState } from "react";

/** Floating hint at the bottom of the first screen that invites scrolling; it leaves once the visitor scrolls. */
export function ScrollCue({ href = "#services" }: { href?: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const update = () => setHidden(window.scrollY > 60);
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <a aria-hidden={hidden} className={hidden ? "scroll-cue is-hidden" : "scroll-cue"} href={href} tabIndex={hidden ? -1 : undefined}>
      <span aria-hidden="true" className="scroll-cue-mouse"><i /></span>
      <span>Scroll</span>
      <span aria-hidden="true" className="scroll-cue-chevrons"><i /><i /></span>
    </a>
  );
}
