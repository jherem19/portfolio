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

const socialLinks = [
  { label: "X", href: "https://x.com/JHereM", icon: "x" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/3d-visual-designer-jherem/",
    icon: "linkedin",
  },
  { label: "Behance", href: "https://www.behance.net/jherem", icon: "behance" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/jherem19/",
    icon: "instagram",
  },
];

function SocialIcon({ name }: { name: string }) {
  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-6.4L6.45 22H3.34l7.25-8.29L2.94 2H9.35l4.43 5.86L18.9 2Zm-1.1 17.84h1.72L8.41 4.05H6.56L17.8 19.84Z" />
      </svg>
    );
  }

  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.34 7.87A2.34 2.34 0 1 0 5.34 3.2a2.34 2.34 0 0 0 0 4.67ZM3.32 20.8h4.04V9.52H3.32V20.8ZM9.66 9.52h3.87v1.54h.06c.54-1.02 1.86-2.1 3.82-2.1 4.08 0 4.84 2.69 4.84 6.18v5.66h-4.04v-5.02c0-1.2-.02-2.74-1.67-2.74-1.68 0-1.94 1.31-1.94 2.65v5.11h-4.04V9.52Z" />
      </svg>
    );
  }

  if (name === "behance") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 5.5h7.1c3.14 0 5.28 1.08 5.28 4.02 0 1.55-.78 2.64-2.16 3.3 1.94.56 2.92 2.05 2.92 4.03 0 3.23-2.74 4.61-5.61 4.61H3V5.5Zm3.5 6.45h3.35c1.27 0 2.22-.58 2.22-1.97 0-1.56-1.2-1.9-2.48-1.9H6.5v3.87Zm0 6.93h3.54c1.43 0 2.68-.46 2.68-2.17 0-1.68-1.05-2.35-2.61-2.35H6.5v4.52ZM17.5 6.42H22V8h-4.5V6.42Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.8" r="1.15" />
    </svg>
  );
}

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
            width={1254}
            height={1254}
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

      <section className="social-section" aria-labelledby="social-title">
        <div>
          <p className="eyebrow">Elsewhere</p>
          <h2 id="social-title">Follow the work.</h2>
        </div>
        <div className="social-links" aria-label="Social profiles">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              title={social.label}
            >
              <SocialIcon name={social.icon} />
            </a>
          ))}
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
