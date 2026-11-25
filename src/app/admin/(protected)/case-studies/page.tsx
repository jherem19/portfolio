import AdminProjectsPage from "../projects/page";

export default async function AdminCaseStudiesPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string; order?: string }> }) {
  return <AdminProjectsPage searchParams={searchParams} caseStudiesOnly />;
}
