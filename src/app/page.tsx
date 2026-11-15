import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Download, Mail } from "lucide-react";

import { FeaturedShowcase } from "@/components/featured-showcase";
import { AmbientDots } from "@/components/ambient-dots";
import { CountUp, RollText, ScrollWords } from "@/components/motion";
import { HeroMotionBackground } from "@/components/hero-motion-background";
import { LanyardBadge } from "@/components/lanyard-badge";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { SocialLinks } from "@/components/social-links";
import { getPublishedProjects } from "@/lib/cms/projects";
import { services } from "@/data/site";

export const revalidate = 60;

export default async function Home() {
  const projects = await getPublishedProjects();
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 6);
  return (
    <main className="site-shell portfolio-home">
      <SiteSidebar horizontal />
      <div className="page-content">
        <section className="intro-section" id="home">
          <HeroMotionBackground />
          <div className="hero-dashboard">
            <div className="intro-copy hero-profile-panel">
              <p className="hero-handle">@JHEREM</p>
              <div className="hero-profile-copy">
                <p className="hero-availability"><span aria-hidden="true" /> Available for select projects</p>
                <h1><span className="hero-line">I design products</span><span className="hero-line"><em>people remember.</em></span></h1>
                <p className="intro-lede">I partner directly with founders and product owners across product UI, websites, visual identity, motion, ads, and interactive 3D—from one focused build to ongoing support.</p>
              </div>
              <div className="hero-profile-footer">
                <ul className="hero-profile-proof" aria-label="Working details">
                  <li><strong><CountUp delay={700} to={10} /> years</strong><span>design experience</span></li>
                  <li><strong>1–<CountUp delay={850} to={6} /> weeks</strong><span>focused engagements</span></li>
                  <li><strong>UTC−3</strong><span>remote worldwide</span></li>
                </ul>
                <div className="intro-actions">
                  <Link className="hero-cta hero-cta-primary" href="/contact"><Mail aria-hidden="true" /> <RollText text="Discuss a project" /></Link>
                  <a className="hero-cta" href="#services"><RollText text="Explore services" /> <ArrowRight aria-hidden="true" /></a>
                </div>
              </div>
            </div>

            <div className="hero-lanyard-panel">
              <AmbientDots className="hero-lanyard-dots" />
              <LanyardBadge />
              <p className="hero-lanyard-caption"><span aria-hidden="true" /> Interactive ID · drag and release</p>
            </div>

            <aside className="hero-side-panel" aria-label="Availability and selected work">
              <div className="hero-connect-panel">
                <div>
                  <span>Based in</span>
                  <strong>Santiago, Chile · UTC−3</strong>
                  <p>Working remotely worldwide</p>
                </div>
                <SocialLinks compact />
              </div>
              <div className="hero-latest-panel">
                <header><h2>Selected work</h2><Link href="/work" aria-label="See all work"><ArrowUpRight aria-hidden="true" /></Link></header>
                <ul>
                  {featuredProjects.slice(0, 3).map((project) => (
                    <li key={project.slug}>
                      <Link href={`/work/${project.slug}`}>
                        <span className="hero-project-thumb"><Image src={project.cover_image} alt="" fill sizes="46px" style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }} /></span>
                        <span><strong>{project.title}</strong><small>{project.category}</small></span>
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <header className="services-heading">
            <div>
              <p className="section-kicker">Ways to work together</p>
              <h2 id="services-title">Three ways I can help.</h2>
            </div>
            <p>Choose the outcome closest to what your product needs now.</p>
          </header>

          <div className="services-list">
            {services.map((service) => (
              <article className="service-brief" key={service.title}>
                <div className="service-brief-title">
                  <p>{service.format}</p>
                  <h3>{service.title}</h3>
                </div>
                <p className="service-description">{service.summary}</p>
                <Link className="service-brief-link" href="/services">See engagement details <ArrowRight aria-hidden="true" /></Link>
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

        <section className="featured-section featured-showcase" id="work" aria-labelledby="work-title">
          <div className="showcase-layout">
            <div className="showcase-copy">
              <h2 id="work-title">Featured work.<br />Built to ship.</h2>
              <p>Product interfaces, websites, visual systems, motion, and interactive 3D made for launches, releases, and evolving products.</p>
              <div className="showcase-actions">
                <Link className="hero-cta hero-cta-primary" href="/work"><RollText text="See all work" /></Link>
                <Link className="hero-cta" href="/contact"><RollText text="Start a project" /></Link>
              </div>
            </div>
            <FeaturedShowcase projects={featuredProjects} />
          </div>
          <nav className="portfolio-paths" aria-label="More work">
            <Link href="/3d"><span>Dimensional work</span><strong>Explore the 3D archive</strong><ArrowUpRight aria-hidden="true" /></Link>
            <Link href="/experiments"><span>Personal practice</span><strong>Browse experiments</strong><ArrowUpRight aria-hidden="true" /></Link>
          </nav>
        </section>

        <section className="about-panel" id="about" aria-labelledby="about-title">
          <p className="section-kicker">About</p>
          <div className="about-layout">
            <h2 id="about-title">A senior design partner, end to end.</h2>
            <figure className="about-portrait">
              <Image
                src="/hector-heredia-about.png"
                alt="Hector Heredia, Senior Product and Motion Designer"
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1050px) 38vw, 24vw"
              />
            </figure>
            <div className="about-text">
              <ScrollWords text="I'm Hector Heredia, a freelance Senior Product & Motion Designer based in Chile and working remotely worldwide." />
              <ScrollWords text="Across 10 years of experience, I've worked directly with founders and product owners to connect product thinking, web design, visual identity, motion, and real-time 3D in one coherent experience." />
              <div className="about-links">
                <a href="https://www.linkedin.com/in/3d-visual-designer-jherem/" target="_blank" rel="noreferrer">View my experience <ArrowUpRight aria-hidden="true" /></a>
                <a href="/hector-heredia-resume.pdf" download="Hector-Heredia-Resume.pdf">Download resume <Download aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-panel" id="contact">
          <AmbientDots className="contact-dot-field" />
          <div className="contact-panel-grid">
            <div>
              <p className="section-kicker">Have a product that needs its next move?</p>
              <h2>Let&apos;s build what&apos;s next.</h2>
            </div>
            <div className="contact-panel-copy">
              <p>Share what you&apos;re building, what needs to change, and where you want to take it. I&apos;ll help you shape the right design engagement.</p>
              <div className="contact-panel-actions">
                <Link className="hero-cta hero-cta-primary" href="/contact"><Mail aria-hidden="true" /> <RollText text="Start a project" /></Link>
                <a className="hero-cta" href="mailto:hectorheredia19@gmail.com"><RollText text="Email me directly" /> <ArrowUpRight aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
