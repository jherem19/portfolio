"use client";

import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, ChevronDown, Download, Menu, PanelsTopLeft, X } from "lucide-react";
import Link from "next/link";

import { RollText } from "@/components/motion";

type NavigationKey = "home" | "services" | "work" | "3d" | "resources" | "about" | "contact";

export function SiteSidebar({ active = "home", horizontal = false }: { active?: NavigationKey; horizontal?: boolean }) {
  const [current, setCurrent] = useState<NavigationKey>(active);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const workButtonRef = useRef<HTMLButtonElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const [lightTheme, setLightTheme] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLightTheme(document.documentElement.dataset.theme === "light"));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setLightTheme(next === "light");
  };
  const items = [
    { label: "Work", href: "/work", icon: BriefcaseBusiness, key: "work" },
    { label: "Services", href: "/services", icon: PanelsTopLeft, key: "services" },
    { label: "Resources", href: "/resources", icon: Download, key: "resources" },
  ] as const;

  useEffect(() => {
    if (window.location.pathname !== "/") {
      return;
    }

    const sectionKeys: NavigationKey[] = ["home", "services", "work", "contact"];
    let frame = 0;

    const updateCurrentSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = window.scrollY + window.innerHeight * 0.35;
        const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
        let next: NavigationKey = "home";

        for (const key of sectionKeys) {
          const section = document.getElementById(key);
          if (section && section.offsetTop <= marker) next = key;
        }

        setCurrent(atPageEnd ? "contact" : next);
      });
    };

    updateCurrentSection();
    window.addEventListener("scroll", updateCurrentSection, { passive: true });
    window.addEventListener("resize", updateCurrentSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateCurrentSection);
      window.removeEventListener("resize", updateCurrentSection);
    };
  }, [active]);

  useEffect(() => {
    if (!menuOpen && !workOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (workOpen) { setWorkOpen(false); workButtonRef.current?.focus(); }
        else { setMenuOpen(false); menuButtonRef.current?.focus(); }
      }
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!sidebarRef.current?.contains(event.target as Node)) setMenuOpen(false);
      if (!workRef.current?.contains(event.target as Node)) setWorkOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [menuOpen, workOpen]);

  return (
    <aside className={horizontal ? "sidebar sidebar-horizontal" : "sidebar"} ref={sidebarRef}>
      <Link className="sidebar-brand" href="/" onClick={() => setMenuOpen(false)}>
        <strong>{horizontal ? "@JHEREM" : "Hector Heredia"}</strong>
        <span>Product &amp; Motion Designer</span>
      </Link>
      <button
        aria-controls="primary-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        className="sidebar-menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        ref={menuButtonRef}
        type="button"
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav aria-label="Primary navigation" className={menuOpen ? "is-open" : undefined} id="primary-navigation">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.key === "work") return (
            <div className="nav-work-group" key={item.key} ref={workRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setWorkOpen(false); }}>
              <button className={`sidebar-link nav-work-trigger${current === "work" || current === "3d" ? " is-active" : ""}`} ref={workButtonRef} type="button" aria-expanded={workOpen} aria-controls="work-subnavigation" onClick={() => setWorkOpen(!workOpen)}>
                <Icon aria-hidden="true" /><RollText text="Work" /><ChevronDown className="nav-work-chevron" aria-hidden="true" />
              </button>
              <div className="nav-work-submenu" id="work-subnavigation" hidden={!workOpen}>
                <Link href="/work" onClick={() => { setWorkOpen(false); setMenuOpen(false); }}>All work</Link>
                <Link href="/3d" onClick={() => { setWorkOpen(false); setMenuOpen(false); }}>3D archive</Link>
                <Link href="/experiments" onClick={() => { setWorkOpen(false); setMenuOpen(false); }}>Experiments</Link>
              </div>
            </div>
          );
          return (
            <Link
              aria-current={item.key === current ? "page" : undefined}
              aria-label={item.label}
              className={item.key === current ? "sidebar-link is-active" : "sidebar-link"}
              href={item.href}
              key={item.key}
              onClick={() => setMenuOpen(false)}
            >
              <Icon aria-hidden="true" />
              <RollText text={item.label} />
            </Link>
          );
        })}
        {horizontal ? (
          <Link className="sidebar-cta sidebar-cta-menu" href="/contact" onClick={() => setMenuOpen(false)}>Start a project</Link>
        ) : null}
      </nav>
      {horizontal ? (
        <div className="sidebar-actions">
          <button
            aria-checked={lightTheme}
            aria-label="Light mode"
            className="theme-toggle"
            onClick={toggleTheme}
            role="switch"
            type="button"
          >
            <span aria-hidden="true" />
          </button>
          <Link className="sidebar-cta" href="/contact"><RollText text="Start a project" /></Link>
        </div>
      ) : null}
      <p className="sidebar-foot">Based in Chile · Working worldwide</p>
    </aside>
  );
}
