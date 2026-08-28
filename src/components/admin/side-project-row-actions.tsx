"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteSideProjectAction } from "@/app/admin/actions";

export function SideProjectRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Delete this side project permanently?")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteSideProjectAction(id);
      if (!result.ok) setError(result.error ?? "Unable to delete the side project.");
      router.refresh();
    });
  }

  return <div className="admin-row-actions"><button disabled={pending} onClick={remove} title="Delete side project" type="button"><Trash2 aria-hidden="true" /></button>{error ? <span>{error}</span> : null}</div>;
}
