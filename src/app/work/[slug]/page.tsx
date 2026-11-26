import { ArticleRecommendations } from "@/components/article-recommendations";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteSidebar } from "@/components/site-sidebar";
import { isCaseStudy, visibleProjectTags } from "@/lib/case-studies";
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
    keywords: [project.category, ...visibleProjectTags(project.tags), site.name],
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

  const projectUrl = `${site.url}/work/${project.slug}`;

  return (
    <main className="site-shell project-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CreativeWork",
                "@id": `${projectUrl}/#creative-work`,
                url: projectUrl,
                mainEntityOfPage: projectUrl,
                name: project.title,
                description: project.short_description,
                abstract: project.short_description,
                image: project.cover_image.startsWith("http") ? project.cover_image : `${site.url}${project.cover_image}`,
                dateCreated: project.project_date,
                ...(project.published_at ? { datePublished: project.published_at } : {}),
                ...(project.updated_at ? { dateModified: project.updated_at } : {}),
                genre: project.category,
                keywords: visibleProjectTags(project.tags).join(", "),
                inLanguage: "en",
                creator: { "@id": `${site.url}/#person` },
                isPartOf: { "@id": `${site.url}/#website` },
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${projectUrl}/#breadcrumb`,
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: site.url,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Work",
                    item: `${site.url}/work`,
                  },
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: project.title,
                    item: projectUrl,
                  },
                ],
              },
            ],
          }),
        }}
      />
      <SiteSidebar active="work" horizontal />
      <article className="page-content project-page">
        <header className="project-hero">
          <Link className="back-link" href="/work"><ArrowLeft aria-hidden="true" /> Back to work</Link>
          <p className="section-kicker">{project.category} · {project.project_date.slice(0, 4)}</p>
          <h1>{project.title}</h1>
          <p className="project-intro">{project.short_description}</p>
          <dl className="project-facts">
            <div><dt>Category</dt><dd>{project.category}</dd></div>
            <div><dt>Year</dt><dd>{project.project_date.slice(0, 4)}</dd></div>
            <div><dt>Focus</dt><dd>{visibleProjectTags(project.tags).join(" · ")}</dd></div>
          </dl>
        </header>

        <div className="project-cover">
          {project.cover_video ? <video autoPlay loop muted playsInline poster={project.cover_image} src={project.cover_video} style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%`, transform: `scale(${project.cover_zoom / 100})` }} /> : <Image src={project.cover_image} alt={`${project.title} project cover`} fill priority sizes="(max-width: 900px) 100vw, 78vw" style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%`, transform: `scale(${project.cover_zoom / 100})` }} />}
        </div>

        <ProjectBlocks blocks={project.blocks} coverImage={project.cover_image} />

        {project.external_url ? <a className="hero-cta project-external-link" href={project.external_url} rel="noreferrer" target="_blank">Visit project <ArrowUpRight aria-hidden="true" /></a> : null}

        <ArticleRecommendations currentSlug={project.slug} caseStudiesOnly={isCaseStudy(project)} />
        <footer className="project-footer"><span>Want to discuss a similar project?</span><Link href="/contact">Let&apos;s talk <ArrowUpRight aria-hidden="true" /></Link></footer>
      </article>
      <SiteFooter />
    </main>
  );
}
