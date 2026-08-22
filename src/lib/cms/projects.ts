import { projects as legacyProjects } from "@/data/projects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { CMSProject, ProjectBlock } from "@/types/cms";

function legacyToCMS(): CMSProject[] {
  return legacyProjects.map((project, index) => ({
    id: `legacy-${project.slug}`,
    title: project.title,
    slug: project.slug,
    short_description: project.intro,
    cover_image: project.image,
    category: project.category,
    tags: project.discipline.split(" · "),
    project_date: `${project.year}-01-01`,
    featured: index < 6,
    status: "published",
    blocks: [
      {
        type: "section",
        position: 0,
        data: {
          title: "Making the idea feel clear, useful, and distinctive.",
          markdown: project.overview,
        },
      },
    ],
  }));
}

function normalizeProject(row: Record<string, unknown>): CMSProject {
  const blocks = Array.isArray(row.project_blocks)
    ? (row.project_blocks as ProjectBlock[]).sort((a, b) => a.position - b.position)
    : [];

  return {
    ...(row as unknown as Omit<CMSProject, "blocks">),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    blocks,
  };
}

export async function getPublishedProjects(): Promise<CMSProject[]> {
  if (!isSupabaseConfigured()) return legacyToCMS();

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, project_blocks(*)")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("project_date", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => normalizeProject(row));
  } catch {
    return legacyToCMS();
  }
}

export async function getPublishedProject(slug: string): Promise<CMSProject | null> {
  if (!isSupabaseConfigured()) return legacyToCMS().find((project) => project.slug === slug) ?? null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, project_blocks(*)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;
    return data ? normalizeProject(data) : null;
  } catch {
    return legacyToCMS().find((project) => project.slug === slug) ?? null;
  }
}

export async function getAdminProjects(): Promise<CMSProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_blocks(*)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeProject(row));
}

export async function getAdminProject(id: string): Promise<CMSProject | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_blocks(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeProject(data) : null;
}
