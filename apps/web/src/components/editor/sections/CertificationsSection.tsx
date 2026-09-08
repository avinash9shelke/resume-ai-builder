"use client";

import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { RichTextField } from "@/components/editor/RichTextField";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function CertificationsSection() {
  const items = useResumeStore((s) => s.resume.sections.certifications.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.title || "New certification"}
          onRemove={() => removeItem("certifications", item.id)}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Title"
              value={item.title}
              onChange={(e) => updateItem("certifications", item.id, { title: e.target.value })}
            />
            <TextField
              label="Issuer"
              value={item.issuer}
              onChange={(e) => updateItem("certifications", item.id, { issuer: e.target.value })}
            />
            <TextField
              label="Date"
              placeholder="YYYY-MM"
              value={item.date}
              onChange={(e) => updateItem("certifications", item.id, { date: e.target.value })}
            />
            <TextField
              label="Website"
              value={item.website.url}
              onChange={(e) =>
                updateItem("certifications", item.id, { website: { ...item.website, url: e.target.value } })
              }
            />
          </div>
          <RichTextField
            entries={item.description}
            onChange={(description) => updateItem("certifications", item.id, { description })}
          />
        </ItemCard>
      ))}
      <AddItemButton label="Add certification" onClick={() => addItem("certifications")} />
    </div>
  );
}
