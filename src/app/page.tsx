import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Box, Clapperboard, Download, Mail, PenTool } from "lucide-react";

import { FeaturedShowcase } from "@/components/featured-showcase";
import { HeroProjectRotator } from "@/components/hero-project-rotator";
import { HomeCaseStudies } from "@/components/home-case-studies";
import { isCaseStudy, compareCaseStudies } from "@/lib/case-studies";
import { AmbientDots } from "@/components/ambient-dots";
import { CountUp, RollText, ScrollWords, Typewriter } from "@/components/motion";
import { LanyardBadge } from "@/components/lanyard-badge";
import { ScrollCue } from "@/components/scroll-cue";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedProjects } from "@/lib/cms/projects";

export const revalidate = 60;

export default async function Home() {
  const projects = await getPublishedProjects();
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 6);
  const rotatorSource = featuredProjects.length ? featuredProjects : projects.slice(0, 1);
  const rotatorProjects = rotatorSource.map(({ slug, title, cover_image, cover_position_x, cover_position_y }) => ({ slug, title, cover_image, cover_position_x, cover_position_y }));
  return (
    <main className="site-shell portfolio-home">
      <SiteSidebar horizontal />
      <div className="page-content">
        <section className="intro-section hero-bento-section" id="home">
          <div className="intro-copy hero-bento-top">
            <p className="hero-availability"><span aria-hidden="true" /> Available for select projects</p>
            <h1><span className="hero-line">I design products</span><span className="hero-line"><em><Typewriter text="people remember." /></em></span></h1>
            <p className="intro-lede">I partner directly with founders and product owners across product UI, websites, visual identity, motion, ads, and interactive 3D—from one focused build to ongoing support.</p>
            <div className="intro-actions">
              <Link className="hero-cta hero-cta-primary" href="/contact"><Mail aria-hidden="true" /> <RollText text="Discuss a project" /></Link>
              <a className="hero-cta" href="#services"><RollText text="Explore services" /> <ArrowRight aria-hidden="true" /></a>
            </div>
          </div>

          <ScrollCue />
          <div className="hero-bento">
            <article className="bento-card bento-disciplines">
              <div className="bento-icons" aria-hidden="true"><span><PenTool /></span><span><Clapperboard /></span><span><Box /></span></div>
              <div>
                <h2>Design, motion &amp; 3D</h2>
                <p>Product UI, websites, identity, motion and interactive 3D from one partner.</p>
              </div>
            </article>

            <article className="bento-card bento-stat">
              <strong><CountUp delay={500} to={10} />+</strong>
              <p>Years designing digital products with founders and product teams.</p>
            </article>

            <div className="hero-lanyard-panel bento-lanyard">
              <AmbientDots className="hero-lanyard-dots" />
              <LanyardBadge />
              <p className="hero-lanyard-caption"><span aria-hidden="true" /> Interactive ID · drag and release</p>
            </div>

            <article className="bento-card bento-accent">
              <strong>1–<CountUp delay={650} to={6} /> wk</strong>
              <p>Typical length of a focused engagement, from brief to delivery.</p>
            </article>

            {rotatorProjects.length ? <HeroProjectRotator projects={rotatorProjects} /> : null}

            <Link className="bento-card bento-work" href="/work">
              <div>
                <h2>Selected work across product, motion and 3D</h2>
                <span className="bento-work-link">See all work <ArrowUpRight aria-hidden="true" /></span>
              </div>
              <div className="bento-work-thumbs" aria-hidden="true">
                {featuredProjects.slice(1, 5).map((project) => (
                  <span key={project.slug}><Image src={project.cover_image} alt="" fill sizes="96px" style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }} /></span>
                ))}
              </div>
            </Link>
          </div>
        </section>

        <section className="services-section" id="services" aria-labelledby="services-title">
          <header className="services-heading">
            <div>
              <p className="section-kicker">Ways to work together</p>
              <h2 id="services-title">Design support, your way.</h2>
            </div>
          </header>

          <div className="services-list">
            {[
              { title: "Launch & redesign", summary: "UI, websites and brand systems, ready to launch." },
              { title: "Ongoing design", summary: "A creative partner for your next releases." },
              { title: "3D & motion", summary: "Interactive experiences and visuals in motion." },
            ].map((service) => (
              <article className="service-brief" key={service.title}>
                <div className="service-brief-title">
                  <h3>{service.title}</h3>
                </div>
                <p className="service-description">{service.summary}</p>
              </article>
            ))}
          </div>

          <div className="services-detail-cta"><Link className="hero-cta hero-cta-primary" href="/services"><RollText text="Explore services" /> <ArrowRight aria-hidden="true" /></Link></div>
        </section>

        <HomeCaseStudies projects={projects.filter(isCaseStudy).sort(compareCaseStudies).map(({ slug, title, short_description, cover_image, project_date }) => ({ slug, title, short_description, cover_image, project_date }))} />

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
            <FeaturedShowcase projects={[...featuredProjects, ...projects.filter((project) => !featuredProjects.some((item) => item.slug === project.slug))].slice(0, 24)} />
          </div>
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
