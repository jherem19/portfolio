/** Case studies are an editorial classification, persisted with the project's tags. */
export const CASE_STUDY_TAG = "Case study";

export function isCaseStudy(project: { tags: string[] }) {
  return project.tags.some((tag) => tag.trim().toLowerCase() === CASE_STUDY_TAG.toLowerCase());
}

export function setCaseStudy(tags: string[], enabled: boolean) {
  const otherTags = tags.filter((tag) => tag.trim().toLowerCase() !== CASE_STUDY_TAG.toLowerCase());
  return enabled ? [CASE_STUDY_TAG, ...otherTags] : otherTags;
}

// Editorial metadata shares the existing tags storage; never expose it as a visible tag.
export const CASE_ORDER_PREFIX = "__case_order:";
export function caseOrder(tags: string[]) {
  const value = tags.find((tag) => tag.startsWith(CASE_ORDER_PREFIX))?.slice(CASE_ORDER_PREFIX.length);
  return value && Number.isFinite(Number(value)) ? Number(value) : undefined;
}
export function compareCaseStudies(a: { tags: string[]; project_date: string }, b: { tags: string[]; project_date: string }) {
  const rank = (item: typeof a) => caseOrder(item.tags) ?? -Date.parse(item.project_date);
  return rank(a) - rank(b) || b.project_date.localeCompare(a.project_date);
}
export function visibleProjectTags(tags: string[]) { return tags.filter((tag) => !tag.startsWith(CASE_ORDER_PREFIX)); }
