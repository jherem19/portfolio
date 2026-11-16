import type { ProjectSummary } from "@/types/cms";

export type WorkType = { id: string; label: string; pattern: RegExp };

// Client-facing types of work. A project can belong to several, matched against its title, category and tags.
export const workTypes: WorkType[] = [
  { id: "product", label: "Product & UI/UX", pattern: /\bui\b|\bux\b|interface|\bapp\b|dashboard|product design|saas|platform|figma|onboarding|fintech|digital product/ },
  { id: "web", label: "Web design", pattern: /web design|website|\bweb\b|landing|wordpress|webflow|e-commerce|ecommerce|commerce/ },
  { id: "3d", label: "3D & visualization", pattern: /\b3d\b|blender|modeling|render|isometric|low poly|hard surface|spline|real-time/ },
  { id: "motion", label: "Motion & animation", pattern: /animation|motion|\bloop\b|after effects|animated|interaction/ },
  { id: "brand", label: "Branding & identity", pattern: /brand|logo|identity/ },
  { id: "illustration", label: "Illustration & icons", pattern: /illustration|\bicons?\b|vector|character|graphic design/ },
];

export function projectTypeText(project: ProjectSummary) {
  return [project.title, project.category, ...project.tags].join(" ").toLowerCase();
}

export function projectTypes(project: ProjectSummary): string[] {
  const text = projectTypeText(project);
  return workTypes.filter((type) => type.pattern.test(text)).map((type) => type.id);
}
