import Image from "next/image";
import Link from "next/link";
import { getPublishedProjects } from "@/lib/cms/projects";
import { compareCaseStudies, isCaseStudy } from "@/lib/case-studies";

export async function ArticleRecommendations({ currentSlug, caseStudiesOnly = false }: { currentSlug?: string; caseStudiesOnly?: boolean }) {
  const projects = (await getPublishedProjects())
    .filter((project) => project.slug !== currentSlug && (!caseStudiesOnly || isCaseStudy(project)));
  if (caseStudiesOnly) projects.sort(compareCaseStudies);
  const suggestions = projects.slice(0, 3);
  if (!suggestions.length) return null;
  return (
    <section className="article-recommendations" aria-labelledby="article-recommendations-title">
      <h2 id="article-recommendations-title">{caseStudiesOnly ? "More case studies" : "More selected work"}</h2>
      <div className="article-recommendation-list">
        {suggestions.map((project) => (
          <Link className="article-recommendation" href={`/work/${project.slug}`} key={project.id}>
            <div className="article-recommendation-image"><Image src={project.cover_image} alt="" fill sizes="(max-width: 600px) 100px, 190px" style={{ objectPosition: `${project.cover_position_x}% ${project.cover_position_y}%` }} /></div>
            <div className="article-recommendation-copy">
              <span>{isCaseStudy(project) ? "Case study" : project.category || "Selected work"}</span>
              <h3>{project.title}</h3>
              <time dateTime={project.project_date}>{new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${project.project_date.slice(0, 10)}T12:00:00Z`))}</time>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
