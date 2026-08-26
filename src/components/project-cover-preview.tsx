"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, type PointerEvent, useRef, useState } from "react";

import type { ProjectSummary } from "@/types/cms";

const COVER_SIZES = "(max-width: 760px) calc(100vw - 40px), (max-width: 1050px) calc((100vw - 346px) / 2), calc((100vw - 300px - 14vw - 28px) / 2)";

export function ProjectCoverPreview({ project }: { project: ProjectSummary }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pointerIsInside = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const coverStyle = {
    "--cover-scale": project.cover_zoom / 100,
    objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%`,
  } as CSSProperties;

  const stopPreview = () => {
    pointerIsInside.current = false;
    setIsPlaying(false);

    const video = videoRef.current;
    if (!video) return;

    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
  };

  const startPreview = async (event: PointerEvent<HTMLDivElement>) => {
    if (!project.cover_video || event.pointerType !== "mouse") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const video = videoRef.current;
    if (!video) return;

    pointerIsInside.current = true;

    if (!video.getAttribute("src")) {
      video.src = project.cover_video;
      video.load();
    }

    try {
      await video.play();
      if (pointerIsInside.current) {
        setIsPlaying(true);
      } else {
        video.pause();
        if (video.readyState > 0) video.currentTime = 0;
      }
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={`work-image${isPlaying ? " is-preview-playing" : ""}`}
      onPointerCancel={stopPreview}
      onPointerEnter={startPreview}
      onPointerLeave={stopPreview}
    >
      <Image
        src={project.cover_image}
        alt={`${project.title} project cover`}
        fill
        quality={60}
        sizes={COVER_SIZES}
        style={coverStyle}
      />
      {project.cover_video ? (
        <video
          ref={videoRef}
          aria-hidden="true"
          className="work-preview-video"
          loop
          muted
          playsInline
          preload="none"
          style={coverStyle}
          tabIndex={-1}
          onError={() => setIsPlaying(false)}
          onPlaying={() => pointerIsInside.current && setIsPlaying(true)}
        />
      ) : null}
      <span className="work-open"><ArrowUpRight aria-hidden="true" /></span>
    </div>
  );
}
