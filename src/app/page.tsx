import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";

import { SiteSidebar } from "@/components/site-sidebar";
import { SocialLinks } from "@/components/social-links";
import { getPublishedProjects } from "@/lib/cms/projects";

export const revalidate = 60;

export default async function Home() {
  const projects = await getPublishedProjects();
  return (
    <main className="site-shell">
      <SiteSidebar />
      <div className="page-content">
        <section className="intro-section" id="home">
          <div className="intro-topline">
            <div className="intro-profile">
              <Image src="/profile.png" alt="Portrait of Hector Heredia" width={1254} height={1254} priority />
              <div><strong>Hector Heredia</strong><span>Senior Product &amp; Motion Designer</span></div>
            </div>
            <div className="open-badge"><span /> Open to work</div>
          </div>
          <div className="intro-copy">
            <p className="section-kicker">Hello, I&apos;m Hector</p>
            <h1>I turn complex ideas into clear, memorable digital experiences.</h1>
            <p className="intro-lede">I help SaaS, AI, Web3, fintech, and digital-product teams through product design, motion, and real-time 3D.</p>
            <SocialLinks />
          </div>
          <a className="scroll-link" href="#work">Explore selected work <ArrowDown aria-hidden="true" /></a>
        </section>

        <section className="featured-section" id="work" aria-labelledby="work-title">
          <header className="content-heading">
            <div><p className="section-kicker">Selected projects</p><h2 id="work-title">Featured Work</h2></div>
            <span>{projects.length} projects · 2022—2026</span>
          </header>
          <div className="work-grid">
            {projects.map((project, index) => (
              <Link className="work-card" href={`/work/${project.slug}`} key={project.slug}>
                <div className="work-image">
                  <Image src={project.cover_image} alt={`${project.title} project cover`} fill priority={index < 2} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 70vw, 42vw" unoptimized={project.cover_image.startsWith("http")} />
                  <span className="work-open"><ArrowUpRight aria-hidden="true" /></span>
                </div>
                <div className="work-meta">
                  <div><span>{project.category}</span><h3>{project.title}</h3></div>
                  <p>{project.tags.slice(0, 2).join(" · ")}<br />{project.project_date.slice(0, 4)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="about-panel" id="about" aria-labelledby="about-title">
          <p className="section-kicker">About</p>
          <div className="about-layout">
            <h2 id="about-title">Designing what&apos;s next—with clarity, motion, and purpose.</h2>
            <div className="about-text">
              <p>I&apos;m Hector Heredia, a Senior Product &amp; Motion Designer. I help ambitious teams shape products that feel simple, expressive, and human.</p>
              <p>My practice combines product thinking, interaction, motion, and real-time 3D to turn early ideas into experiences people remember.</p>
              <a href="https://www.linkedin.com/in/3d-visual-designer-jherem/" target="_blank" rel="noreferrer">View my experience <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <footer className="contact-panel" id="contact">
          <p className="section-kicker">Have a project in mind?</p>
          <a href="mailto:hectorheredia19@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio">Let&apos;s create something memorable <Mail aria-hidden="true" /></a>
          <div className="contact-bottom"><span>Hector Heredia © 2026</span><SocialLinks compact /></div>
        </footer>
      </div>
    </main>
  );
}
