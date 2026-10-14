import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Download } from "lucide-react";

import { SiteSidebar } from "@/components/site-sidebar";
import { resources } from "@/data/resources";

export const metadata: Metadata = {
  title: "Resources",
  description: "Plugins, tools, and downloadable resources from Hector Heredia's design and motion practice.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  return (
    <main className="site-shell">
      <SiteSidebar active="resources" />
      <div className="page-content resources-page">
        <header className="resources-hero">
          <p className="section-kicker">Made to be used</p>
          <h1>Resources</h1>
          <p>Plugins, files, and small tools from my design practice. Built to make the next step a little easier.</p>
        </header>
        <section className="resource-library" aria-label="Downloadable resources">
          <div className="resource-library-heading"><span>Available now</span><span>{String(resources.length).padStart(2, "0")} resources</span></div>
          {resources.map((resource) => (
            <article className="resource-card" key={resource.slug}>
              <div className="resource-art" aria-hidden="true">{resource.previewImage ? <Image src={resource.previewImage} width={190} height={190} alt="" unoptimized /> : <Download />}<span>{resource.category}</span></div>
              <div className="resource-card-copy">
                <div className="resource-meta"><span>{resource.category}</span><span className="resource-badge">{resource.status}</span></div>
                <h2><Link href={`/resources/${resource.slug}`}>{resource.name}</Link></h2>
                <p>{resource.description}</p>
                <div className="resource-card-bottom"><span>{resource.platform} · v{resource.version}</span><Link href={`/resources/${resource.slug}`} className="resource-text-link">Explore resource <ArrowRight aria-hidden="true" /></Link></div>
              </div>
            </article>
          ))}
        </section>
        <footer className="resource-footer"><Download aria-hidden="true" /><p>This collection will grow as I build and share more tools.</p></footer>
      </div>
    </main>
  );
}
