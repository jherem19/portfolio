"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { createFooterGradient } from "@/components/footer-gradient";
import { RollText } from "@/components/motion";
import { SocialLinks } from "@/components/social-links";
import { site } from "@/data/site";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];
const WORDMARK = "Jherem";

/**
 * Closing card: a living gradient that follows the cursor and a wordmark whose letters
 * sharpen and thicken near the cursor, then scatter and spring back on click.
 */
export function SiteFooter() {
  const card = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const word = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cardNode = card.current;
    const canvasNode = canvas.current;
    const wordNode = word.current;
    if (!cardNode || !canvasNode || !wordNode) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gradient = createFooterGradient(canvasNode);
    if (gradient) cardNode.classList.add("has-gradient");
    const letters = Array.from(wordNode.children) as HTMLElement[];
    const motion = letters.map(() => ({ x: 0, y: 0, rotation: 0, vx: 0, vy: 0, vr: 0 }));

    let width = 1;
    let height = 1;
    const resize = () => {
      width = cardNode.clientWidth;
      height = cardNode.clientHeight;
      gradient?.resize(width, height);
    };

    let pointerX = 0.7;
    let pointerY = 0.3;
    let smoothX = 0.7;
    let smoothY = 0.3;
    let hoverTarget = 0;
    let hover = 0;
    let clickX = 0.5;
    let clickY = 0.5;
    let pulse = 10;
    let time = 0;
    let frame = 0;
    let last = 0;
    let visible = false;

    const render = (delta: number) => {
      time += delta;
      pulse += delta;
      hover += (hoverTarget - hover) * Math.min(1, delta * 4);
      smoothX += (pointerX - smoothX) * Math.min(1, delta * 6);
      smoothY += (pointerY - smoothY) * Math.min(1, delta * 6);
      gradient?.render({ time, mouseX: smoothX, mouseY: 1 - smoothY, hover, clickX, clickY: 1 - clickY, pulse });

      // Without a cursor, a slow virtual pointer keeps sweeping the wordmark.
      const wordTop = wordNode.offsetTop;
      const idleX = width * (0.5 + 0.44 * Math.sin(time * 0.5));
      const idleY = wordTop + wordNode.offsetHeight * 0.5;
      const focusX = idleX + (smoothX * width - idleX) * hover;
      const focusY = idleY + (smoothY * height - idleY) * hover;
      const reach = Math.max(130, width * 0.17);
      const maxBlur = Math.min(14, Math.max(5, width * 0.011));

      letters.forEach((letter, index) => {
        const state = motion[index];
        state.vx += (-70 * state.x - 9 * state.vx) * delta;
        state.vy += (-70 * state.y - 9 * state.vy) * delta;
        state.vr += (-70 * state.rotation - 9 * state.vr) * delta;
        state.x += state.vx * delta;
        state.y += state.vy * delta;
        state.rotation += state.vr * delta;

        const centerX = letter.offsetLeft + letter.offsetWidth / 2;
        const centerY = letter.offsetTop + letter.offsetHeight / 2;
        const distance = Math.hypot(centerX - focusX, (centerY - focusY) * 0.6);
        const influence = Math.exp(-((distance / reach) ** 2));
        letter.style.fontVariationSettings = `"wght" ${Math.round(200 + influence * 700)}`;
        letter.style.filter = `blur(${((1 - influence) * maxBlur).toFixed(1)}px)`;
        letter.style.opacity = (0.3 + influence * 0.7).toFixed(3);
        letter.style.transform = `translate(${state.x.toFixed(1)}px, ${(state.y - influence * height * 0.022).toFixed(1)}px) rotate(${state.rotation.toFixed(2)}deg)`;
      });
    };

    const loop = (now: number) => {
      render(Math.min(0.05, (now - last) / 1000));
      last = now;
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (frame || reduced || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };

    const locate = (event: PointerEvent) => {
      const rect = cardNode.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    };
    const move = (event: PointerEvent) => {
      const point = locate(event);
      pointerX = point.x;
      pointerY = point.y;
      hoverTarget = 1;
    };
    const leave = () => { hoverTarget = 0; };
    const press = (event: PointerEvent) => {
      const point = locate(event);
      clickX = point.x;
      clickY = point.y;
      pulse = 0;
      // Scatter the wordmark away from the click; the springs in render() bring it home.
      letters.forEach((letter, index) => {
        const dx = letter.offsetLeft + letter.offsetWidth / 2 - point.x * width;
        const dy = letter.offsetTop + letter.offsetHeight / 2 - point.y * height;
        const distance = Math.max(40, Math.hypot(dx, dy));
        const force = Math.min(1600, (width * 520) / distance);
        motion[index].vx += (dx / distance) * force;
        motion[index].vy += (dy / distance) * force * 0.7;
        motion[index].vr += (dx > 0 ? 1 : -1) * Math.min(420, force * 0.3);
      });
    };
    const visibility = () => (document.hidden ? stop() : start());
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    });
    const resizeObserver = new ResizeObserver(() => { resize(); if (reduced) render(0); });

    resize();
    render(0);
    observer.observe(cardNode);
    resizeObserver.observe(cardNode);
    cardNode.addEventListener("pointermove", move);
    cardNode.addEventListener("pointerleave", leave);
    cardNode.addEventListener("pointerdown", press);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      cardNode.removeEventListener("pointermove", move);
      cardNode.removeEventListener("pointerleave", leave);
      cardNode.removeEventListener("pointerdown", press);
      document.removeEventListener("visibilitychange", visibility);
      gradient?.dispose();
    };
  }, []);

  return (
    <footer className="site-footer">
      <div className="site-footer-card" ref={card}>
        <canvas aria-hidden="true" ref={canvas} />
        <div className="site-footer-top">
          <nav aria-label="Footer">
            {LINKS.map((link) => (
              <Link href={link.href} key={link.href}><RollText text={link.label} /></Link>
            ))}
          </nav>
          <div className="site-footer-contact">
            <SocialLinks compact />
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <p>Santiago, Chile · UTC−3</p>
            <p className="footer-availability"><i aria-hidden="true" /> Available for select projects</p>
          </div>
        </div>
        <div aria-hidden="true" className="site-footer-word" ref={word}>
          {Array.from(WORDMARK).map((letter, index) => <span key={index}>{letter}</span>)}
        </div>
        <div className="site-footer-legal">
          <span>© 2026 {site.name}</span>
          <span>Design · Illustration · Motion · 3D</span>
        </div>
      </div>
    </footer>
  );
}
