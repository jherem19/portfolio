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
        {/* Rounded pointer, with its upper-left tip aligned to the mouse hotspot. */}
        <svg viewBox="0 0 40 40" fill="none" focusable="false">
          <path
            d="M7.2 4.7 34 12.9c3.1.9 3.2 4.2.3 5.5l-10.4 4.5-1.7 10.8c-.5 3.2-3.8 3.8-5.5 1.1L4.1 10.1C2.5 7.1 4.1 3.8 7.2 4.7Z"
            fill="#f5f5f5"
            stroke="#171717"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
