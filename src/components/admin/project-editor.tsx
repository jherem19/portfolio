"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react";

import { deleteProjectAction, saveProjectAction } from "@/app/admin/actions";
import { CoverCropper } from "@/components/admin/cover-cropper";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { MediaUploader } from "@/components/admin/media-uploader";
import type { BlockType, CMSProject, MediaAsset, ProjectBlock, ProjectInput } from "@/types/cms";

const blockLabels: Record<BlockType, string> = {
  rich_text: "Rich text",
  image: "Single image",
  gallery: "Gallery",
  video: "Video",
  section: "Title + description",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

function emptyProject(project?: CMSProject | null): ProjectInput {
  return project
    ? {
        ...project,
        blocks: project.blocks.map((block, position) => ({ ...block, position })),
      }
    : {
        title: "",
        slug: "",
        short_description: "",
        cover_image: "",
        cover_image_path: null,
        cover_position_x: 50,
        cover_position_y: 50,
        cover_zoom: 100,
        cover_video: null,
        cover_video_path: null,
        category: "",
        tags: [],
        project_date: new Date().toISOString().slice(0, 10),
        client: null,
        external_url: null,
        featured: false,
        status: "draft",
        blocks: [],
      };
}

function emptyBlock(type: BlockType, position: number): ProjectBlock {
  if (type === "gallery") return { type, position, data: { items: [] } };
  if (type === "section") return { type, position, data: { title: "", markdown: "" } };
  return { type, position, data: {} };
}

export function ProjectEditor({ project }: { project?: CMSProject | null }) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectInput>(() => emptyProject(project));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function update<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setBlock(index: number, block: ProjectBlock) {
    update(
      "blocks",
      form.blocks.map((item, itemIndex) => (itemIndex === index ? block : item)),
    );
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.blocks.length) return;
    const next = [...form.blocks];
    [next[index], next[target]] = [next[target], next[index]];
    update("blocks", next.map((block, position) => ({ ...block, position })));
  }

  function addBlock(type: BlockType) {
    update("blocks", [...form.blocks, emptyBlock(type, form.blocks.length)]);
  }

  function save(status: "draft" | "published") {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await saveProjectAction({ ...form, status });
      if (!result.ok) {
        setError(result.error ?? "Unable to save the project.");
        return;
      }
      setForm((current) => ({ ...current, id: result.id, status }));
      setMessage(status === "published" ? "Project published." : "Draft saved.");
      if (!form.id && result.id) router.replace(`/admin/projects/${result.id}`);
      router.refresh();
    });
  }

  function removeProject() {
    if (!form.id || !window.confirm("Delete this project permanently? Its uploaded assets will also be removed.")) return;
    startTransition(async () => {
      const result = await deleteProjectAction(form.id!);
      if (!result.ok) return setError(result.error ?? "Unable to delete the project.");
      router.replace("/admin/projects");
      router.refresh();
    });
  }

  return (
    <div className="admin-editor">
      <header className="admin-page-heading">
        <div>
          <p className="section-kicker">Portfolio CMS</p>
          <h1>{form.id ? `Edit ${form.title || "project"}` : "New project"}</h1>
        </div>
        <div className="admin-actions">
          {form.id ? (
            <button className="admin-button admin-button-danger" disabled={pending} onClick={removeProject} type="button">
              <Trash2 aria-hidden="true" /> Delete
            </button>
          ) : null}
          <button className="admin-button" disabled={pending} onClick={() => save("draft")} type="button">
            <Save aria-hidden="true" /> Save draft
          </button>
          <button className="admin-button admin-button-primary" disabled={pending} onClick={() => save("published")} type="button">
            {form.status === "published" ? "Update published" : "Publish"}
          </button>
        </div>
      </header>

      {error ? <div className="admin-notice admin-notice-error">{error}</div> : null}
      {message ? <div className="admin-notice admin-notice-success">{message}</div> : null}

      <section className="admin-card">
        <div className="admin-card-heading"><h2>Project details</h2><span>Required metadata and publishing controls</span></div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-wide">
            <span>Title *</span>
            <input
              onChange={(event) => {
                const title = event.target.value;
                setForm((current) => ({
                  ...current,
                  title,
                  slug: current.id || (current.slug && current.slug !== slugify(current.title)) ? current.slug : slugify(title),
                }));
              }}
              placeholder="Project title"
              value={form.title}
            />
          </label>
          <label className="admin-field">
            <span>Slug *</span>
            <input onChange={(event) => update("slug", slugify(event.target.value))} placeholder="project-slug" value={form.slug} />
          </label>
          <label className="admin-field">
            <span>Project date *</span>
            <input onChange={(event) => update("project_date", event.target.value)} type="date" value={form.project_date.slice(0, 10)} />
          </label>
          <label className="admin-field admin-field-wide">
            <span>Short description *</span>
            <textarea onChange={(event) => update("short_description", event.target.value)} placeholder="A concise summary for cards and SEO." rows={3} value={form.short_description} />
          </label>
          <label className="admin-field">
            <span>Category</span>
            <input onChange={(event) => update("category", event.target.value)} placeholder="Product motion" value={form.category} />
          </label>
          <label className="admin-field">
            <span>Tags</span>
            <input onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="Motion Design, SaaS, 3D" value={form.tags.join(", ")} />
          </label>
          <label className="admin-field">
            <span>Client</span>
            <input onChange={(event) => update("client", event.target.value)} placeholder="Optional" value={form.client ?? ""} />
          </label>
          <label className="admin-field">
            <span>External URL</span>
            <input onChange={(event) => update("external_url", event.target.value)} placeholder="https://…" type="url" value={form.external_url ?? ""} />
          </label>
          <label className="admin-check admin-field-wide">
            <input checked={form.featured} onChange={(event) => update("featured", event.target.checked)} type="checkbox" />
            <span>Feature this project on the homepage</span>
          </label>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading"><h2>Cover media</h2><span>Images up to 10 MB · videos up to 100 MB</span></div>
        <div className="admin-cover-grid">
          <div>
            <p className="admin-label">Cover image *</p>
            {form.cover_image ? (
              <CoverCropper
                image={form.cover_image}
                onChange={({ x, y, zoom }) => setForm((current) => ({ ...current, cover_position_x: x, cover_position_y: y, cover_zoom: zoom }))}
                x={form.cover_position_x}
                y={form.cover_position_y}
                zoom={form.cover_zoom}
              />
            ) : <div className="admin-empty-media">No cover image selected</div>}
            <MediaUploader label="Upload cover image" onUploaded={([asset]) => setForm((current) => ({ ...current, cover_image: asset.url, cover_image_path: asset.path, cover_position_x: 50, cover_position_y: 50, cover_zoom: 100 }))} />
          </div>
          <div>
            <p className="admin-label">Cover video (optional)</p>
            {form.cover_video ? <video className="admin-video-preview" controls playsInline src={form.cover_video} /> : <div className="admin-empty-media">No cover video selected</div>}
            <MediaUploader accept="video/mp4,video/webm,video/quicktime" label="Upload cover video" onUploaded={([asset]) => setForm((current) => ({ ...current, cover_video: asset.url, cover_video_path: asset.path }))} />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-heading"><h2>Case study blocks</h2><span>{form.blocks.length} blocks · order controls included</span></div>
        <div className="admin-block-list">
          {form.blocks.length ? form.blocks.map((block, index) => (
            <div className="admin-block" key={`${block.id ?? block.type}-${index}`}>
              <div className="admin-block-bar">
                <div><span>{String(index + 1).padStart(2, "0")}</span><strong>{blockLabels[block.type]}</strong></div>
                <div>
                  <button aria-label="Move block up" disabled={index === 0} onClick={() => moveBlock(index, -1)} type="button"><ArrowUp aria-hidden="true" /></button>
                  <button aria-label="Move block down" disabled={index === form.blocks.length - 1} onClick={() => moveBlock(index, 1)} type="button"><ArrowDown aria-hidden="true" /></button>
                  <button aria-label="Remove block" onClick={() => update("blocks", form.blocks.filter((_, itemIndex) => itemIndex !== index).map((item, position) => ({ ...item, position })))} type="button"><Trash2 aria-hidden="true" /></button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(next) => setBlock(index, next)} />
            </div>
          )) : <p className="admin-empty-state">Add the first block to start building this case study.</p>}
        </div>
        <div className="admin-add-blocks">
          {Object.entries(blockLabels).map(([type, label]) => (
            <button key={type} onClick={() => addBlock(type as BlockType)} type="button"><Plus aria-hidden="true" />{label}</button>
          ))}
        </div>
      </section>

      <footer className="admin-editor-footer">
        <span>Current status: <strong className={`admin-status admin-status-${form.status}`}>{form.status}</strong></span>
        {form.status === "published" && form.slug ? <a href={`/work/${form.slug}`} target="_blank">View public page <ExternalLink aria-hidden="true" /></a> : null}
      </footer>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: ProjectBlock; onChange: (block: ProjectBlock) => void }) {
  const setData = (data: ProjectBlock["data"]) => onChange({ ...block, data: { ...block.data, ...data } });

  if (block.type === "rich_text") {
    return <MarkdownEditor label="Rich text content" onChange={(markdown) => setData({ markdown })} placeholder="Write and format the project story…" rows={10} value={block.data.markdown ?? ""} />;
  }

  if (block.type === "section") {
    return <div className="admin-form-grid"><label className="admin-field admin-field-wide"><span>Section title</span><input onChange={(event) => setData({ title: event.target.value })} value={block.data.title ?? ""} /></label><div className="admin-field-wide"><MarkdownEditor label="Section description" onChange={(markdown) => setData({ markdown })} rows={7} value={block.data.markdown ?? ""} /></div></div>;
  }

  if (block.type === "image") {
    return <div className="admin-media-editor">{block.data.url ? <div className="admin-inline-preview"><Image alt={block.data.alt || "Uploaded project asset"} fill sizes="700px" src={block.data.url} unoptimized /></div> : null}<MediaUploader onUploaded={([asset]) => setData(asset)} /><div className="admin-form-grid"><label className="admin-field"><span>Alt text</span><input onChange={(event) => setData({ alt: event.target.value })} value={block.data.alt ?? ""} /></label><label className="admin-field"><span>Caption</span><input onChange={(event) => setData({ caption: event.target.value })} value={block.data.caption ?? ""} /></label></div></div>;
  }

  if (block.type === "video") {
    return <div className="admin-media-editor">{block.data.url ? <video className="admin-video-preview" controls playsInline poster={block.data.poster_url} src={block.data.url} /> : null}<MediaUploader accept="video/mp4,video/webm,video/quicktime" label="Upload video" onUploaded={([asset]) => setData(asset)} /><div className="admin-form-grid"><label className="admin-field"><span>Or video URL</span><input onChange={(event) => setData({ url: event.target.value, path: undefined })} placeholder="https://…" type="url" value={block.data.url ?? ""} /></label><label className="admin-field"><span>Caption</span><input onChange={(event) => setData({ caption: event.target.value })} value={block.data.caption ?? ""} /></label></div></div>;
  }

  const items = block.data.items ?? [];
  return <div className="admin-media-editor"><div className="admin-gallery-preview">{items.map((item, index) => <div key={`${item.url}-${index}`}><div className="admin-gallery-thumb"><Image alt={item.alt || `Gallery image ${index + 1}`} fill sizes="220px" src={item.url} unoptimized /></div><input aria-label={`Alt text for gallery image ${index + 1}`} onChange={(event) => setData({ items: items.map((asset, assetIndex) => assetIndex === index ? { ...asset, alt: event.target.value } : asset) })} placeholder="Alt text" value={item.alt ?? ""} /><button onClick={() => setData({ items: items.filter((_, assetIndex) => assetIndex !== index) })} type="button"><Trash2 aria-hidden="true" /> Remove</button></div>)}</div><MediaUploader label="Add gallery images" multiple onUploaded={(assets: MediaAsset[]) => setData({ items: [...items, ...assets] })} /></div>;
}
