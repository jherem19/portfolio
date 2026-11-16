"use client";

import { useMemo, useState } from "react";

import { FeaturedProjects } from "@/components/featured-projects";
import { projectTypes, workTypes } from "@/lib/work-types";
import type { ProjectSummary } from "@/types/cms";

export function WorkLibrary({ projects }: { projects: ProjectSummary[] }) {
  const [type, setType] = useState("all");

  const indexed = useMemo(() => projects.map((project) => ({ project, types: projectTypes(project) })), [projects]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of indexed) for (const id of item.types) result[id] = (result[id] ?? 0) + 1;
    return result;
  }, [indexed]);

  const active = type !== "all";
  const filtered = indexed.filter((item) => !active || item.types.includes(type)).map((item) => item.project);

  return (
    <>
      <div aria-label="Filter by type of work" className="work-filter-chips" role="group">
        <button aria-pressed={!active} onClick={() => setType("all")} type="button">All <span>{projects.length}</span></button>
        {workTypes.filter((item) => counts[item.id]).map((item) => (
          <button aria-pressed={type === item.id} key={item.id} onClick={() => setType(item.id)} type="button">
            {item.label} <span>{counts[item.id]}</span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="work-filter-status">
        {active ? `${filtered.length} of ${projects.length} projects` : ""}
        {active ? <button onClick={() => setType("all")} type="button">Clear filter</button> : null}
      </p>

      <FeaturedProjects key={type} pageSize={active ? filtered.length : undefined} projects={filtered} />
    </>
  );
}
