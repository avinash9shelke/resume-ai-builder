"use client";

import { TextField } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { ItemCard } from "@/components/editor/ItemCard";
import { AddItemButton } from "@/components/editor/AddItemButton";

export function EducationSection() {
  const items = useResumeStore((s) => s.resume.sections.education.items);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          title={item.school || "New institution"}
          onRemove={() => removeItem("education", item.id)}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="School"
              value={item.school}
              onChange={(e) => updateItem("education", item.id, { school: e.target.value })}
            />
            <TextField
              label="Degree"
              placeholder="e.g. Bachelor's"
              value={item.degree}
              onChange={(e) => updateItem("education", item.id, { degree: e.target.value })}
            />
            <TextField
              label="Area"
              placeholder="e.g. Computer Science"
              value={item.area}
              onChange={(e) => updateItem("education", item.id, { area: e.target.value })}
            />
            <TextField
              label="Grade / GPA"
              value={item.grade}
              onChange={(e) => updateItem("education", item.id, { grade: e.target.value })}
            />
            <TextField
              label="Location"
              value={item.location}
              onChange={(e) => updateItem("education", item.id, { location: e.target.value })}
            />
            <TextField
              label="Period"
              placeholder="e.g. 2016 - 2020"
              value={item.period}
              onChange={(e) => updateItem("education", item.id, { period: e.target.value })}
            />
          </div>
        </ItemCard>
      ))}
      <AddItemButton label="Add education" onClick={() => addItem("education")} />
    </div>
  );
}
