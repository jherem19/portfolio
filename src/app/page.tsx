import Image from "next/image";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const projects = [
  {
    title: "Stratadex",
    discipline: "Product Design · Web3",
    image: "/work/stratadex.png",
    alt: "Stratadex digital asset product experience",
    className: "md:col-span-2",
  },
  {
    title: "Security, made clear",
    discipline: "Motion Design · Product",
    image: "/work/security-flow.png",
    alt: "Soft purple product interface and security flow",
  },
  {
    title: "Minah",
    discipline: "Brand Experience · Campaign",
    image: "/work/minah.png",
    alt: "Minah impact investment campaign",
  },
  {
    title: "Sound, reimagined",
    discipline: "Real-time 3D · Art Direction",
    image: "/work/audio-device.png",
    alt: "Conceptual 3D audio device",
    className: "md:col-span-2",
  },
  {
    title: "rdon",
    discipline: "Product Design · E-commerce",
    image: "/work/rdon.png",
    alt: "Rdon bike light product experience",
  },
  {
    title: "Digital matter 01",
    discipline: "3D Exploration",
    image: "/work/blue-form.png",
    alt: "Blue textured abstract 3D form",
  },
  {
    title: "Sustainable systems",
    discipline: "Digital Product · Web",
    image: "/work/green-product.png",
    alt: "Green digital product website",
    className: "md:col-span-2",
  },
  {
    title: "Digital matter 02",
    discipline: "3D Exploration",
    image: "/work/green-form.png",
    alt: "Green textured abstract 3D form",
  },
  {
    title: "Interface studies",
    discipline: "Product Design · Fintech",
    image: "/work/game-console.png",
    alt: "Light product dashboard interface",
  },
  {
    title: "Pocket worlds",
    discipline: "3D Design · Product",
    image: "/work/dashboard.png",
    alt: "Yellow handheld game console rendering",
    className: "md:col-span-2",
  },
  {
    title: "Control",
    discipline: "Real-time 3D",
    image: "/work/game-controller.png",
    alt: "Black game controller rendering",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Hector Heredia, home">
          HH<span className="wordmark-dot">.</span>
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a
            href="https://www.linkedin.com/in/3d-visual-designer-jherem/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </nav>

        <a
          className={cn(buttonVariants({ size: "lg" }), "contact-pill")}
          href="mailto:hectorheredia19@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio"
        >
          Let&apos;s talk <ArrowUpRight aria-hidden="true" />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="availability">
          <span className="availability-dot" /> Available for selected projects
        </div>

        <h1>
          I turn complex ideas into
          <span> clear, memorable experiences.</span>
        </h1>

        <div className="hero-bottom">
          <p>
            Senior Product &amp; Motion Designer working across SaaS, AI, Web3,
            fintech, and real-time 3D.
          </p>
          <a className="scroll-cue" href="#work">
            Selected work <ArrowDown aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="work-section" id="work" aria-labelledby="work-title">
        <div className="section-heading">
          <p>Selected work</p>
          <h2 id="work-title">A mix of product, motion, and 3D.</h2>
          <span>2022—2026</span>
        </div>

        <div className="project-grid">
          {projects.map((project, index) => (
            <article
              className={cn("project-card", project.className)}
              key={project.title}
            >
              <div className="project-image-wrap">
                <Image
                  src={project.image}
                  alt={project.alt}
                  fill
                  priority={index < 3}
                  sizes={
                    project.className
                      ? "(max-width: 767px) 100vw, 66vw"
                      : "(max-width: 767px) 100vw, 33vw"
                  }
                  className="project-image"
                />
                <span className="project-arrow" aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </div>
              <div className="project-meta">
                <h3>{project.title}</h3>
                <p>{project.discipline}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="portrait-wrap">
          <Image
            src="/profile.png"
            alt="Portrait of Hector Heredia"
            width={958}
            height={963}
            sizes="(max-width: 767px) 100vw, 38vw"
            className="portrait"
          />
        </div>

        <div className="about-copy">
          <p className="eyebrow">About</p>
          <h2 id="about-title">Designing what&apos;s next—with clarity and motion.</h2>
          <p>
            I&apos;m Hector Heredia, a Senior Product &amp; Motion Designer. I help
            ambitious teams shape digital products that feel simple, expressive,
            and distinctly human.
          </p>
          <p>
            My practice brings together product thinking, interaction, motion,
            and real-time 3D to turn early ideas into experiences people remember.
          </p>
          <a
            className="text-link"
            href="https://www.linkedin.com/in/3d-visual-designer-jherem/"
            target="_blank"
            rel="noreferrer"
          >
            View experience <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="footer">
        <p className="eyebrow">Have a project in mind?</p>
        <a
          className="footer-email"
          href="mailto:hectorheredia19@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio"
        >
          Let&apos;s make it memorable <Mail aria-hidden="true" />
        </a>
        <div className="footer-bottom">
          <span>Hector Heredia © 2026</span>
          <span>Product · Motion · 3D</span>
        </div>
      </footer>
    </main>
  );
}
