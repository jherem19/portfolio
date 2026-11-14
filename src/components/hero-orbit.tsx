"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type OrbitItem = { href: string; src: string; title: string; position: string };

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
// Deterministic pseudo-random so the layout is identical on every visit.
const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/**
 * Project cards drifting around the hero copy. While the primary call to action is
 * hovered or focused they swirl in and gather around it, then drift back out.
 */
export function HeroOrbit({ items }: { items: OrbitItem[] }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const cards = Array.from(node.querySelectorAll<HTMLElement>(".orbit-card"));
    if (cards.length === 0) return;
    const section = node.closest("section") ?? node;
    const aroundPortrait = Boolean(node.closest(".hero-portrait"));
    const cta = section.querySelector<HTMLElement>(".intro-actions .hero-cta-primary");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const seeds = cards.map((card, index) => {
      const depth = 0.3 + noise(index + 1) * 0.7;
      card.style.zIndex = String(Math.round(depth * 10));
      card.style.filter = depth < 0.55 ? `blur(${((0.55 - depth) * 6).toFixed(1)}px)` : "";
      return {
        phase: (index / cards.length) * Math.PI * 2 + (noise(index + 20) - 0.5) * 0.3,
        ring: noise(index + 40),
        depth,
        tilt: (noise(index + 60) - 0.5) * 36,
        wobble: noise(index + 80) * Math.PI * 2,
        hover: 0,
        hovering: false,
      };
    });

    let width = 1;
    let height = 1;
    let gatherX = 0;
    let gatherY = 0;
    let compact = false;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      compact = width < 760;
      if (cta) {
        const target = cta.getBoundingClientRect();
        gatherX = target.left + target.width / 2 - rect.left - width / 2;
        gatherY = target.top + target.height / 2 - rect.top - height / 2;
      }
    };

    let gatherTarget = 0;
    let gather = 0;
    let angle = 0;
    let intro = reduced ? 1 : 0;
    let time = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    let last = 0;
    let visible = true;

    const render = (delta: number) => {
      time += delta;
      intro = Math.min(1, intro + delta * 0.8);
      const entrance = 1 - Math.pow(1 - intro, 3);
      gather += (gatherTarget - gather) * Math.min(1, delta * 4.2);
      const anyHover = seeds.some((seed) => seed.hovering);
      angle += delta * 0.055 * (1 + gather * 7) * (anyHover ? 0.2 : 1);
      parallaxX += (pointerX - parallaxX) * Math.min(1, delta * 3);
      parallaxY += (pointerY - parallaxY) * Math.min(1, delta * 3);

      for (let index = 0; index < cards.length; index++) {
        const seed = seeds[index];
        seed.hover += ((seed.hovering ? 1 : 0) - seed.hover) * Math.min(1, delta * 9);
        const theta = angle + seed.phase;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        // Squared-off ellipse that keeps the centre clear for the copy and uses the corners.
        const ring = seed.ring + Math.sin(time * 0.25 + seed.wobble) * 0.05;
        const radiusX = width * (aroundPortrait ? 0.32 + ring * 0.08 : compact ? 0.5 + ring * 0.1 : 0.39 + ring * 0.13) * (1.25 - entrance * 0.25);
        const radiusY = height * (0.41 + ring * 0.13) * (1.25 - entrance * 0.25);
        const orbitX = radiusX * Math.sign(cos) * Math.pow(Math.abs(cos), 0.72);
        const orbitY = radiusY * Math.sign(sin) * Math.pow(Math.abs(sin), 0.72);
        // Gathered: a tight swirl around the call to action.
        const swirl = 64 + seed.ring * 96;
        const nearX = gatherX + cos * swirl * 1.7;
        const nearY = gatherY + sin * (aroundPortrait ? 16 + seed.ring * 16 : swirl * 0.85);

        const x = lerp(orbitX, nearX, gather) + parallaxX * seed.depth;
        const y = lerp(orbitY, nearY, gather) + parallaxY * seed.depth;
        const baseScale = (0.55 + seed.depth * 0.6) * (compact ? 0.8 : 1);
        const scale = lerp(baseScale, baseScale * 0.5, gather) * (1 + seed.hover * 0.14);
        const calm = 1 - seed.hover;
        const rotateZ = (seed.tilt + Math.sin(time * 0.35 + seed.wobble) * 8) * calm;
        const rotateY = Math.sin(time * 0.42 + seed.wobble * 1.7) * 24 * calm;
        const rotateX = Math.cos(time * 0.38 + seed.wobble) * 16 * calm;

        cards[index].style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rotateZ.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        cards[index].style.opacity = (lerp(0.4 + seed.depth * 0.6, 1, Math.max(gather, seed.hover)) * entrance).toFixed(3);
      }
    };

    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      render(delta);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (frame || reduced || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => { measure(); if (reduced) render(0); };
    const gatherIn = () => { measure(); gatherTarget = 1; };
    const gatherOut = () => { gatherTarget = 0; };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = (event.clientX / window.innerWidth - 0.5) * -46;
      pointerY = (event.clientY / window.innerHeight - 0.5) * -34;
    };
    const visibility = () => (document.hidden ? stop() : start());
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    });
    const cardHandlers = cards.map((card, index) => {
      const enter = () => { seeds[index].hovering = true; };
      const leave = () => { seeds[index].hovering = false; };
      card.addEventListener("pointerenter", enter);
      card.addEventListener("pointerleave", leave);
      return () => { card.removeEventListener("pointerenter", enter); card.removeEventListener("pointerleave", leave); };
    });

    measure();
    render(0);
    observer.observe(node);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    cta?.addEventListener("pointerenter", gatherIn);
    cta?.addEventListener("pointerleave", gatherOut);
    cta?.addEventListener("focus", gatherIn);
    cta?.addEventListener("blur", gatherOut);
    start();

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("visibilitychange", visibility);
      cta?.removeEventListener("pointerenter", gatherIn);
      cta?.removeEventListener("pointerleave", gatherOut);
      cta?.removeEventListener("focus", gatherIn);
      cta?.removeEventListener("blur", gatherOut);
      cardHandlers.forEach((remove) => remove());
    };
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div aria-hidden="true" className="hero-orbit" ref={host}>
      {items.map((item, index) => (
        <Link className="orbit-card" href={item.href} key={index} tabIndex={-1} title={item.title}>
          <Image alt="" fill quality={60} sizes="(max-width: 760px) 96px, 256px" src={item.src} style={{ objectPosition: item.position }} />
        </Link>
      ))}
    </div>
  );
}
