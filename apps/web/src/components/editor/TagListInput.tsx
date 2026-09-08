"use client";

import { useState } from "react";

export interface TagListInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/** Small chip editor for string-array schema fields (highlights, keywords, courses, roles). */
export function TagListInput({ label, values, onChange, placeholder }: TagListInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-md border-0 px-2 py-1.5 ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-blue-600">
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
          >
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="text-blue-400 hover:text-blue-700"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          value={draft}
          placeholder={placeholder ?? "Type and press Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commitDraft}
          className="min-w-[8ch] flex-1 border-0 p-0.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
