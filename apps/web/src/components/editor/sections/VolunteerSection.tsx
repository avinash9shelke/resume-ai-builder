"use client";

import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { RichTextField } from "@/components/editor/RichTextField";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function VolunteerSection() {
  const items = useResumeStore((s) => s.resume.sections.volunteer.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.organization || "New organization"}
          onRemove={() => removeItem("volunteer", item.id)}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Organization"
              value={item.organization}
              onChange={(e) => updateItem("volunteer", item.id, { organization: e.target.value })}
            />
            <TextField
              label="Location"
              value={item.location}
              onChange={(e) => updateItem("volunteer", item.id, { location: e.target.value })}
            />
            <TextField
              label="Period"
              placeholder="e.g. 2020 - 2022"
              value={item.period}
              onChange={(e) => updateItem("volunteer", item.id, { period: e.target.value })}
            />
            <TextField
              label="Website"
              value={item.website.url}
              onChange={(e) =>
                updateItem("volunteer", item.id, { website: { ...item.website, url: e.target.value } })
              }
            />
          </div>
          <RichTextField
            entries={item.description}
            onChange={(description) => updateItem("volunteer", item.id, { description })}
          />
        </ItemCard>
      ))}
      <AddItemButton label="Add volunteering" onClick={() => addItem("volunteer")} />
    </div>
  );
}
