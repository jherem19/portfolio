/** Case studies are an editorial classification, persisted with the project's tags. */
export const CASE_STUDY_TAG = "Case study";

export function isCaseStudy(project: { tags: string[] }) {
  return project.tags.some((tag) => tag.trim().toLowerCase() === CASE_STUDY_TAG.toLowerCase());
}

export function setCaseStudy(tags: string[], enabled: boolean) {
  const otherTags = tags.filter((tag) => tag.trim().toLowerCase() !== CASE_STUDY_TAG.toLowerCase());
  return enabled ? [CASE_STUDY_TAG, ...otherTags] : otherTags;
}
