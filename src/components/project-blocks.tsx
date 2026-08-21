import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ProjectBlock } from "@/types/cms";

function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}

export function ProjectBlocks({ blocks }: { blocks: ProjectBlock[] }) {
  return (
    <div className="case-study-blocks">
      {blocks.map((block, index) => {
        if (block.type === "rich_text") {
          return <section className="case-rich-text" key={block.id ?? index}><Markdown>{block.data.markdown ?? ""}</Markdown></section>;
        }

        if (block.type === "section") {
          return <section className="case-section" key={block.id ?? index}><p className="section-kicker">Section {String(index + 1).padStart(2, "0")}</p><div><h2>{block.data.title}</h2><div className="case-markdown"><Markdown>{block.data.markdown ?? ""}</Markdown></div></div></section>;
        }

        if (block.type === "image" && block.data.url) {
          return <figure className="case-image" key={block.id ?? index}><Image alt={block.data.alt || "Project image"} height={1350} src={block.data.url} unoptimized width={2400} />{block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}</figure>;
        }

        if (block.type === "gallery") {
          const items = block.data.items ?? [];
          return <section className="case-gallery" key={block.id ?? index}>{items.map((item, itemIndex) => <figure key={`${item.url}-${itemIndex}`}><Image alt={item.alt || `Project gallery image ${itemIndex + 1}`} height={1200} src={item.url} unoptimized width={1600} />{item.caption ? <figcaption>{item.caption}</figcaption> : null}</figure>)}</section>;
        }

        if (block.type === "video" && block.data.url) {
          return <figure className="case-video" key={block.id ?? index}><video controls playsInline poster={block.data.poster_url} preload="metadata" src={block.data.url} />{block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}</figure>;
        }

        return null;
      })}
    </div>
  );
}
