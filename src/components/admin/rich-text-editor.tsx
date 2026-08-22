"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

import { getRichTextHtml, isRichText, RICH_TEXT_PREFIX } from "@/lib/rich-text";

type RichTextEditorProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

function toEditorHtml(value: string) {
  if (isRichText(value)) return getRichTextHtml(value);
  return value ? String(marked.parse(value, { async: false, breaks: true, gfm: true })) : "";
}

export function RichTextEditor({ label, onChange, placeholder = "Start writing…", value }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        "aria-label": label,
        class: "admin-rich-editor-content",
        role: "textbox",
      },
    },
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const next = `${RICH_TEXT_PREFIX}${currentEditor.getHTML()}`;
      lastEmittedRef.current = next;
      onChangeRef.current(next);
    },
  });

  useEffect(() => {
    if (!editor || value === lastEmittedRef.current) return;
    editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
    lastEmittedRef.current = value;
  }, [editor, value]);

  if (!editor) return <div className="admin-rich-editor-loading">Loading visual editor…</div>;

  function editLink() {
    if (!editor) return;
    const currentUrl = String(editor.getAttributes("link").href ?? "");
    const url = window.prompt("Paste the link URL", currentUrl || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const toolbarButton = (
    labelText: string,
    action: () => void,
    content: React.ReactNode,
    active = false,
    disabled = false,
  ) => (
    <button
      aria-label={labelText}
      className={active ? "is-active" : undefined}
      disabled={disabled}
      onClick={action}
      title={labelText}
      type="button"
    >
      {content}
    </button>
  );

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor-heading">
        <span>{label}</span>
        <span>Visual editor</span>
      </div>
      <div className="admin-rich-editor-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        {toolbarButton("Heading 1", () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1", editor.isActive("heading", { level: 1 }))}
        {toolbarButton("Heading 2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2", editor.isActive("heading", { level: 2 }))}
        {toolbarButton("Heading 3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "H3", editor.isActive("heading", { level: 3 }))}
        {toolbarButton("Subtitle", () => editor.chain().focus().toggleHeading({ level: 4 }).run(), "Subtitle", editor.isActive("heading", { level: 4 }))}
        {toolbarButton("Body", () => editor.chain().focus().setParagraph().run(), "Body", editor.isActive("paragraph"))}
        <span aria-hidden="true" />
        {toolbarButton("Bold", () => editor.chain().focus().toggleBold().run(), <Bold aria-hidden="true" />, editor.isActive("bold"))}
        {toolbarButton("Italic", () => editor.chain().focus().toggleItalic().run(), <Italic aria-hidden="true" />, editor.isActive("italic"))}
        {toolbarButton("Strikethrough", () => editor.chain().focus().toggleStrike().run(), <Strikethrough aria-hidden="true" />, editor.isActive("strike"))}
        {toolbarButton("Link", editLink, <Link2 aria-hidden="true" />, editor.isActive("link"))}
        {toolbarButton("Bulleted list", () => editor.chain().focus().toggleBulletList().run(), <List aria-hidden="true" />, editor.isActive("bulletList"))}
        {toolbarButton("Numbered list", () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered aria-hidden="true" />, editor.isActive("orderedList"))}
        {toolbarButton("Quote", () => editor.chain().focus().toggleBlockquote().run(), <Quote aria-hidden="true" />, editor.isActive("blockquote"))}
        <span aria-hidden="true" />
        {toolbarButton("Undo", () => editor.chain().focus().undo().run(), <Undo2 aria-hidden="true" />, false, !editor.can().undo())}
        {toolbarButton("Redo", () => editor.chain().focus().redo().run(), <Redo2 aria-hidden="true" />, false, !editor.can().redo())}
      </div>
      <EditorContent editor={editor} />
      <div className="admin-rich-editor-help">
        <span>Write and format directly in the final appearance.</span>
        <span><kbd>⌘/Ctrl B</kbd> Bold</span>
        <span><kbd>⌘/Ctrl I</kbd> Italic</span>
        <span><kbd>⌘/Ctrl K</kbd> Link</span>
        <span><kbd>⌘/Ctrl Z</kbd> Undo</span>
        <span><kbd>⌘/Ctrl ⇧ Z</kbd> Redo</span>
      </div>
    </div>
  );
}
