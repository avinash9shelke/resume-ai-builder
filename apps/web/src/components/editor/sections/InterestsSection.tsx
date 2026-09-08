"use client";

import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { TagListInput } from "@/components/editor/TagListInput";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function InterestsSection() {
  const items = useResumeStore((s) => s.resume.sections.interests.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.name || "New interest"}
          onRemove={() => removeItem("interests", item.id)}
        >
          <TextField
            label="Name"
            value={item.name}
            onChange={(e) => updateItem("interests", item.id, { name: e.target.value })}
          />
          <TagListInput
            label="Keywords"
            values={item.keywords}
            onChange={(keywords) => updateItem("interests", item.id, { keywords })}
          />
        </ItemCard>
      ))}
      <AddItemButton label="Add interest" onClick={() => addItem("interests")} />
    </div>
  );
}
