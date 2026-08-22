import Link from "next/link";
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
      <Link className="sidebar-brand" href="/">
        <strong>Hector Heredia</strong>
        <span>Product &amp; Motion Designer</span>
      </Link>
      <nav aria-label="Primary navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link aria-label={item.label} className={item.key === active ? "sidebar-link is-active" : "sidebar-link"} href={item.href} key={item.key}>
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
