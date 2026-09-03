"use client";

import { useMemo, useState } from "react";

import { ThreeDCard } from "@/components/three-d-card";
import type { ProjectSummary } from "@/types/cms";

type Filter = "all" | "product" | "environment" | "motion";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "product", label: "Product" },
  { value: "environment", label: "Environment" },
  { value: "motion", label: "Motion" },
];

function matchesFilter(project: ProjectSummary, filter: Exclude<Filter, "all">) {
  const search = `${project.category} ${(project.tags ?? []).join(" ")}`.toLowerCase();
  if (filter === "environment") return /environment|architect|space|interior/.test(search);
  if (filter === "motion") return /motion|animation|animated/.test(search);
  return /product|visualization|industrial|object/.test(search);
}

export function ThreeDLibrary({ projects }: { projects: ProjectSummary[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const visibleProjects = useMemo(
    () => activeFilter === "all" ? projects : projects.filter((project) => matchesFilter(project, activeFilter)),
    [activeFilter, projects],
  );

  return (
    <>
      <div className="three-d-filters" aria-label="Filter 3D projects">
        {filters.map((filter) => (
          <button
            aria-pressed={activeFilter === filter.value}
            className={activeFilter === filter.value ? "is-active" : ""}
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>
      {visibleProjects.length ? (
        <div className="three-d-library-grid">
          {visibleProjects.map((project) => <ThreeDCard key={project.id} project={project} />)}
        </div>
      ) : <p className="three-d-empty">No published studies in this category yet.</p>}
    </>
  );
}
