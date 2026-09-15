"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  Box,
  Boxes,
  Frame,
  Layers3,
  Orbit,
  PenTool,
} from "lucide-react";

const TRAIL_SIZE = 48;
const TRAIL_SPACING = 56;
const TRAIL_DURATION = 1800;
const MAX_TRAIL_ICONS = 18;

const trailIcons = [
  { icon: Frame, color: "#7357ff" },
  { icon: Box, color: "#ff6b54" },
  { icon: PenTool, color: "#159f70" },
  { icon: Layers3, color: "#f0a52b" },
  { icon: Orbit, color: "#2387e8" },
  { icon: Boxes, color: "#cf4f9d" },
] as const;

type Point = { x: number; y: number };

export function HeroCursorTrail() {
  const layerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const nextIconRef = useRef(0);
  const generationRef = useRef(0);
  const lastPointRef = useRef<Point | null>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const enabledRef = useRef(false);

  const showIcon = useCallback((point: Point) => {
    const icon = iconRefs.current[nextIconRef.current];
    if (!icon) return;

    nextIconRef.current = (nextIconRef.current + 1) % MAX_TRAIL_ICONS;
    generationRef.current += 1;
    const generation = String(generationRef.current);

    icon.dataset.generation = generation;
    icon.style.left = `${point.x}px`;
    icon.style.top = `${point.y}px`;
    icon.style.visibility = "visible";
    icon.style.zIndex = String(generationRef.current);
    icon.getAnimations().forEach((animation) => animation.cancel());

    const animation = icon.animate(
      [
        {
          opacity: 0,
          transform:
            "translate(-50%, -50%) translateY(10px) scale(.3, .5) rotate(-16deg)",
          offset: 0,
          easing: "cubic-bezier(.16, 1, .3, 1)",
        },
        {
          opacity: 1,
          transform: "translate(-50%, -50%) translateY(-3px) scale(1.2, 1.12) rotate(7deg)",
          offset: 0.1,
          easing: "ease-in-out",
        },
        {
          opacity: 1,
          transform: "translate(-50%, -50%) translateY(2px) scale(.92, .96) rotate(-4deg)",
          offset: 0.18,
          easing: "ease-in-out",
        },
        {
          opacity: 1,
          transform: "translate(-50%, -50%) scale(1.04, 1.02) rotate(2deg)",
          offset: 0.26,
          easing: "ease-in-out",
        },
        {
          opacity: 1,
          transform: "translate(-50%, -50%) scale(1) rotate(0deg)",
          offset: 0.34,
        },
        {
          opacity: 1,
          transform: "translate(-50%, -50%) scale(1) rotate(0deg)",
          offset: 0.72,
          easing: "cubic-bezier(.4, 0, .6, 1)",
        },
        {
          opacity: 0,
          transform:
            "translate(-50%, -50%) translateY(-16px) scale(.45) rotate(10deg)",
          offset: 1,
        },
      ],
      {
        duration: TRAIL_DURATION,
        easing: "linear",
      },
    );

    animation.onfinish = () => {
      if (icon.dataset.generation === generation) {
        icon.style.visibility = "hidden";
      }
    };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!enabledRef.current || event.pointerType !== "mouse") return;

    const layer = layerRef.current;
    if (!layer) return;

    const bounds = boundsRef.current ?? layer.getBoundingClientRect();
    boundsRef.current = bounds;
    const point = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    const lastPoint = lastPointRef.current;

    if (!lastPoint) {
      lastPointRef.current = point;
      showIcon(point);
      return;
    }

    const deltaX = point.x - lastPoint.x;
    const deltaY = point.y - lastPoint.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < TRAIL_SPACING) return;

    const steps = Math.min(Math.floor(distance / TRAIL_SPACING), 3);
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;

    for (let step = 1; step <= steps; step += 1) {
      showIcon({
        x: lastPoint.x + unitX * TRAIL_SPACING * step,
        y: lastPoint.y + unitY * TRAIL_SPACING * step,
      });
    }

    lastPointRef.current =
      steps === 3 && distance > TRAIL_SPACING * 4
        ? point
        : {
            x: lastPoint.x + unitX * TRAIL_SPACING * steps,
            y: lastPoint.y + unitY * TRAIL_SPACING * steps,
          };
  }, [showIcon]);

  useEffect(() => {
    const layer = layerRef.current;
    const hero = layer?.parentElement;
    if (!layer || !hero) return;

    const finePointer = window.matchMedia(
      "(min-width: 761px) and (hover: hover) and (pointer: fine)",
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resetPosition = () => {
      lastPointRef.current = null;
      boundsRef.current = null;
    };
    const hideTrail = () => {
      resetPosition();
      iconRefs.current.forEach((icon) => {
        icon?.getAnimations().forEach((animation) => animation.cancel());
        if (icon) icon.style.visibility = "hidden";
      });
    };
    const updateEnabled = () => {
      enabledRef.current = finePointer.matches && !reducedMotion.matches;
      if (!enabledRef.current) hideTrail();
    };

    updateEnabled();
    finePointer.addEventListener("change", updateEnabled);
    reducedMotion.addEventListener("change", updateEnabled);
    hero.addEventListener("pointermove", handlePointerMove);
    hero.addEventListener("pointerleave", resetPosition);
    window.addEventListener("resize", resetPosition);
    window.addEventListener("scroll", resetPosition, { passive: true });

    return () => {
      finePointer.removeEventListener("change", updateEnabled);
      reducedMotion.removeEventListener("change", updateEnabled);
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetPosition);
      window.removeEventListener("resize", resetPosition);
      window.removeEventListener("scroll", resetPosition);
      hideTrail();
    };
  }, [handlePointerMove]);

  return (
    <div
      ref={layerRef}
      className="hero-cursor-trail"
      aria-hidden="true"
      style={{ "--trail-size": `${TRAIL_SIZE}px` } as CSSProperties}
    >
      {Array.from({ length: MAX_TRAIL_ICONS }, (_, index) => {
        const trailIcon = trailIcons[index % trailIcons.length];
        const Icon = trailIcon.icon;

        return (
          <span
            ref={(element) => {
              iconRefs.current[index] = element;
            }}
            className="hero-cursor-trail-item"
            style={{ backgroundColor: trailIcon.color }}
            key={index}
          >
            <Icon aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}
