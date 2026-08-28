import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { SideProject } from "@/types/cms";

const SIDE_PROJECT_FIELDS = "id,url,thumbnail,thumbnail_path,tools,created_at,updated_at" as const;

function normalizeSideProject(row: Record<string, unknown>): SideProject {
  return {
    ...(row as unknown as SideProject),
    tools: Array.isArray(row.tools) ? (row.tools as string[]) : [],
  };
}

export const getSideProjects = cache(async (): Promise<SideProject[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("side_projects")
      .select(SIDE_PROJECT_FIELDS)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => normalizeSideProject(row));
  } catch {
    return [];
  }
});

export async function getAdminSideProjects(): Promise<SideProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("side_projects")
    .select(SIDE_PROJECT_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeSideProject(row));
}

export async function getAdminSideProject(id: string): Promise<SideProject | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("side_projects")
    .select(SIDE_PROJECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeSideProject(data) : null;
}
