"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSingleLineText, setSingleLineRichText } from "@resume-ai/schema";
import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { InlineTextInput } from "@/components/editor/InlineTextInput";
import { CUSTOM_SECTION_ICON_MAP } from "@/lib/customSectionIcons";
import { PlusIcon, TrashIcon } from "@/components/icons";

export interface CustomSectionCardProps {
  sectionId: string;
}

/**
 * Editor for a single user-defined custom section (Feature: custom sections).
 * Entries render as a compact icon + title + description block (design
 * reference: screenshot) — the icon avatar and date field are shown only
 * when the section was configured to include them (see CustomSectionConfigModal).
 */
export function CustomSectionCard({ sectionId }: CustomSectionCardProps) {
  const section = useResumeStore((s) => s.resume.customSections.find((cs) => cs.id === sectionId));
  const updateCustomSectionTitle = useResumeStore((s) => s.updateCustomSectionTitle);

  if (!section) return null;

  const Icon = section.icon ? CUSTOM_SECTION_ICON_MAP[section.icon] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Section title"
        value={section.title}
        onChange={(e) => updateCustomSectionTitle(sectionId, e.target.value)}
      />

      <EntryList
        sectionId={sectionId}
        items={section.items}
        icon={Icon}
        showDate={section.showDate}
      />
    </div>
  );
}

interface EntryListProps {
  sectionId: string;
  items: Array<{
    id: string;
    title: string;
    date: string;
    description: ReturnType<typeof setSingleLineRichText>;
  }>;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  showDate?: boolean;
}

/**
 * Compact icon + bold title + one-line description entry layout used by all
 * custom sections. Toolbar only appears while the section is actively being edited.
 */
function EntryList({ sectionId, items, icon: Icon, showDate }: EntryListProps) {
  const addCustomSectionItem = useResumeStore((s) => s.addCustomSectionItem);
  const updateCustomSectionItem = useResumeStore((s) => s.updateCustomSectionItem);
  const removeCustomSectionItem = useResumeStore((s) => s.removeCustomSectionItem);

  const [activeItemId, setActiveItemId] = useState<string | null>(items[0]?.id ?? null);
  // Autofocus a freshly-created, still-empty single entry (e.g. right after
  // "Add Section") without stealing focus from existing saved content.
  const [autoFocusId, setAutoFocusId] = useState<string | null>(
    items.length === 1 && !items[0].title ? items[0].id : null,
  );
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleAddEntry() {
    addCustomSectionItem(sectionId);
    const newItems = useResumeStore.getState().resume.customSections.find((s) => s.id === sectionId)
      ?.items;
    const newItem = newItems?.[newItems.length - 1];
    if (newItem) {
      setActiveItemId(newItem.id);
      setAutoFocusId(newItem.id);
    }
  }

  function handleDelete() {
    if (!activeItemId) return;
    removeCustomSectionItem(sectionId, activeItemId);
    setActiveItemId(null);
  }

  return (
    <div ref={containerRef} onFocus={() => setFocused(true)} onMouseDown={() => setFocused(true)}>
      {focused && (
        <div className="mb-2 flex w-fit items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={handleAddEntry}
            className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Entry
          </button>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />
          <button
            type="button"
            aria-label="Delete entry"
            title="Delete entry"
            disabled={!activeItemId}
            onClick={handleDelete}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            onFocus={() => setActiveItemId(item.id)}
            className="flex items-start gap-3 rounded-md border border-gray-200 p-3 transition-colors focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400"
          >
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <InlineTextInput
                  autoFocus={item.id === autoFocusId}
                  value={item.title}
                  placeholder="Custom Title"
                  onFocus={() => setActiveItemId(item.id)}
                  onChange={(e) =>
                    updateCustomSectionItem(sectionId, item.id, { title: e.target.value })
                  }
                  className="w-full text-sm font-semibold text-gray-900"
                />
                {showDate && (
                  <InlineTextInput
                    value={item.date}
                    placeholder="Date period"
                    onFocus={() => setActiveItemId(item.id)}
                    onChange={(e) => updateCustomSectionItem(sectionId, item.id, { date: e.target.value })}
                    className="shrink-0 text-right text-xs text-gray-400"
                  />
                )}
              </div>
              <InlineTextInput
                value={getSingleLineText(item.description)}
                placeholder="Custom Description"
                onFocus={() => setActiveItemId(item.id)}
                onChange={(e) =>
                  updateCustomSectionItem(sectionId, item.id, {
                    description: setSingleLineRichText(item.description, e.target.value, uuidv4),
                  })
                }
                className="w-full text-sm text-gray-500"
              />
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <button
          type="button"
          onClick={handleAddEntry}
          className="rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-600"
        >
          Click to add an entry...
        </button>
      )}
    </div>
  );
}
