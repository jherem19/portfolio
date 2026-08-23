"use client";

import { useEffect, useRef } from "react";

export function HeroMotionBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const pause = () => video.pause();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) {
          void video.play().catch(() => undefined);
          return;
        }

        pause();
      },
      { threshold: 0.08 },
    );

    const handleVisibility = () => {
      if (document.hidden) pause();
    };

    observer.observe(video);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      pause();
    };
  }, []);

  return (
    <div className="hero-motion" aria-hidden="true">
      <video
        ref={videoRef}
        className="hero-motion-video"
        loop
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
      >
        <source src="/gliff-motion-background.webm" type="video/webm" />
      </video>
    </div>
  );
}
