import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";

import { SiteSidebar } from "@/components/site-sidebar";
import { getProject, projects } from "@/data/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: `${project.title} — Hector Heredia`, description: project.intro };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length];

  return (
    <main className="site-shell project-shell">
      <SiteSidebar active="work" />
      <article className="page-content project-page">
        <header className="project-hero">
          <Link className="back-link" href="/#work"><ArrowLeft aria-hidden="true" /> Back to work</Link>
          <p className="section-kicker">{project.category} · {project.year}</p>
          <h1>{project.title}</h1>
          <p className="project-intro">{project.intro}</p>
          <dl className="project-facts">
            <div><dt>Discipline</dt><dd>{project.discipline}</dd></div>
            <div><dt>Year</dt><dd>{project.year}</dd></div>
            <div><dt>Focus</dt><dd>{project.services.join(" · ")}</dd></div>
          </dl>
        </header>

        <div className="project-cover"><Image src={project.image} alt={project.alt} fill priority sizes="(max-width: 900px) 100vw, 78vw" /></div>

        <section className="project-story" aria-labelledby="overview-title">
          <p className="section-kicker">Overview</p>
          <h2 id="overview-title">Making the idea feel clear, useful, and distinctive.</h2>
          <p>{project.overview}</p>
        </section>

        <section className="project-process" aria-labelledby="process-title">
          <div><p className="section-kicker">Approach</p><h2 id="process-title">From direction to a coherent visual system.</h2></div>
          <ol>
            <li><span>01</span><div><strong>Frame</strong><p>Clarify the story, audience, and experience the work needs to create.</p></div></li>
            <li><span>02</span><div><strong>Explore</strong><p>Test visual directions, interaction ideas, composition, and motion.</p></div></li>
            <li><span>03</span><div><strong>Refine</strong><p>Build a focused system where every element supports the central idea.</p></div></li>
          </ol>
        </section>

        <Link className="next-project" href={`/work/${nextProject.slug}`}><span>Next project</span><strong>{nextProject.title}</strong><ArrowRight aria-hidden="true" /></Link>
        <footer className="project-footer"><span>Want to discuss a similar project?</span><a href="mailto:hectorheredia19@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio">Let&apos;s talk <ArrowUpRight aria-hidden="true" /></a></footer>
      </article>
    </main>
  );
}
