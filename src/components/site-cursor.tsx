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
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
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
      <span ref={dotRef} className="site-cursor-dot" />
    </div>
  );
}
