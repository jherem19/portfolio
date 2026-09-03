export const blockTypes = ["rich_text", "image", "gallery", "video", "section"] as const;

export type BlockType = (typeof blockTypes)[number];

export type MediaAsset = {
  url: string;
  path?: string;
  alt?: string;
  caption?: string;
};

export type ProjectBlock = {
  id?: string;
  type: BlockType;
  position: number;
  data: {
    markdown?: string;
    title?: string;
    url?: string;
    path?: string;
    alt?: string;
    caption?: string;
    poster_url?: string;
    items?: MediaAsset[];
  };
};

export type CMSProject = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  cover_image: string;
  cover_image_path?: string | null;
  cover_position_x: number;
  cover_position_y: number;
  cover_zoom: number;
  cover_video?: string | null;
  cover_video_path?: string | null;
  category: string;
  tags: string[];
  project_date: string;
  client?: string | null;
  external_url?: string | null;
  featured: boolean;
  show_in_3d_archive: boolean;
  status: "draft" | "published";
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  blocks: ProjectBlock[];
};

export type ProjectSummary = Pick<
  CMSProject,
  | "id"
  | "title"
  | "slug"
  | "short_description"
  | "cover_image"
  | "cover_position_x"
  | "cover_position_y"
  | "cover_zoom"
  | "cover_video"
  | "category"
  | "tags"
  | "project_date"
  | "featured"
  | "show_in_3d_archive"
  | "status"
  | "published_at"
  | "created_at"
  | "updated_at"
>;

export type ProjectInput = Omit<CMSProject, "id" | "created_at" | "updated_at" | "published_at"> & {
  id?: string;
};

export type SideProject = {
  id: string;
  url: string;
  thumbnail: string;
  thumbnail_path?: string | null;
  tools: string[];
  created_at?: string;
  updated_at?: string;
};

export type SideProjectInput = Omit<SideProject, "id" | "created_at" | "updated_at"> & {
  id?: string;
};
