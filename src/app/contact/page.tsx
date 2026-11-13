import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock3, Mail, MessagesSquare } from "lucide-react";

import { SiteSidebar } from "@/components/site-sidebar";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Discuss a Project",
  description:
    "Talk directly with Hector Heredia about a product launch, redesign, ongoing creative support, or a custom freelance design engagement.",
  alternates: { canonical: `${site.url}/contact` },
};

const inquiries = [
  {
    label: "Defined project",
    title: "I have a project to launch",
    description: "Share the product, desired outcome, approximate timeline, and the parts that already exist.",
    href: "mailto:hectorheredia19@gmail.com?subject=Defined%20freelance%20project&body=Hi%20Hector%2C%0A%0AI%27d%20like%20to%20discuss%20a%20project.%0A%0AProduct%20or%20business%3A%0AGoal%3A%0AWhat%20I%20need%3A%0ATimeline%3A%0ABudget%20range%3A%0A%0AThanks%2C",
  },
  {
    label: "Ongoing support",
    title: "I need ongoing creative support",
    description: "Useful for recurring website improvements, launches, ads, product videos, motion, and graphic assets.",
    href: "mailto:hectorheredia19@gmail.com?subject=Ongoing%20creative%20support&body=Hi%20Hector%2C%0A%0AI%27d%20like%20to%20discuss%20ongoing%20creative%20support.%0A%0AProduct%20or%20business%3A%0ACurrent%20needs%3A%0AExpected%20monthly%20workload%3A%0APreferred%20start%20date%3A%0A%0AThanks%2C",
  },
  {
    label: "Custom or hourly",
    title: "I need a custom setup",
    description: "Describe what you need. We can define a custom scope, an hourly arrangement, or a smaller first phase together.",
    href: "mailto:hectorheredia19@gmail.com?subject=Custom%20freelance%20collaboration&body=Hi%20Hector%2C%0A%0AI%20have%20a%20project%20that%20needs%20a%20custom%20approach.%0A%0AWhat%20I%27m%20building%3A%0AWhat%20I%20need%20help%20with%3A%0APreferred%20working%20model%3A%0ATimeline%3A%0A%0AThanks%2C",
  },
] as const;

export default function ContactPage() {
  return (
    <main className="site-shell contact-shell">
      <SiteSidebar active="contact" />
      <article className="page-content inquiry-page">
        <header className="inquiry-hero">
          <Link className="back-link" href="/"><ArrowLeft aria-hidden="true" /> Back to portfolio</Link>
          <p className="section-kicker">Start a conversation</p>
          <h1>Let&apos;s talk about your project.</h1>
          <div className="inquiry-intro">
            <p>You do not need to choose a predefined service. If there is a real product, business, or idea behind the work, we can evaluate the project and shape the right engagement together.</p>
            <div className="inquiry-availability"><span aria-hidden="true" /> Available for select freelance projects</div>
          </div>
        </header>

        <section className="inquiry-options" aria-labelledby="inquiry-options-title">
          <div className="inquiry-options-heading">
            <p className="section-kicker">Choose the closest starting point</p>
            <h2 id="inquiry-options-title">Start with what you know.</h2>
          </div>
          <div className="inquiry-grid">
            {inquiries.map((inquiry) => (
              <a href={inquiry.href} key={inquiry.label}>
                <p>{inquiry.label}</p>
                <h3>{inquiry.title}</h3>
                <span>{inquiry.description}</span>
                <strong>Open email draft <ArrowUpRight aria-hidden="true" /></strong>
              </a>
            ))}
          </div>
          <p className="inquiry-email-note">These buttons open your email app with a few useful prompts. Nothing is submitted automatically.</p>
        </section>

        <section className="inquiry-direct" aria-labelledby="direct-contact-title">
          <div>
            <p className="section-kicker">Prefer to keep it simple?</p>
            <h2 id="direct-contact-title">Write to me directly.</h2>
          </div>
          <div className="inquiry-direct-copy">
            <a href="mailto:hectorheredia19@gmail.com"><Mail aria-hidden="true" /> hectorheredia19@gmail.com</a>
            <p><MessagesSquare aria-hidden="true" /> If you prefer a call, mention your timezone and a few available times in the email.</p>
            <p><Clock3 aria-hidden="true" /> Based in Chile · UTC−3 · Working remotely worldwide.</p>
          </div>
        </section>
      </article>
    </main>
  );
}
