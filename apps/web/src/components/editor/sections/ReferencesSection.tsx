"use client";

import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { RichTextField } from "@/components/editor/RichTextField";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function ReferencesSection() {
  const items = useResumeStore((s) => s.resume.sections.references.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.name || "New reference"}
          onRemove={() => removeItem("references", item.id)}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Name"
              value={item.name}
              onChange={(e) => updateItem("references", item.id, { name: e.target.value })}
            />
            <TextField
              label="Position"
              value={item.position}
              onChange={(e) => updateItem("references", item.id, { position: e.target.value })}
            />
            <TextField
              label="Phone"
              value={item.phone}
              onChange={(e) => updateItem("references", item.id, { phone: e.target.value })}
            />
            <TextField
              label="Website"
              value={item.website.url}
              onChange={(e) =>
                updateItem("references", item.id, { website: { ...item.website, url: e.target.value } })
              }
            />
          </div>
          <RichTextField
            entries={item.description}
            onChange={(description) => updateItem("references", item.id, { description })}
          />
        </ItemCard>
      ))}
      <AddItemButton label="Add reference" onClick={() => addItem("references")} />
    </div>
  );
}
