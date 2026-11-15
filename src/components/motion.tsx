"use client";

import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Label whose letters roll up and are replaced by a copy when the parent link or button is hovered. */
export function RollText({ text }: { text: string }) {
  return (
    <span className="roll">
      <span className="roll-sr">{text}</span>
      <span aria-hidden="true" className="roll-chars">
        {Array.from(text).map((char, index) => {
          const glyph = char === " " ? " " : char;
          return <span className="roll-char" data-char={glyph} key={index} style={{ "--i": index } as CSSProperties}>{glyph}</span>;
        })}
      </span>
    </span>
  );
}

/** Number that counts up from zero the first time it scrolls into view. */
export function CountUp({ to, delay = 0, duration = 1400 }: { to: number; delay?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion()) return;
    let frame = 0;
    let timer = 0;
    const start = requestAnimationFrame(() => setValue(0));
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timer = window.setTimeout(() => {
        const began = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - began) / duration);
          setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }, delay);
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => {
      cancelAnimationFrame(start);
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [to, delay, duration]);

  return <span className="count-up" ref={ref}>{value}</span>;
}

/** Paragraph whose words light up progressively as it travels up the viewport. */
export function ScrollWords({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const node = ref.current;
    if (!node || reducedMotion()) return;
    const spans = Array.from(node.children) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (viewport * 0.92 - rect.top) / (viewport * 0.45 + rect.height)));
      const head = progress * (spans.length + 6);
      spans.forEach((span, index) => {
        span.style.opacity = String(0.2 + 0.8 * Math.min(1, Math.max(0, (head - index) / 6)));
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <p className="scroll-words" ref={ref}>
      {words.map((word, index) => <span key={index}>{word}{index < words.length - 1 ? " " : ""}</span>)}
    </p>
  );
}

const REVEAL_SELECTOR = [
  ".section-kicker", ".services-heading h2", ".services-heading > p", ".service-brief", ".agency-callout", ".showcase-copy > *",
  ".portfolio-paths a", ".about-panel h2", ".about-portrait", ".about-links", ".contact-panel-grid h2", ".contact-panel-copy", ".work-card",
  ".agency-section-heading h2", ".agency-capability-grid article", ".agency-engagements article", ".agency-rhythm li",
  ".resource-card", ".side-project-card", ".three-d-card", ".contact-card",
].join(", ");

/** Fades section content up as it enters the viewport. Content already on screen at load is left alone. */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (reducedMotion()) return;
    const timers: number[] = [];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const node = entry.target as HTMLElement;
        observer.unobserve(node);
        node.dataset.reveal = "in";
        // Drop the attribute once the entrance is over so hover transitions and transforms work as authored.
        timers.push(window.setTimeout(() => { delete node.dataset.reveal; node.style.removeProperty("--reveal-delay"); }, 1400));
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    const frame = requestAnimationFrame(() => {
      const siblings = new Map<Element, number>();
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((node) => {
        if (node.dataset.reveal !== undefined || node.closest("#home")) return;
        if (node.getBoundingClientRect().top < window.innerHeight) return;
        const parent = node.parentElement ?? node;
        const order = siblings.get(parent) ?? 0;
        siblings.set(parent, order + 1);
        node.style.setProperty("--reveal-delay", `${Math.min(order, 4) * 80}ms`);
        node.dataset.reveal = "";
        observer.observe(node);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      observer.disconnect();
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => { delete node.dataset.reveal; });
    };
  }, [pathname]);

  return null;
}
