"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { InlineTextInput } from "@/components/editor/InlineTextInput";
import { PlusIcon } from "@/components/icons";

/** Flat list of skills (name + optional 0-5 proficiency level), matching
 * the rxresu.me schema's `sections.skills.items` shape. */
export function SkillsSection() {
  const items = useResumeStore((s) => s.resume.sections.skills.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);
  const [focusId, setFocusId] = useState<string | null>(null);

  function handleAdd() {
    addItem("skills");
    const newItems = useResumeStore.getState().resume.sections.skills.items;
    const newItem = newItems[newItems.length - 1];
    setFocusId(newItem.id);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-400 hover:text-gray-600"
        >
          Click to add a skill...
        </button>
      )}

      <div className="flex flex-col divide-y divide-gray-100 rounded-md border border-gray-200">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2">
            <InlineTextInput
              value={item.name}
              placeholder="Skill name"
              autoFocus={item.id === focusId}
              onChange={(e) => updateItem("skills", item.id, { name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && item.name === "") {
                  e.preventDefault();
                  removeItem("skills", item.id);
                }
              }}
              className="flex-1 text-sm font-medium text-gray-800"
            />
            <div className="flex items-center gap-1" role="group" aria-label="Proficiency level">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-label={`Set level ${level}`}
                  onClick={() =>
                    updateItem("skills", item.id, { level: item.level === level ? 0 : level })
                  }
                  className={`h-2.5 w-2.5 rounded-full border ${
                    level <= item.level
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300 bg-white hover:border-blue-400"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Remove skill"
              onClick={() => removeItem("skills", item.id)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <button
          type="button"
          onClick={handleAdd}
          className="flex w-fit items-center gap-1 rounded-full border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add skill
        </button>
      )}
    </div>
  );
}
