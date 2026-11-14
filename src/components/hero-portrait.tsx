"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useRef } from "react";

/**
 * Backlit portrait for the hero: a dark figure against a blue glow, with a strip of light
 * across the eyes. While the cursor is over the hero, a soft spotlight follows it.
 */
export function HeroPortrait({ children }: { children?: ReactNode }) {
  const figure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = figure.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const section = node.closest("section") ?? node;

    let targetX = 50;
    let targetY = 34;
    let targetRadius = 0;
    let x = 50;
    let y = 34;
    let radius = 0;
    let frame = 0;

    const tick = () => {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      radius += (targetRadius - radius) * 0.12;
      node.style.setProperty("--spot-x", `${x.toFixed(2)}%`);
      node.style.setProperty("--spot-y", `${y.toFixed(2)}%`);
      node.style.setProperty("--spot-r", `${radius.toFixed(1)}px`);
      const settled = Math.abs(targetX - x) < 0.05 && Math.abs(targetY - y) < 0.05 && Math.abs(targetRadius - radius) < 0.3;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };

    const move = (event: Event) => {
      const pointer = event as PointerEvent;
      const rect = node.getBoundingClientRect();
      targetX = ((pointer.clientX - rect.left) / rect.width) * 100;
      targetY = ((pointer.clientY - rect.top) / rect.height) * 100;
      // Only open the spotlight when the cursor is near the figure.
      const near = targetX > -15 && targetX < 115 && targetY > -15 && targetY < 115;
      targetRadius = near ? rect.width * 0.2 : 0;
      wake();
    };
    const leave = () => { targetRadius = 0; wake(); };

    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="hero-portrait">
      <div aria-hidden="true" className="hero-portrait-glow" />
      {children}
      <div className="hero-portrait-figure" ref={figure}>
        <div className="hero-portrait-photo">
          <Image alt="Hector Heredia" height={1254} preload sizes="(max-width: 1000px) 92vw, 48vw" src="/hero-portrait-front.png" width={1254} />
          <Image alt="" aria-hidden="true" className="hero-portrait-lit" height={1254} sizes="(max-width: 1000px) 92vw, 48vw" src="/hero-portrait-front.png" width={1254} />
        </div>
        <div aria-hidden="true" className="hero-portrait-lines" />
      </div>
    </div>
  );
}
