import { notFound } from "next/navigation";

import { SideProjectEditor } from "@/components/admin/side-project-editor";
import { getAdminSideProject } from "@/lib/cms/side-projects";

export default async function EditSideProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getAdminSideProject(id);
  if (!project) notFound();
  return <SideProjectEditor project={project} />;
}
