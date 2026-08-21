import { notFound } from "next/navigation";

import { ProjectEditor } from "@/components/admin/project-editor";
import { getAdminProject } from "@/lib/cms/projects";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();
  return <ProjectEditor project={project} />;
}
