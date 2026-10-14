import { resources } from "@/data/resources";

export function GET() {
  const resource = resources.find((item) => item.slug === "ae-bridge")!;
  return Response.redirect(resource.downloadUrl, 302);
}
