import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessagesSquare } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { SiteSidebar } from "@/components/site-sidebar";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Discuss a Project",
  description:
    "Talk directly with Hector Heredia about a product launch, redesign, ongoing creative support, or a custom freelance design engagement.",
  alternates: { canonical: `${site.url}/contact` },
};

export default function ContactPage() {
  return (
    <main className="site-shell contact-shell">
      <SiteSidebar active="contact" horizontal />
      <article className="page-content contact-page">
        <h1>Let&apos;s <em>connect</em></h1>
        <div className="contact-layout">
          <section className="contact-card" aria-labelledby="contact-form-title">
            <MessagesSquare aria-hidden="true" />
            <h2 id="contact-form-title">Start your project</h2>
            <p>Tell me what you&apos;re building and where you need help. We can shape the right engagement together.</p>
            <ContactForm email={site.email} />
          </section>
          <aside className="contact-card contact-details" aria-label="Contact details">
            <a href={`mailto:${site.email}`}><Mail aria-hidden="true" /><span>{site.email}</span></a>
            <p><Clock3 aria-hidden="true" /><span>UTC−3 · Replies within 1–2 business days</span></p>
            <p><MapPin aria-hidden="true" /><span>Chile · Working worldwide</span></p>
            <div className="inquiry-availability"><span aria-hidden="true" /> Available for select projects</div>
          </aside>
        </div>
      </article>
    </main>
  );
}
