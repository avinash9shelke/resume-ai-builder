"use client";

import { useState, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { richTextToPlainText, plainTextToRichText } from "@resume-ai/schema";
import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { AiPolishButton } from "@/components/editor/AiPolishButton";
import { RichTextField } from "@/components/editor/RichTextField";
import { AddItemButton } from "@/components/editor/AddItemButton";
import { CameraIcon, TrashIcon } from "@/components/icons";

const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png"];

export function ExperienceSection() {
  const items = useResumeStore((s) => s.resume.sections.experience.items);
  const headline = useResumeStore((s) => s.resume.basics.headline);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);
  const [logoError, setLogoError] = useState<string | null>(null);

  function handleLogoChange(itemId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Please upload a JPG or PNG image.");
      return;
    }
    setLogoError(null);
    const reader = new FileReader();
    reader.onload = () => updateItem("experience", itemId, { logo: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-3">
      {logoError && <p className="text-xs text-red-600">{logoError}</p>}
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.position || item.company || "New position"}
          onRemove={() => removeItem("experience", item.id)}
        >
          <div className="flex items-center gap-3">
            <label
              htmlFor={`experience-logo-${item.id}`}
              title={item.logo ? "Change company logo" : "Add company logo"}
              className="group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50 hover:border-blue-400"
            >
              {item.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.logo} alt="" className="h-full w-full object-contain p-1" />
              ) : (
                <CameraIcon className="h-4 w-4 text-gray-400" />
              )}
              <input
                id={`experience-logo-${item.id}`}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => handleLogoChange(item.id, e)}
              />
            </label>
            {item.logo && (
              <button
                type="button"
                aria-label="Remove company logo"
                title="Remove company logo"
                onClick={() => updateItem("experience", item.id, { logo: "" })}
                className="text-gray-300 hover:text-red-500"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Company"
              value={item.company}
              onChange={(e) => updateItem("experience", item.id, { company: e.target.value })}
            />
            <TextField
              label="Position"
              value={item.position}
              onChange={(e) => updateItem("experience", item.id, { position: e.target.value })}
            />
            <TextField
              label="Location"
              value={item.location}
              onChange={(e) => updateItem("experience", item.id, { location: e.target.value })}
            />
            <TextField
              label="Period"
              placeholder="e.g. Jan 2020 - Present"
              value={item.period}
              onChange={(e) => updateItem("experience", item.id, { period: e.target.value })}
            />
            <TextField
              label="Website"
              value={item.website.url}
              onChange={(e) =>
                updateItem("experience", item.id, { website: { ...item.website, url: e.target.value } })
              }
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <AiPolishButton
                target="experience_description"
                text={richTextToPlainText(item.description)}
                context={{ company: item.company, position: item.position, targetRole: headline }}
                onReplace={(text) =>
                  updateItem("experience", item.id, {
                    description: [...item.description, ...plainTextToRichText(text, uuidv4)],
                  })
                }
              />
            </div>
            <RichTextField
              entries={item.description}
              onChange={(description) => updateItem("experience", item.id, { description })}
            />
          </div>
        </ItemCard>
      ))}
      <AddItemButton label="Add work experience" onClick={() => addItem("experience")} />
    </div>
  );
}
