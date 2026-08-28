"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Save, Trash2 } from "lucide-react";

import { deleteSideProjectAction, saveSideProjectAction } from "@/app/admin/actions";
import { MediaUploader } from "@/components/admin/media-uploader";
import { TagInput } from "@/components/admin/tag-input";
import { getSideProjectName } from "@/lib/side-project-name";
import type { SideProject, SideProjectInput } from "@/types/cms";

function emptySideProject(project?: SideProject | null): SideProjectInput {
  return project ? { ...project } : { url: "", thumbnail: "", thumbnail_path: null, tools: [] };
}

export function SideProjectEditor({ project }: { project?: SideProject | null }) {
  const router = useRouter();
  const [form, setForm] = useState<SideProjectInput>(() => emptySideProject(project));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await saveSideProjectAction(form);
      if (!result.ok) return setError(result.error ?? "Unable to save the side project.");
      setForm((current) => ({ ...current, id: result.id }));
      setMessage("Side project saved and visible on the portfolio.");
      if (!form.id && result.id) router.replace(`/admin/side-projects/${result.id}`);
      router.refresh();
    });
  }

  function remove() {
    if (!form.id || !window.confirm("Delete this side project permanently?")) return;
    startTransition(async () => {
      const result = await deleteSideProjectAction(form.id!);
      if (!result.ok) return setError(result.error ?? "Unable to delete the side project.");
      router.replace("/admin/side-projects");
      router.refresh();
    });
  }

  return (
    <div className="admin-editor">
      <header className="admin-page-heading">
        <div>
          <p className="section-kicker">Portfolio CMS</p>
          <h1>{form.id ? `Edit ${getSideProjectName(form.url)}` : "New side project"}</h1>
        </div>
        <div className="admin-actions">
          {form.id ? <button className="admin-button admin-button-danger" disabled={pending} onClick={remove} type="button"><Trash2 aria-hidden="true" /> Delete</button> : null}
          <button className="admin-button admin-button-primary" disabled={pending} onClick={save} type="button"><Save aria-hidden="true" /> {form.id ? "Save changes" : "Add side project"}</button>
        </div>
      </header>

      {error ? <div className="admin-notice admin-notice-error">{error}</div> : null}
      {message ? <div className="admin-notice admin-notice-success">{message}</div> : null}

      <section className="admin-card">
        <div className="admin-card-heading"><h2>Side project details</h2><span>Three fields · published immediately</span></div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-wide">
            <span>Project URL *</span>
            <input onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://your-side-project.com" type="url" value={form.url} />
          </label>
          <div className="admin-field admin-field-wide">
            <span>Tools used</span>
            <TagInput maxTags={12} onChange={(tools) => setForm((current) => ({ ...current, tools }))} value={form.tools} />
          </div>
          <div className="admin-field admin-field-wide">
            <span>Thumbnail *</span>
            {form.thumbnail ? (
              <div className="admin-side-project-preview">
                <Image alt={`${getSideProjectName(form.url)} thumbnail`} fill sizes="700px" src={form.thumbnail} unoptimized />
              </div>
            ) : <div className="admin-empty-media">No thumbnail selected</div>}
            <MediaUploader label="Upload thumbnail" onUploaded={([asset]) => setForm((current) => ({ ...current, thumbnail: asset.url, thumbnail_path: asset.path }))} />
          </div>
        </div>
      </section>

      {form.id && form.url ? <footer className="admin-editor-footer"><span>The name is generated automatically from the URL.</span><a href={form.url} rel="noreferrer" target="_blank">Open project <ExternalLink aria-hidden="true" /></a></footer> : null}
    </div>
  );
}
