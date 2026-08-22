"use client";

import { type KeyboardEvent, useEffect, useRef } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";
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
  const historyRef = useRef([value]);
  const historyIndexRef = useRef(0);
  const lastEmittedRef = useRef(value);
  const lastTypingAtRef = useRef(0);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      historyRef.current = [value];
      historyIndexRef.current = 0;
      lastEmittedRef.current = value;
    }
  }, [value]);

  function emit(next: string, action: "typing" | "format" = "format") {
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    const now = Date.now();
    const mergeTyping = action === "typing" && now - lastTypingAtRef.current < 700 && history.length > 1;
    if (mergeTyping) history[history.length - 1] = next;
    else history.push(next);

    historyRef.current = history;
    historyIndexRef.current = history.length - 1;
    lastTypingAtRef.current = action === "typing" ? now : 0;
    lastEmittedRef.current = next;
    onChange(next);
  }

  function restoreHistory(direction: -1 | 1) {
    const target = historyIndexRef.current + direction;
    if (target < 0 || target >= historyRef.current.length) return;
    historyIndexRef.current = target;
    const next = historyRef.current[target];
    lastEmittedRef.current = next;
    lastTypingAtRef.current = 0;
    onChange(next);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(next.length, next.length);
    });
  }

  function replaceRange(start: number, end: number, replacement: string, selectionStart: number, selectionEnd: number) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    emit(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
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

  function handleShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "z") {
      event.preventDefault();
      restoreHistory(event.shiftKey ? 1 : -1);
    } else if (key === "y") {
      event.preventDefault();
      restoreHistory(1);
    } else if (key === "b") {
      event.preventDefault();
      wrapSelection("**", "**", "bold text");
    } else if (key === "i") {
      event.preventDefault();
      wrapSelection("*", "*", "italic text");
    } else if (key === "k") {
      event.preventDefault();
      addLink();
    } else if (event.shiftKey && event.code === "Digit7") {
      event.preventDefault();
      formatLines("", "List item", true);
    } else if (event.shiftKey && event.code === "Digit8") {
      event.preventDefault();
      formatLines("- ", "List item");
    }
  }

  return (
    <div className="admin-markdown-editor">
      <div className="admin-markdown-heading"><span>{label}</span><span>Live preview</span></div>
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
        <span aria-hidden="true" />
        <button aria-label="Undo" onClick={() => restoreHistory(-1)} title="Undo" type="button"><Undo2 aria-hidden="true" /></button>
        <button aria-label="Redo" onClick={() => restoreHistory(1)} title="Redo" type="button"><Redo2 aria-hidden="true" /></button>
      </div>
      <div className="admin-markdown-workspace">
        <div className="admin-markdown-input">
          <span>Editor</span>
          <textarea aria-label={label} onChange={(event) => emit(event.target.value, "typing")} onKeyDown={handleShortcut} placeholder={placeholder} ref={textareaRef} rows={rows} value={value} />
        </div>
        <div className="admin-markdown-output">
          <span>Final appearance</span>
          <div className="admin-markdown-preview">
            {value ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p>Start writing to see the final appearance here.</p>}
          </div>
        </div>
      </div>
      <div className="admin-markdown-help">
        <span>Select text before applying a format.</span>
        <span><kbd>⌘/Ctrl B</kbd> Bold</span>
        <span><kbd>⌘/Ctrl I</kbd> Italic</span>
        <span><kbd>⌘/Ctrl K</kbd> Link</span>
        <span><kbd>⌘/Ctrl Z</kbd> Undo</span>
        <span><kbd>⌘/Ctrl ⇧ Z</kbd> Redo</span>
      </div>
    </div>
  );
}
