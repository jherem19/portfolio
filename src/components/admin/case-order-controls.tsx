"use client";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { moveCaseStudyAction } from "@/app/admin/actions";
export function CaseOrderControls({ id, first, last }: { id: string; first: boolean; last: boolean }) {
 const [pending, startTransition] = useTransition();
 const [error, setError] = useState("");
 const router = useRouter();
 function move(direction: number) { startTransition(async () => { setError(""); const result = await moveCaseStudyAction(id, direction); if (!result.ok) setError(result.error ?? "Unable to reorder."); router.refresh(); }); }
 return <div className="admin-row-actions"><button type="button" aria-label="Move case study up" disabled={pending || first} onClick={() => move(-1)}><ArrowUp aria-hidden="true" /></button><button type="button" aria-label="Move case study down" disabled={pending || last} onClick={() => move(1)}><ArrowDown aria-hidden="true" /></button>{error ? <span role="alert">{error}</span> : null}</div>;
}
