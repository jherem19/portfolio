"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { MediaAsset } from "@/types/cms";

type Props = {
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  label?: string;
  onUploaded: (assets: MediaAsset[]) => void;
};

const IMAGE_LIMIT = 10 * 1024 * 1024;
const VIDEO_LIMIT = 100 * 1024 * 1024;

function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const extension = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const stem = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${stem || "asset"}${extension}`;
}

export function MediaUploader({ accept = "image/*", maxSizeMb, multiple = false, label = "Upload media", onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Your admin session has expired. Please sign in again.");

      const uploaded: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const maxSize = maxSizeMb ? maxSizeMb * 1024 * 1024 : isVideo ? VIDEO_LIMIT : IMAGE_LIMIT;
        if (file.size > maxSize) {
          throw new Error(`${file.name} exceeds the ${maxSizeMb ?? (isVideo ? 100 : 10)} MB limit.`);
        }

        const path = `${auth.user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("portfolio-media")
          .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, path, alt: "", caption: "" });
      }

      onUploaded(uploaded);
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-uploader">
      <input
        accept={accept}
        disabled={busy}
        hidden
        multiple={multiple}
        onChange={(event) => upload(event.target.files)}
        ref={inputRef}
        type="file"
      />
      <button className="admin-upload-button" disabled={busy} onClick={() => inputRef.current?.click()} type="button">
        {busy ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : multiple ? <ImagePlus aria-hidden="true" /> : <UploadCloud aria-hidden="true" />}
        {busy ? "Uploading…" : label}
      </button>
      {error ? <p className="admin-field-error">{error}</p> : null}
    </div>
  );
}
