"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { blockTypes, type ProjectInput } from "@/types/cms";

export type AdminActionResult = { ok: boolean; error?: string; id?: string };

function clean(value: unknown, maxLength = 5000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
}

function validateProject(input: ProjectInput) {
  const title = clean(input.title, 160);
  const slug = clean(input.slug, 160).toLowerCase();
  const shortDescription = clean(input.short_description, 500);

  if (!title) throw new Error("The project title is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("The slug can only contain lowercase letters, numbers, and hyphens.");
  }
  if (!shortDescription) throw new Error("The short description is required.");
  if (!input.cover_image) throw new Error("A cover image is required.");
  if (!input.project_date || Number.isNaN(Date.parse(input.project_date))) {
    throw new Error("A valid project date is required.");
  }
  if (!input.blocks.every((block) => blockTypes.includes(block.type))) {
    throw new Error("One of the content block types is invalid.");
  }

  return {
    title,
    slug,
    short_description: shortDescription,
    cover_image: clean(input.cover_image, 2000),
    cover_image_path: clean(input.cover_image_path, 1000) || null,
    cover_position_x: clampNumber(input.cover_position_x, 0, 100, 50),
    cover_position_y: clampNumber(input.cover_position_y, 0, 100, 50),
    cover_zoom: clampNumber(input.cover_zoom, 100, 180, 100),
    cover_video: clean(input.cover_video, 2000) || null,
    cover_video_path: clean(input.cover_video_path, 1000) || null,
    category: clean(input.category, 120),
    tags: input.tags.map((tag) => clean(tag, 60)).filter(Boolean).slice(0, 20),
    project_date: input.project_date,
    client: clean(input.client, 160) || null,
    external_url: clean(input.external_url, 2000) || null,
    featured: Boolean(input.featured),
    status: input.status === "published" ? "published" : "draft",
  };
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/admin/login?error=Supabase+is+not+configured+yet");

  const email = clean(formData.get("email"), 320).toLowerCase();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  if (!email || !password) redirect("/admin/login?error=Enter+your+email+and+password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role, active").eq("id", userId).maybeSingle()
    : { data: null };

  if (!profile || profile.role !== "admin" || !profile.active) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=This+account+does+not+have+administrator+access");
  }

  revalidatePath("/admin", "layout");
  redirect("/admin/projects");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}

export async function saveProjectAction(input: ProjectInput): Promise<AdminActionResult> {
  try {
    if (!(await getAdmin())) throw new Error("Your administrator session is not valid.");
    const project = validateProject(input);
    const blocks = input.blocks.map((block, position) => ({
      type: block.type,
      position,
      data: block.data,
    }));
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("save_project_with_blocks", {
      p_project_id: input.id ?? null,
      p_project: project,
      p_blocks: blocks,
    });

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/work", "layout");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/admin/projects");
    return { ok: true, id: String(data) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save the project." };
  }
}

export async function setProjectStatusAction(
  id: string,
  status: "draft" | "published",
): Promise<AdminActionResult> {
  try {
    if (!(await getAdmin())) throw new Error("Your administrator session is not valid.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("projects")
      .update({ status, published_at: status === "published" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/admin/projects");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to change the status." };
  }
}

export async function deleteProjectAction(id: string): Promise<AdminActionResult> {
  try {
    if (!(await getAdmin())) throw new Error("Your administrator session is not valid.");
    const supabase = await createClient();
    const { data: project, error: readError } = await supabase
      .from("projects")
      .select("cover_image_path, cover_video_path, project_blocks(data)")
      .eq("id", id)
      .single();
    if (readError) throw readError;

    const paths = new Set<string>();
    if (project.cover_image_path) paths.add(project.cover_image_path);
    if (project.cover_video_path) paths.add(project.cover_video_path);
    const collectPaths = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(collectPaths);
      if (!value || typeof value !== "object") return;
      Object.entries(value).forEach(([key, nested]) => {
        if (key === "path" && typeof nested === "string") paths.add(nested);
        else collectPaths(nested);
      });
    };
    project.project_blocks?.forEach((block: { data: unknown }) => collectPaths(block.data));

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    if (paths.size) await supabase.storage.from("portfolio-media").remove([...paths]);

    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to delete the project." };
  }
}
