import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Download, Mail } from "lucide-react";

import { FeaturedProjects } from "@/components/featured-projects";
import { LanyardBadge } from "@/components/lanyard-badge";
import { HeroMotionBackground } from "@/components/hero-motion-background";
import { SiteSidebar } from "@/components/site-sidebar";
import { SideProjects } from "@/components/side-projects";
import { SocialLinks } from "@/components/social-links";
import { getPublishedProjects } from "@/lib/cms/projects";
import { getSideProjects } from "@/lib/cms/side-projects";
import { ThreeDShowcase } from "@/components/three-d-showcase";
import { services } from "@/data/site";

export const revalidate = 60;

export default async function Home() {
  const [projects, sideProjects] = await Promise.all([
    getPublishedProjects(),
    getSideProjects(),
  ]);
  const featuredProjects = projects.filter((project) => project.featured);
  const threeDProjects = projects.filter((project) => project.show_in_3d_archive);
  return (
    <main className="site-shell portfolio-home">
      <SiteSidebar horizontal />
      <div className="page-content">
        <section className="intro-section" id="home">
          <HeroMotionBackground />
          <div className="mobile-hero-profile">
            <Image src="/profile.png" alt="Hector Heredia" width={112} height={112} sizes="72px" />
            <div><strong>Hector Heredia</strong><span>Freelance Product, Motion &amp; 3D Designer</span></div>
          </div>
          <div className="intro-copy">
            <p className="hero-availability"><span aria-hidden="true" /> Available for select freelance projects</p>
            <h1>I design products<br /><em>people remember.</em></h1>
            <p className="intro-lede">I partner directly with founders and product owners across product UI, websites, visual identity, motion, ads, and interactive 3D—from one focused build to ongoing support.</p>
            <div className="intro-actions">
              <Link className="hero-cta hero-cta-primary" href="/contact"><Mail aria-hidden="true" /> Discuss a project</Link>
              <a className="hero-cta" href="#services">Explore services <ArrowRight aria-hidden="true" /></a>
            </div>
            <ul className="hero-proof" aria-label="Working details">
              <li><strong>10 years</strong><span>design experience</span></li>
              <li><strong>1–6 weeks</strong><span>focused engagements</span></li>
              <li><strong>UTC−3</strong><span>remote worldwide</span></li>
            </ul>
          </div>
          <LanyardBadge />
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <header className="services-heading">
            <div>
              <p className="section-kicker">Ways to work together</p>
              <h2 id="services-title">From launch to what comes next.</h2>
            </div>
            <p>I work best with people responsible for a real product and a concrete outcome: launch it, improve it, or give it a stronger visual world.</p>
          </header>

          <div className="services-list">
            {services.map((service) => (
              <article className="service-brief" key={service.title}>
                <div className="service-brief-title">
                  <p>{service.format}</p>
                  <h3>{service.title}</h3>
                </div>
                <p className="service-description">{service.description}</p>
                <ul aria-label={`${service.title} deliverables`}>
                  {service.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}
                </ul>
                <dl>
                  <div><dt>Typical timing</dt><dd>{service.timeline}</dd></div>
                  <div><dt>Investment</dt><dd>{service.investment}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <aside className="agency-callout direct-callout">
            <div>
              <p className="section-kicker">Already have a roadmap?</p>
              <h3>One creative partner. Every next release.</h3>
            </div>
            <div className="agency-callout-copy">
              <p>I can support redesigns, new pages, product releases, launch videos, ads, graphic assets, motion, and 3D without restarting the relationship for every deliverable.</p>
              <Link href="/services">See how projects work <ArrowUpRight aria-hidden="true" /></Link>
            </div>
          </aside>
        </section>

        <section className="featured-section" id="work" aria-labelledby="work-title">
          <header className="content-heading">
            <div><p className="section-kicker">Selected projects</p><h2 id="work-title">Featured Work</h2></div>
            <span>{featuredProjects.length} projects · 2022—2026</span>
          </header>
          <FeaturedProjects projects={featuredProjects} />
          <ThreeDShowcase projects={threeDProjects} />
        </section>

        <SideProjects projects={sideProjects} />

        <section className="about-panel" id="about" aria-labelledby="about-title">
          <p className="section-kicker">About</p>
          <div className="about-layout">
            <h2 id="about-title">A senior design partner, end to end.</h2>
            <div className="about-text">
              <p>I&apos;m Hector Heredia, a freelance Senior Product &amp; Motion Designer based in Chile and working remotely worldwide.</p>
              <p>Across 10 years of experience, I&apos;ve worked directly with founders and product owners to connect product thinking, web design, visual identity, motion, and real-time 3D in one coherent experience.</p>
              <div className="about-links">
                <a href="https://www.linkedin.com/in/3d-visual-designer-jherem/" target="_blank" rel="noreferrer">View my experience <ArrowUpRight aria-hidden="true" /></a>
                <a href="/hector-heredia-resume.pdf" download="Hector-Heredia-Resume.pdf">Download resume <Download aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <footer className="contact-panel" id="contact">
          <p className="section-kicker">Have a launch or project in mind?</p>
          <Link href="/contact">Tell me what you&apos;re building <Mail aria-hidden="true" /></Link>
          <div className="contact-bottom"><span>Hector Heredia © 2026</span><SocialLinks compact /></div>
        </footer>
      </div>
    </main>
  );
}
