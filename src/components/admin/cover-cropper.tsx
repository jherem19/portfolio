"use client";

import Image from "next/image";
import type { PointerEvent } from "react";

type CoverCropperProps = {
  image: string;
  onChange: (position: { x: number; y: number; zoom: number }) => void;
  x: number;
  y: number;
  zoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function CoverCropper({ image, onChange, x, y, zoom }: CoverCropperProps) {
  function reposition(event: PointerEvent<HTMLDivElement>) {
    if (event.type === "pointermove" && !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    onChange({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
      zoom,
    });
  }

  return (
    <div className="admin-cover-cropper">
      <div
        className="admin-cover-canvas"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); reposition(event); }}
        onPointerMove={reposition}
        onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
      >
        <Image alt="Project cover crop preview" draggable={false} fill sizes="700px" src={image} style={{ objectPosition: `${x}% ${y}%`, transform: `scale(${zoom / 100})` }} unoptimized />
        <span className="admin-cover-grid-lines" aria-hidden="true" />
        <span className="admin-cover-focus" aria-hidden="true" style={{ left: `${x}%`, top: `${y}%` }} />
        <p>Drag to reposition</p>
      </div>
      <div className="admin-cover-controls">
        <label><span>Horizontal <strong>{x}%</strong></span><input max="100" min="0" onChange={(event) => onChange({ x: Number(event.target.value), y, zoom })} type="range" value={x} /></label>
        <label><span>Vertical <strong>{y}%</strong></span><input max="100" min="0" onChange={(event) => onChange({ x, y: Number(event.target.value), zoom })} type="range" value={y} /></label>
        <label><span>Zoom <strong>{zoom}%</strong></span><input max="180" min="100" onChange={(event) => onChange({ x, y, zoom: Number(event.target.value) })} type="range" value={zoom} /></label>
      </div>
    </div>
  );
}
