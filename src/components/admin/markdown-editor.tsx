"use client";

import { useRef, useState } from "react";
import { Bold, Eye, Italic, Link2, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownEditorProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
};

export function MarkdownEditor({ label, onChange, placeholder, rows = 8, value }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  function replaceRange(start: number, end: number, replacement: string, selectionStart: number, selectionEnd: number) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + selectionStart, start + selectionEnd);
    });
  }

  function replaceSelection(replacement: string, selectionStart: number, selectionEnd: number) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    replaceRange(textarea.selectionStart, textarea.selectionEnd, replacement, selectionStart, selectionEnd);
  }

  function wrapSelection(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selected = value.slice(textarea.selectionStart, textarea.selectionEnd) || fallback;
    replaceSelection(`${before}${selected}${after}`, before.length, before.length + selected.length);
  }

  function formatLines(prefix: string, fallback: string, numbered = false) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const lineStart = value.lastIndexOf("\n", Math.max(0, textarea.selectionStart - 1)) + 1;
    const nextLineBreak = value.indexOf("\n", textarea.selectionEnd);
    const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
    const selected = value.slice(lineStart, lineEnd) || fallback;
    const formatted = selected
      .split("\n")
      .map((line, index) => `${numbered ? `${index + 1}. ` : prefix}${line.replace(/^(?:#{1,6}|>)\s+/, "")}`)
      .join("\n");
    replaceRange(lineStart, lineEnd, formatted, 0, formatted.length);
  }

  function addLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const selected = value.slice(textarea.selectionStart, textarea.selectionEnd) || "link text";
    const url = "https://example.com";
    const replacement = `[${selected}](${url})`;
    const urlStart = selected.length + 3;
    replaceSelection(replacement, urlStart, urlStart + url.length);
  }

  return (
    <div className="admin-markdown-editor">
      <div className="admin-markdown-heading">
        <span>{label}</span>
        <button aria-pressed={showPreview} onClick={() => setShowPreview((current) => !current)} type="button">
          <Eye aria-hidden="true" /> {showPreview ? "Edit" : "Preview"}
        </button>
      </div>
      <div className="admin-markdown-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        <button onClick={() => formatLines("# ", "Title")} title="Heading 1" type="button">H1</button>
        <button onClick={() => formatLines("## ", "Heading")} title="Heading 2" type="button">H2</button>
        <button onClick={() => formatLines("### ", "Heading")} title="Heading 3" type="button">H3</button>
        <button onClick={() => formatLines("#### ", "Subtitle")} title="Subtitle" type="button">Subtitle</button>
        <button onClick={() => formatLines("", "Body text")} title="Body text" type="button">Body</button>
        <span aria-hidden="true" />
        <button aria-label="Bold" onClick={() => wrapSelection("**", "**", "bold text")} title="Bold" type="button"><Bold aria-hidden="true" /></button>
        <button aria-label="Italic" onClick={() => wrapSelection("*", "*", "italic text")} title="Italic" type="button"><Italic aria-hidden="true" /></button>
        <button aria-label="Strikethrough" onClick={() => wrapSelection("~~", "~~", "strikethrough text")} title="Strikethrough" type="button"><Strikethrough aria-hidden="true" /></button>
        <button aria-label="Link" onClick={addLink} title="Add link" type="button"><Link2 aria-hidden="true" /></button>
        <button aria-label="Bulleted list" onClick={() => formatLines("- ", "List item")} title="Bulleted list" type="button"><List aria-hidden="true" /></button>
        <button aria-label="Numbered list" onClick={() => formatLines("", "List item", true)} title="Numbered list" type="button"><ListOrdered aria-hidden="true" /></button>
        <button aria-label="Quote" onClick={() => formatLines("> ", "Quote")} title="Quote" type="button"><Quote aria-hidden="true" /></button>
      </div>
      {showPreview ? (
        <div className="admin-markdown-preview">
          {value ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p>Nothing to preview yet.</p>}
        </div>
      ) : (
        <textarea aria-label={label} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} ref={textareaRef} rows={rows} value={value} />
      )}
      <p className="admin-markdown-help">Select text and apply a format. Links, lists and headings are saved as portable Markdown.</p>
    </div>
  );
}
