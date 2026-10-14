export type Resource = {
  slug: string;
  name: string;
  category: string;
  status: string;
  version: string;
  description: string;
  platform: string;
  downloadUrl: string;
};

export const resources: Resource[] = [
  {
    slug: "ae-bridge",
    name: "AE Bridge",
    category: "Figma plugin",
    status: "Beta",
    version: "0.4.16",
    description:
      "Send your Figma selection to After Effects as editable layers, a precomp, or one raster image. A small bridge between design and motion.",
    platform: "Windows x64",
    downloadUrl:
      "https://github.com/jherem19/portfolio/releases/download/ae-bridge-v0.4.16/AE-Bridge-Setup-0.4.16.exe",
  },
];
