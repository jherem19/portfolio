"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function SiteCursor() {
  const pathname = usePathname();
  const layerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
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

    const setVisible = (visible: boolean) => {
      visibleRef.current = visible;
      layer.classList.toggle("is-visible", visible);
    };

    const updatePointer = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType !== "mouse") {
        return;
      }

      // Match the pointer directly; easing made the cursor feel delayed.
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      if (!visibleRef.current) setVisible(true);

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
    finePointer.addEventListener("change", updateEnabled);
    reducedMotion.addEventListener("change", updateEnabled);
    document.addEventListener("pointermove", updatePointer);
    document.addEventListener("pointerdown", press);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    document.documentElement.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
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
      <span ref={dotRef} className="site-cursor-dot">
        {/* Glass arrow: iridescent rim, deep fill and a thin inner highlight. The tip sits at the top-left hotspot. */}
        <svg viewBox="0 0 40 40" fill="none">
          <defs>
            <linearGradient id="cursor-rim" x1="4" y1="4" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0" className="cursor-rim-a" />
              <stop offset=".35" className="cursor-rim-b" />
              <stop offset=".62" className="cursor-rim-c" />
              <stop offset=".82" className="cursor-rim-d" />
              <stop offset="1" className="cursor-rim-e" />
            </linearGradient>
            <linearGradient id="cursor-fill" x1="6" y1="8" x2="30" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0" className="cursor-fill-a" />
              <stop offset=".5" className="cursor-fill-b" />
              <stop offset="1" className="cursor-fill-c" />
            </linearGradient>
          </defs>
          <path d="M5.2 4.4 32.6 14.9c2.2.9 2.2 3 .1 3.9l-9.6 4.1-4.1 9.6c-.9 2.1-3 2.1-3.9-.1Z" fill="url(#cursor-fill)" stroke="url(#cursor-rim)" strokeLinejoin="round" strokeWidth="3.4" />
          <path d="M9.6 9.4 28 16.6l-7 3-3 7Z" className="cursor-shine" strokeLinejoin="round" strokeWidth=".9" />
        </svg>
      </span>
    </div>
  );
}
