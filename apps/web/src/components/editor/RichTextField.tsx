"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { formatEntryDateRange, type RichText, type RichTextEntry } from "@resume-ai/schema";
import { DateRangePicker } from "@/components/editor/DateRangePicker";
import { RichTextEntryEditor } from "@/components/editor/RichTextEntryEditor";
import { CalendarIcon, ListIcon, PlusIcon, TrashIcon, TypeIcon } from "@/components/icons";

export interface RichTextFieldProps {
  entries: RichText;
  onChange: (entries: RichText) => void;
  placeholder?: string;
}

function ToolbarIconButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded ${
        disabled
          ? "cursor-not-allowed text-gray-300"
          : active
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Manages a `RichText` array (see packages/resume-schema/src/richText.ts):
 * add/remove/reorder entries, toggle each entry between paragraph/bullet,
 * attach an optional per-entry date, and edit inline formatting (via
 * RichTextEntryEditor's bubble menu). Matches the reference design's
 * "+Entry / T / list / trash / calendar" block toolbar.
 */
export function RichTextField({ entries, onChange, placeholder }: RichTextFieldProps) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const [dateEditorFor, setDateEditorFor] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  // Only set for entries created via addEntry() during this session, so
  // pre-existing content never steals focus (and reveals the toolbar) on mount.
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show the block toolbar while this field (or one of its popovers) is
  // actively being edited; hide it again on any click outside the field.
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        setDateEditorFor(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function addEntry(afterId?: string | null) {
    const newEntry: RichTextEntry = { id: uuidv4(), type: "paragraph", html: "", date: "", dateTo: "" };
    if (afterId) {
      const index = entries.findIndex((e) => e.id === afterId);
      const next = [...entries];
      next.splice(index + 1, 0, newEntry);
      onChange(next);
    } else {
      onChange([...entries, newEntry]);
    }
    setActiveId(newEntry.id);
    setAutoFocusId(newEntry.id);
  }

  function updateEntry(id: string, partial: Partial<RichTextEntry>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...partial } : e)));
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
    setActiveId(null);
  }

  const activeEntry = entries.find((e) => e.id === activeId) ?? null;

  return (
    <div ref={containerRef} onFocus={() => setFocused(true)} onMouseDown={() => setFocused(true)}>
      {focused && (
        <div className="mb-1.5 flex w-fit items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => addEntry(activeId)}
            className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Entry
          </button>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />
          <ToolbarIconButton
            label="Paragraph"
            active={activeEntry?.type === "paragraph"}
            disabled={!activeEntry}
            onClick={() => activeEntry && updateEntry(activeEntry.id, { type: "paragraph" })}
          >
            <TypeIcon className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Bullet list"
            active={activeEntry?.type === "bullet"}
            disabled={!activeEntry}
            onClick={() => activeEntry && updateEntry(activeEntry.id, { type: "bullet" })}
          >
            <ListIcon className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Entry date"
            active={dateEditorFor === activeId}
            disabled={!activeEntry}
            onClick={() => setDateEditorFor((v) => (v === activeId ? null : activeId))}
          >
            <CalendarIcon className="h-4 w-4" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label="Delete entry"
            active={false}
            disabled={!activeEntry}
            onClick={() => activeEntry && removeEntry(activeEntry.id)}
          >
            <TrashIcon className="h-4 w-4" />
          </ToolbarIconButton>
        </div>
      )}

      {activeEntry && dateEditorFor === activeEntry.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setDateEditorFor(null)} />
          <div className="relative z-20 mb-2 w-fit">
            <DateRangePicker
              from={activeEntry.date}
              to={activeEntry.dateTo}
              onChange={({ from, to }) => updateEntry(activeEntry.id, { date: from, dateTo: to })}
            />
          </div>
        </>
      )}

      {entries.length === 0 && (
        <button
          type="button"
          onClick={() => addEntry()}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          {placeholder ?? "Click to add text..."}
        </button>
      )}
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-md border border-gray-200 px-3 py-2 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400"
          >
            <div className={entry.type === "bullet" ? "flex gap-2" : ""}>
              {entry.type === "bullet" && <span className="mt-0.5 text-gray-400">•</span>}
              <div className="min-w-0 flex-1">
                <RichTextEntryEditor
                  entry={entry}
                  autoFocus={entry.id === autoFocusId}
                  onChangeHtml={(html) => updateEntry(entry.id, { html })}
                  onFocusEntry={() => setActiveId(entry.id)}
                  placeholder={placeholder}
                />
                {entry.date && (
                  <span className="text-xs text-gray-400">{formatEntryDateRange(entry)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-center">
        <button
          type="button"
          aria-label="Add entry"
          title="Add entry"
          onClick={() => addEntry(entries[entries.length - 1]?.id)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-emerald-400 hover:text-emerald-500"
        >
          <PlusIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
