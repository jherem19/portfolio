"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

const MAX_TAG_LENGTH = 60;

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
};

export function TagInput({ value, onChange, maxTags = 20 }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTags(rawTags: string) {
    const nextTags = [...value];

    for (const rawTag of rawTags.split(",")) {
      const tag = rawTag.trim().slice(0, MAX_TAG_LENGTH);
      const duplicate = nextTags.some(
        (currentTag) => currentTag.toLocaleLowerCase() === tag.toLocaleLowerCase(),
      );

      if (tag && !duplicate && nextTags.length < maxTags) nextTags.push(tag);
    }

    if (nextTags.length !== value.length) onChange(nextTags);
  }

  function commitDraft() {
    addTags(draft);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      commitDraft();
      return;
    }

    if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  function handleDraftChange(nextDraft: string) {
    if (!nextDraft.includes(",")) {
      setDraft(nextDraft);
      return;
    }

    const parts = nextDraft.split(",");
    addTags(parts.slice(0, -1).join(","));
    setDraft(parts.at(-1) ?? "");
  }

  function removeTag(index: number) {
    onChange(value.filter((_, tagIndex) => tagIndex !== index));
    inputRef.current?.focus();
  }

  return (
    <div>
      <div
        className="admin-tag-input"
        onClick={() => inputRef.current?.focus()}
        role="group"
      >
        {value.map((tag, index) => (
          <span className="admin-tag-chip" key={`${tag}-${index}`}>
            {tag}
            <button
              aria-label={`Remove ${tag} tag`}
              onClick={(event) => {
                event.stopPropagation();
                removeTag(index);
              }}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          aria-label="Add a tag"
          autoComplete="off"
          disabled={value.length >= maxTags}
          maxLength={MAX_TAG_LENGTH}
          onBlur={commitDraft}
          onChange={(event) => handleDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length ? "Add another tag…" : "Motion Design, SaaS, 3D"}
          ref={inputRef}
          type="text"
          value={draft}
        />
      </div>
      <p className="admin-tag-help">
        Press comma or Enter to add a tag · {value.length}/{maxTags}
      </p>
    </div>
  );
}
