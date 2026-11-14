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
/** Closing card: a fluted-glass backdrop whose light follows the cursor and ripples on click. */
export function SiteFooter() {
  const card = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cardNode = card.current;
    const canvasNode = canvas.current;
    if (!cardNode || !canvasNode) return;

    const gradient = createFooterGradient(canvasNode);
    if (!gradient) return;
    cardNode.classList.add("has-gradient");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      gradient.render({ time, mouseX: smoothX, mouseY: 1 - smoothY, hover, clickX, clickY: 1 - clickY, pulse });
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
    };
    const visibility = () => (document.hidden ? stop() : start());
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    });
    const resizeObserver = new ResizeObserver(() => {
      gradient.resize(cardNode.clientWidth, cardNode.clientHeight);
      if (reduced || !frame) render(0);
    });

    gradient.resize(cardNode.clientWidth, cardNode.clientHeight);
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
      gradient.dispose();
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
        <div className="site-footer-legal">
          <span>© 2026 {site.name}</span>
          <span>Design · Illustration · Motion · 3D</span>
        </div>
      </div>
    </footer>
  );
}
