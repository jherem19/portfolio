/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation avoids hydrating the static public sidebar. */
import { BriefcaseBusiness, Home, Mail, UserRound } from "lucide-react";

export function SiteSidebar({ active = "home" }: { active?: "home" | "work" }) {
  const items = [
    { label: "Home", href: "/", icon: Home, key: "home" },
    { label: "Work", href: "/#work", icon: BriefcaseBusiness, key: "work" },
    { label: "About", href: "/#about", icon: UserRound, key: "about" },
    { label: "Contact", href: "mailto:hectorheredia19@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio", icon: Mail, key: "contact" },
  ];

  return (
    <aside className="sidebar">
      <a className="sidebar-brand" href="/">
        <strong>Hector Heredia</strong>
        <span>Product &amp; Motion Designer</span>
      </a>
      <nav aria-label="Primary navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a aria-label={item.label} className={item.key === active ? "sidebar-link is-active" : "sidebar-link"} href={item.href} key={item.key}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <p className="sidebar-foot">Based in Chile · Working worldwide</p>
    </aside>
  );
}
