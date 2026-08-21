"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { deleteProjectAction, setProjectStatusAction } from "@/app/admin/actions";

export function ProjectRowActions({ id, status }: { id: string; status: "draft" | "published" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError("");
    startTransition(async () => {
      const result = await setProjectStatusAction(id, status === "published" ? "draft" : "published");
      if (!result.ok) setError(result.error ?? "Unable to update status.");
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this project permanently?")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteProjectAction(id);
      if (!result.ok) setError(result.error ?? "Unable to delete project.");
      router.refresh();
    });
  }

  return (
    <div className="admin-row-actions">
      <button disabled={pending} onClick={toggle} title={status === "published" ? "Unpublish" : "Publish"} type="button">
        {status === "published" ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
      <button disabled={pending} onClick={remove} title="Delete project" type="button"><Trash2 aria-hidden="true" /></button>
      {error ? <span>{error}</span> : null}
    </div>
  );
}
