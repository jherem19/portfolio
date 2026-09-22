"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

const BadgeScene = dynamic(() => import("./lanyard-scene"), { ssr: false });

class BadgeBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function LanyardBadge() {
  const host = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [impulse, setImpulse] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 761px)");
    const update = () => { setEnabled(desktop.matches && !media.matches); setReady(false); };
    update();
    media.addEventListener("change", update);
    desktop.addEventListener("change", update);
    let visible = true;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (host.current) observer.observe(host.current);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); desktop.removeEventListener("change", update); media.removeEventListener("change", update); document.removeEventListener("visibilitychange", sync); };
  }, []);

  return (
    <div ref={host} className="lanyard-stage" aria-label="Hector Heredia’s interactive designer badge">
      <div className="lanyard-fallback" aria-hidden={ready && enabled}>
        <div className="lanyard-static-strap" />
        <Image src="/id-card.png" width={1107} height={1592} priority alt="Hector Heredia, senior designer and motion designer, based in Chile."
          className="lanyard-static-card" sizes="(max-width: 760px) 260px, 28vw" />
      </div>
      {enabled && <BadgeBoundary onError={() => { setEnabled(false); setReady(false); }}><BadgeScene active={active} impulse={impulse} onReady={() => setReady(true)} onUnavailable={() => { setEnabled(false); setReady(false); }} /></BadgeBoundary>}
      {enabled && ready && <button type="button" className="lanyard-hint" onClick={() => setImpulse((n) => n + 1)} aria-label="Swing the badge. You can also drag and release it.">Drag &amp; release <span aria-hidden="true">↗</span></button>}
    </div>
  );
}
