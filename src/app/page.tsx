import Image from "next/image";
import { ArrowUpRight, Download, FileText, Mail } from "lucide-react";

import { FeaturedProjects } from "@/components/featured-projects";
import { LanyardBadge } from "@/components/lanyard-badge";
import { HeroMotionBackground } from "@/components/hero-motion-background";
import { SiteSidebar } from "@/components/site-sidebar";
import { SideProjects } from "@/components/side-projects";
import { SocialLinks } from "@/components/social-links";
import { getPublishedProjects } from "@/lib/cms/projects";
import { getSideProjects } from "@/lib/cms/side-projects";
import { ThreeDShowcase } from "@/components/three-d-showcase";

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
            <div><strong>Hector Heredia</strong><span>Senior Product &amp; Motion Designer</span></div>
          </div>
          <div className="intro-copy">
            <h1>I turn complex ideas into clear, memorable digital experiences.</h1>
            <p className="intro-lede">I help SaaS, AI, Web3, fintech, and digital-product teams through product design, motion, and real-time 3D.</p>
            <div className="intro-actions">
              <SocialLinks />
              <div className="resume-actions" aria-label="Resume options">
                <a href="/hector-heredia-resume.pdf" target="_blank" rel="noreferrer">
                  <FileText aria-hidden="true" /> View resume
                </a>
                <a href="/hector-heredia-resume.pdf" download="Hector-Heredia-Resume.pdf">
                  <Download aria-hidden="true" /> Download PDF
                </a>
              </div>
            </div>
          </div>
          <LanyardBadge />
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
            <h2 id="about-title">Designing what&apos;s next—with clarity, motion, and purpose.</h2>
            <div className="about-text">
              <p>I&apos;m Hector Heredia, a Senior Product &amp; Motion Designer. I help ambitious teams shape products that feel simple, expressive, and human.</p>
              <p>My practice combines product thinking, interaction, motion, and real-time 3D to turn early ideas into experiences people remember.</p>
              <div className="about-links">
                <a href="https://www.linkedin.com/in/3d-visual-designer-jherem/" target="_blank" rel="noreferrer">View my experience <ArrowUpRight aria-hidden="true" /></a>
                <a href="/hector-heredia-resume.pdf" download="Hector-Heredia-Resume.pdf">Download resume <Download aria-hidden="true" /></a>
              </div>
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
