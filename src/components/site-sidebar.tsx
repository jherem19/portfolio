"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Home, Mail, UserRound } from "lucide-react";
import Link from "next/link";

type NavigationKey = "home" | "work" | "about" | "contact";

export function SiteSidebar({ active = "home" }: { active?: "home" | "work" }) {
  const [current, setCurrent] = useState<NavigationKey>(active);
  const items = [
    { label: "Home", href: "/", icon: Home, key: "home" },
    { label: "Work", href: "/#work", icon: BriefcaseBusiness, key: "work" },
    { label: "About", href: "/#about", icon: UserRound, key: "about" },
    { label: "Contact", href: "/#contact", icon: Mail, key: "contact" },
  ] as const;

  useEffect(() => {
    if (window.location.pathname !== "/") return;

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

  return (
    <aside className="sidebar">
      <Link className="sidebar-brand" href="/">
        <strong>Hector Heredia</strong>
        <span>Product &amp; Motion Designer</span>
      </Link>
      <nav aria-label="Primary navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              aria-current={item.key === current ? "page" : undefined}
              aria-label={item.label}
              className={item.key === current ? "sidebar-link is-active" : "sidebar-link"}
              href={item.href}
              key={item.key}
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
