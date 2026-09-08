"use client";

import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function LanguagesSection() {
  const items = useResumeStore((s) => s.resume.sections.languages.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.language || "New language"}
          onRemove={() => removeItem("languages", item.id)}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Language"
              value={item.language}
              onChange={(e) => updateItem("languages", item.id, { language: e.target.value })}
            />
            <TextField
              label="Fluency"
              placeholder="e.g. Native speaker"
              value={item.fluency}
              onChange={(e) => updateItem("languages", item.id, { fluency: e.target.value })}
            />
          </div>
        </ItemCard>
      ))}
      <AddItemButton label="Add language" onClick={() => addItem("languages")} />
    </div>
  );
}
