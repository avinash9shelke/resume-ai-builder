"use client";

import { v4 as uuidv4 } from "uuid";
import { richTextToPlainText, plainTextToRichText } from "@resume-ai/schema";
import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { AiPolishButton } from "@/components/editor/AiPolishButton";
import { RichTextField } from "@/components/editor/RichTextField";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function ProjectsSection() {
  const items = useResumeStore((s) => s.resume.sections.projects.items);
  const headline = useResumeStore((s) => s.resume.basics.headline);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.name || "New project"}
          onRemove={() => removeItem("projects", item.id)}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Name"
              value={item.name}
              onChange={(e) => updateItem("projects", item.id, { name: e.target.value })}
            />
            <TextField
              label="Website"
              value={item.website.url}
              onChange={(e) =>
                updateItem("projects", item.id, { website: { ...item.website, url: e.target.value } })
              }
            />
            <TextField
              label="Period"
              placeholder="e.g. 2023 - 2024"
              value={item.period}
              onChange={(e) => updateItem("projects", item.id, { period: e.target.value })}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <AiPolishButton
                target="project_description"
                text={richTextToPlainText(item.description)}
                context={{ name: item.name, targetRole: headline }}
                onReplace={(text) =>
                  updateItem("projects", item.id, {
                    description: [...item.description, ...plainTextToRichText(text, uuidv4)],
                  })
                }
              />
            </div>
            <RichTextField
              entries={item.description}
              onChange={(description) => updateItem("projects", item.id, { description })}
            />
          </div>
        </ItemCard>
      ))}
      <AddItemButton label="Add project" onClick={() => addItem("projects")} />
    </div>
  );
}
