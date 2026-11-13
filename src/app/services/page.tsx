import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Mail } from "lucide-react";

import { SiteSidebar } from "@/components/site-sidebar";
import { services, site } from "@/data/site";

export const metadata: Metadata = {
  title: "Freelance Design Services",
  description:
    "Direct product UI, website, brand, motion, advertising, and interactive 3D support for founders and product owners.",
  alternates: { canonical: `${site.url}/services` },
};

const needs = [
  "You have a product or service and need the complete experience designed for launch.",
  "Your existing product, website, or visual system needs a serious redesign.",
  "You release new features and offers that need videos, ads, pages, and graphic assets.",
  "Your idea needs UI, brand, motion, or interactive 3D to work as one coherent system.",
] as const;

const process = [
  ["Align", "We define the problem, audience, scope, timeline, and the decision-makers involved."],
  ["Direction", "I establish a focused visual route before expanding into full production."],
  ["Build", "We work through clear milestones and structured async reviews."],
  ["Deliver", "You receive organized source files, exports, and a practical handoff."],
] as const;

export default function ServicesPage() {
  return (
    <main className="site-shell agency-shell">
      <SiteSidebar active="services" />
      <article className="page-content agency-page">
        <header className="agency-hero">
          <Link className="back-link" href="/#services"><ArrowLeft aria-hidden="true" /> Back to portfolio</Link>
          <p className="section-kicker">Freelance design services</p>
          <h1>Design support built around your product.</h1>
          <div className="agency-hero-bottom">
            <p>I work directly with the person responsible for the product—founder, owner, or product lead—to take a concrete project from visual direction through production, launch, and continued growth.</p>
            <Link className="hero-cta hero-cta-primary" href="/contact"><Mail aria-hidden="true" /> Discuss a project</Link>
          </div>
          <dl className="agency-facts">
            <div><dt>Experience</dt><dd>10 years</dd></div>
            <div><dt>Location</dt><dd>Chile · UTC−3</dd></div>
            <div><dt>Collaboration</dt><dd>Remote · async-friendly</dd></div>
            <div><dt>Engagements</dt><dd>Focused projects · ongoing support</dd></div>
          </dl>
        </header>

        <section className="agency-section" aria-labelledby="project-fit">
          <div className="agency-section-heading">
            <p className="section-kicker">A good reason to talk</p>
            <h2 id="project-fit">Launch it. Improve it. Keep it moving.</h2>
          </div>
          <div className="agency-capability-grid">
            {needs.map((need) => (
              <article key={need}>
                <Check aria-hidden="true" />
                <p>{need}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="agency-section agency-terms" aria-labelledby="engagement-options">
          <div className="agency-section-heading">
            <p className="section-kicker">Engagement options</p>
            <h2 id="engagement-options">Choose how we work together.</h2>
          </div>
          <div className="agency-engagements service-page-engagements">
            {services.map((service) => (
              <article key={service.title}>
                <p>{service.format}</p>
                <h3>{service.title}</h3>
                <p className="engagement-description">{service.description}</p>
                <ul>{service.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}</ul>
                <dl>
                  <div><dt>Timing</dt><dd>{service.timeline}</dd></div>
                  <div><dt>Investment</dt><dd>{service.investment}</dd></div>
                </dl>
              </article>
            ))}
          </div>
          <aside className="custom-engagement-note">
            <div>
              <p className="section-kicker">Something different?</p>
              <h3>Need a different setup?</h3>
            </div>
            <p>The options above are useful starting points, not fixed packages. If your project needs a different mix of design, motion, 3D, or ongoing support, we can define the scope and working model together.</p>
          </aside>
        </section>

        <section className="agency-section agency-rhythm" aria-labelledby="working-process">
          <div className="agency-section-heading">
            <p className="section-kicker">Working process</p>
            <h2 id="working-process">A clear path from brief to delivery.</h2>
          </div>
          <ol>
            {process.map(([title, copy], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="agency-work" aria-labelledby="relevant-work">
          <div>
            <p className="section-kicker">Selected work</p>
            <h2 id="relevant-work">Product, motion, and 3D in practice.</h2>
          </div>
          <nav aria-label="Relevant case studies">
            <Link href="/work/seshy-ai-3d-music-studios"><span>Interactive 3D</span><strong>Seshy AI Studios</strong><ArrowRight aria-hidden="true" /></Link>
            <Link href="/work/interface-studies"><span>Product interface</span><strong>Mencial Dashboard</strong><ArrowRight aria-hidden="true" /></Link>
            <Link href="/work/security-made-clear"><span>Product motion</span><strong>Security, made clear</strong><ArrowRight aria-hidden="true" /></Link>
          </nav>
        </section>

        <footer className="agency-footer">
          <p className="section-kicker">Have a project in mind?</p>
          <Link href="/contact">Tell me what needs to launch <ArrowUpRight aria-hidden="true" /></Link>
          <p>Direct collaboration · Remote worldwide · English &amp; Spanish</p>
        </footer>
      </article>
    </main>
  );
}
