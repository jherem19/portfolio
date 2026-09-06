"use client";

import { useEffect, useRef, useState } from "react";
import { Box, BriefcaseBusiness, Home, Mail, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";

type NavigationKey = "home" | "work" | "3d" | "about" | "contact";

export function SiteSidebar({ active = "home" }: { active?: NavigationKey }) {
  const [current, setCurrent] = useState<NavigationKey>(active);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const items = [
    { label: "Home", href: "/", icon: Home, key: "home" },
    { label: "Work", href: "/#work", icon: BriefcaseBusiness, key: "work" },
    { label: "3D", href: "/3d", icon: Box, key: "3d" },
    { label: "About", href: "/#about", icon: UserRound, key: "about" },
    { label: "Contact", href: "/#contact", icon: Mail, key: "contact" },
  ] as const;

  useEffect(() => {
    if (window.location.pathname !== "/") {
      return;
    }

    const sectionKeys: NavigationKey[] = ["home", "work", "about", "contact"];
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
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!sidebarRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [menuOpen]);

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <Link className="sidebar-brand" href="/" onClick={() => setMenuOpen(false)}>
        <strong>Hector Heredia</strong>
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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <p className="sidebar-foot">Based in Chile · Working worldwide</p>
    </aside>
  );
}
