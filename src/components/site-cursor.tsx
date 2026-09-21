"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const FOLLOW_EASE = 0.2;

type Point = { x: number; y: number };

export function SiteCursor() {
  const pathname = usePathname();
  const layerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const visibleRef = useRef(false);
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const layer = layerRef.current;
    const dot = dotRef.current;
    if (!layer || !dot || isAdmin) return;

    const finePointer = window.matchMedia(
      "(min-width: 761px) and (hover: hover) and (pointer: fine)",
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const renderFrame = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * FOLLOW_EASE;
      current.y += (target.y - current.y) * FOLLOW_EASE;
      dot.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      frameRef.current = requestAnimationFrame(renderFrame);
    };

    const setVisible = (visible: boolean) => {
      visibleRef.current = visible;
      layer.classList.toggle("is-visible", visible);
    };

    const updatePointer = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType !== "mouse") {
        return;
      }

      const next = { x: event.clientX, y: event.clientY };
      targetRef.current = next;
      if (!visibleRef.current) {
        currentRef.current = next;
        setVisible(true);
      }

      const target = event.target as Element | null;
      layer.classList.toggle(
        "is-interactive",
        Boolean(target?.closest("a, button, summary, [role='button']")),
      );
    };

    const press = () => layer.classList.add("is-pressed");
    const release = () => layer.classList.remove("is-pressed");
    const hide = () => {
      setVisible(false);
      layer.classList.remove("is-interactive", "is-pressed");
    };
    const updateEnabled = () => {
      const enabled = finePointer.matches && !reducedMotion.matches;
      document.body.classList.toggle("has-custom-cursor", enabled);
      if (!enabled) hide();
    };

    updateEnabled();
    frameRef.current = requestAnimationFrame(renderFrame);
    finePointer.addEventListener("change", updateEnabled);
    reducedMotion.addEventListener("change", updateEnabled);
    document.addEventListener("pointermove", updatePointer);
    document.addEventListener("pointerdown", press);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      cancelAnimationFrame(frameRef.current);
      finePointer.removeEventListener("change", updateEnabled);
      reducedMotion.removeEventListener("change", updateEnabled);
      document.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      document.documentElement.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      document.body.classList.remove("has-custom-cursor");
    };
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <div ref={layerRef} className="site-cursor" aria-hidden="true">
      <span ref={dotRef} className="site-cursor-dot" />
    </div>
  );
}
