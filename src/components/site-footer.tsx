import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { RollText } from "@/components/motion";
import { SocialLinks } from "@/components/social-links";
import { site } from "@/data/site";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-card">
        <section className="site-footer-invite" aria-labelledby="footer-title">
          <div>
            <p className="site-footer-kicker"><i aria-hidden="true" /> Available for select projects</p>
            <h2 id="footer-title">Let&apos;s build what&apos;s next.</h2>
          </div>
          <div className="site-footer-invite-copy">
            <p>Bring me the product, launch, or visual challenge you want to move forward.</p>
            <Link className="site-footer-cta" href="/contact">
              <Mail aria-hidden="true" />
              <RollText text="Start a project" />
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <div className="site-footer-directory">
          <div className="site-footer-brand">
            <strong>@JHEREM</strong>
            <p>Senior Product &amp; Motion Designer<br />Santiago, Chile · working worldwide</p>
          </div>

          <nav aria-label="Footer navigation">
            <span>Explore</span>
            {LINKS.map((link) => (
              <Link href={link.href} key={link.href}><RollText text={link.label} /></Link>
            ))}
          </nav>

          <div className="site-footer-contact">
            <span>Get in touch</span>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <SocialLinks compact />
          </div>
        </div>

        <div className="site-footer-legal">
          <span>© 2026 {site.name}</span>
          <span>Design · Product · Motion · 3D</span>
        </div>
      </div>
    </footer>
  );
}
