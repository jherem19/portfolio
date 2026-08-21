import { site } from "@/data/site";
import { getPublishedProjects } from "@/lib/cms/projects";

export async function GET() {
  const projects = await getPublishedProjects();
  const projectList = projects
    .map(
      (project) =>
        `- [${project.title}](${site.url}/work/${project.slug}): ${project.short_description} Category: ${project.category}. Tags: ${project.tags.join(", ")}. Year: ${project.project_date.slice(0, 4)}.`,
    )
    .join("\n");

  const content = `# ${site.name}\n\n> ${site.description}\n\n${site.name} is a ${site.role} specializing in motion design, product design, interaction, art direction, and real-time 3D. This is the canonical portfolio and contains selected work from 2022 to 2026.\n\n## Canonical pages\n\n- [Portfolio home](${site.url})\n${projectList}\n\n## Expertise\n\n${site.expertise.map((item) => `- ${item}`).join("\n")}\n\n## Official profiles\n\n- [X](${site.socials[0]})\n- [LinkedIn](${site.socials[1]})\n- [Behance](${site.socials[2]})\n- [Instagram](${site.socials[3]})\n\n## Contact\n\n- Email: ${site.email}\n\nAll project descriptions and identity information above are provided by the portfolio owner.\n`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
