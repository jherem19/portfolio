import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import sanitizeHtml from "sanitize-html";

import { getRichTextHtml, isRichText } from "@/lib/rich-text";
import type { ProjectBlock } from "@/types/cms";

function RichText({ children }: { children: string }) {
  if (isRichText(children)) {
    const html = sanitizeHtml(getRichTextHtml(children), {
      allowedTags: ["p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "em", "s", "blockquote", "ul", "ol", "li", "a", "code", "pre"],
      allowedAttributes: { a: ["href", "target", "rel"] },
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: (_tagName, attributes) => ({
          tagName: "a",
          attribs: { ...attributes, rel: "noopener noreferrer", target: "_blank" },
        }),
      },
    });
    return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <div className="rich-text-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown></div>;
}

function mediaIdentity(url: string) {
  const parsed = new URL(url, "https://portfolio.local");
  // Supabase can serve the same asset through original and transformed URLs.
  return `${parsed.origin}${parsed.pathname.replace("/storage/v1/render/image/", "/storage/v1/object/")}`;
}

export function ProjectBlocks({ blocks, coverImage }: { blocks: ProjectBlock[]; coverImage?: string }) {
  const isCover = (url: string) => Boolean(coverImage && mediaIdentity(url) === mediaIdentity(coverImage));
  return (
    <div className="case-study-blocks">
      {blocks.map((block, index) => {
        if (block.type === "rich_text") {
          return <section className="case-rich-text" key={block.id ?? index}><RichText>{block.data.markdown ?? ""}</RichText></section>;
        }

        if (block.type === "section") {
          return <section className="case-section" key={block.id ?? index}><h2>{block.data.title}</h2><div className="case-markdown"><RichText>{block.data.markdown ?? ""}</RichText></div></section>;
        }

        if (block.type === "image" && block.data.url) {
          if (isCover(block.data.url)) return null;
          return <figure className="case-image" key={block.id ?? index}><Image alt={block.data.alt || "Project image"} height={1350} sizes="(max-width: 900px) 100vw, 78vw" src={block.data.url} width={2400} />{block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}</figure>;
        }

        if (block.type === "gallery") {
          const items = (block.data.items ?? []).filter((item) => !isCover(item.url));
          if (!items.length) return null;
          return <section className="case-gallery" key={block.id ?? index}>{items.map((item, itemIndex) => <figure key={`${item.url}-${itemIndex}`}><Image alt={item.alt || `Project gallery image ${itemIndex + 1}`} height={1200} sizes="(max-width: 900px) 100vw, 39vw" src={item.url} width={1600} />{item.caption ? <figcaption>{item.caption}</figcaption> : null}</figure>)}</section>;
        }

        if (block.type === "video" && block.data.url) {
          return <figure className="case-video" key={block.id ?? index}><video controls playsInline poster={block.data.poster_url} preload="metadata" src={block.data.url} />{block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}</figure>;
        }

        return null;
      })}
    </div>
  );
}
