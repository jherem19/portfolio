"use client";

import dynamic from "next/dynamic";
import { Volume2, VolumeX } from "lucide-react";
import { Component, type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { playKeySound, unlockKeySound } from "./key-sound";
import type { DragState } from "./keycap-scene";

const KeycapScene = dynamic(() => import("./keycap-scene"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function KeycapCluster() {
  const host = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({ active: false, dx: 0, dy: 0, over: false });
  const last = useRef({ x: 0, y: 0 });
  const soundOn = useRef(true);
  const [available, setAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [still, setStill] = useState(false);
  const [sound, setSound] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let stored = true;
      try { stored = localStorage.getItem("key-sound") !== "off"; } catch {}
      soundOn.current = stored;
      setSound(stored);
      setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    });

    let visible = true;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (host.current) observer.observe(host.current);
    document.addEventListener("visibilitychange", sync);

    // Audio can only start after a real click, tap or key press anywhere on the page.
    const unlock = () => { if (unlockKeySound()) setUnlocked(true); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggleSound = () => {
    // The first click may be the one that unlocks audio; keep sound on in that case.
    const next = unlocked ? !sound : true;
    if (unlockKeySound()) setUnlocked(true);
    soundOn.current = next;
    setSound(next);
    try { localStorage.setItem("key-sound", next ? "on" : "off"); } catch {}
  };

  // Hands the accumulated drag to the render loop and clears it for the next frame.
  const takeDrag = (): DragState => {
    const snapshot = { ...drag.current };
    drag.current.dx = drag.current.dy = 0;
    return snapshot;
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current.active = true;
    drag.current.dx = drag.current.dy = 0;
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.dx += event.clientX - last.current.x;
    drag.current.dy += event.clientY - last.current.y;
    last.current = { x: event.clientX, y: event.clientY };
  };
  const pointerEnd = () => { drag.current.active = false; };

  if (!available) return null;

  return (
    <div className="keycap-stage" ref={host}>
      <div
        aria-hidden="true"
        className={ready ? "keycap-canvas is-ready" : "keycap-canvas"}
        onPointerCancel={pointerEnd}
        onPointerDown={pointerDown}
        onPointerEnter={() => { drag.current.over = true; }}
        onPointerLeave={() => { drag.current.over = false; }}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
      >
        <SceneBoundary onError={() => setAvailable(false)}>
          <KeycapScene
            active={active}
            onKey={(index, strong) => { if (soundOn.current) playKeySound(index, strong); }}
            onReady={() => setReady(true)}
            onUnavailable={() => setAvailable(false)}
            still={still}
            takeDrag={takeDrag}
          />
        </SceneBoundary>
      </div>
      <div className="keycap-controls">
        <span>Design · Illustration · Motion · 3D — hover the keys, drag to spin</span>
        <button aria-pressed={sound && unlocked} className="keycap-sound glow-label" onClick={toggleSound} type="button">
          {sound && unlocked ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          {!unlocked && sound ? "Enable sound" : sound ? "Sound on" : "Sound off"}
        </button>
      </div>
    </div>
  );
}
