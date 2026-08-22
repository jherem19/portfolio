import { cache } from "react";

import { projects as legacyProjects } from "@/data/projects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { CMSProject, ProjectBlock, ProjectSummary } from "@/types/cms";

const PROJECT_SUMMARY_FIELDS = "id,title,slug,short_description,cover_image,cover_position_x,cover_position_y,cover_zoom,category,tags,project_date,featured,status,published_at,created_at,updated_at" as const;

function legacyToCMS(): CMSProject[] {
  return legacyProjects.map((project, index) => ({
    id: `legacy-${project.slug}`,
    title: project.title,
    slug: project.slug,
    short_description: project.intro,
    cover_image: project.image,
    cover_position_x: 50,
    cover_position_y: 50,
    cover_zoom: 100,
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
    ? (row.project_blocks as ProjectBlock[]).toSorted((a, b) => a.position - b.position)
    : [];

  return {
    ...(row as unknown as Omit<CMSProject, "blocks">),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    cover_position_x: Number(row.cover_position_x ?? 50),
    cover_position_y: Number(row.cover_position_y ?? 50),
    cover_zoom: Number(row.cover_zoom ?? 100),
    blocks,
  };
}

function normalizeProjectSummary(row: Record<string, unknown>): ProjectSummary {
  return {
    ...(row as unknown as ProjectSummary),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    cover_position_x: Number(row.cover_position_x ?? 50),
    cover_position_y: Number(row.cover_position_y ?? 50),
    cover_zoom: Number(row.cover_zoom ?? 100),
  };
}

function legacyProjectSummaries(): ProjectSummary[] {
  return legacyToCMS().map((project) =>
    normalizeProjectSummary(project as unknown as Record<string, unknown>),
  );
}

export const getPublishedProjects = cache(async (): Promise<ProjectSummary[]> => {
  if (!isSupabaseConfigured()) return legacyProjectSummaries();

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SUMMARY_FIELDS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("project_date", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => normalizeProjectSummary(row));
  } catch {
    return legacyProjectSummaries();
  }
});

export const getPublishedProject = cache(async (slug: string): Promise<CMSProject | null> => {
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
});

export async function getAdminProjects(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SUMMARY_FIELDS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeProjectSummary(row));
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
