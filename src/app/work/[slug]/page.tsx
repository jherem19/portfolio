import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";

import { SiteSidebar } from "@/components/site-sidebar";
import { ProjectBlocks } from "@/components/project-blocks";
import { site } from "@/data/site";
import { getPublishedProject, getPublishedProjects } from "@/lib/cms/projects";
import { jsonLd } from "@/lib/json-ld";

export const revalidate = 60;

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return {};
  const url = `${site.url}/work/${project.slug}`;
  const image = project.cover_image.startsWith("http") ? project.cover_image : `${site.url}${project.cover_image}`;

  return {
    title: project.title,
    description: project.short_description,
    keywords: [project.category, ...project.tags, site.name],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${project.title} | ${site.name}`,
      description: project.short_description,
      images: [{ url: image, alt: `${project.title} project cover` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | ${site.name}`,
      description: project.short_description,
      images: [image],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  const projects = await getPublishedProjects();
  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length];
  const projectUrl = `${site.url}/work/${project.slug}`;

  return (
    <main className="site-shell project-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": `${projectUrl}/#creative-work`,
            url: projectUrl,
            name: project.title,
            description: project.short_description,
            abstract: project.short_description,
            image: project.cover_image.startsWith("http") ? project.cover_image : `${site.url}${project.cover_image}`,
            dateCreated: project.project_date,
            genre: project.category,
            keywords: project.tags.join(", "),
            inLanguage: "en",
            creator: { "@id": `${site.url}/#person` },
            isPartOf: { "@id": `${site.url}/#website` },
          }),
        }}
      />
      <SiteSidebar active="work" />
      <article className="page-content project-page">
        <header className="project-hero">
          <Link className="back-link" href="/#work"><ArrowLeft aria-hidden="true" /> Back to work</Link>
          <p className="section-kicker">{project.category} · {project.project_date.slice(0, 4)}</p>
          <h1>{project.title}</h1>
          <p className="project-intro">{project.short_description}</p>
          <dl className="project-facts">
            <div><dt>Category</dt><dd>{project.category}</dd></div>
            <div><dt>Year</dt><dd>{project.project_date.slice(0, 4)}</dd></div>
            <div><dt>Focus</dt><dd>{project.tags.join(" · ")}</dd></div>
          </dl>
        </header>

        <div className="project-cover">
          {project.cover_video ? <video autoPlay loop muted playsInline poster={project.cover_image} src={project.cover_video} /> : <Image src={project.cover_image} alt={`${project.title} project cover`} fill priority sizes="(max-width: 900px) 100vw, 78vw" unoptimized={project.cover_image.startsWith("http")} />}
        </div>

        <ProjectBlocks blocks={project.blocks} />

        {project.external_url ? <a className="project-external-link" href={project.external_url} rel="noreferrer" target="_blank">Visit project <ArrowUpRight aria-hidden="true" /></a> : null}

        {nextProject ? <Link className="next-project" href={`/work/${nextProject.slug}`}><span>Next project</span><strong>{nextProject.title}</strong><ArrowRight aria-hidden="true" /></Link> : null}
        <footer className="project-footer"><span>Want to discuss a similar project?</span><a href="mailto:hectorheredia19@gmail.com?subject=Project%20inquiry%20from%20your%20portfolio">Let&apos;s talk <ArrowUpRight aria-hidden="true" /></a></footer>
      </article>
    </main>
  );
}
