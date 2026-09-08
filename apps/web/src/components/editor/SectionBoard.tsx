"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { isCustomSectionId, type BuiltInSectionId, type SectionId } from "@resume-ai/schema";
import { useResumeStore } from "@/lib/store";
import { getColumnSections, getSectionLabel } from "@/lib/layout";
import { DRAGGABLE_SECTION_COMPONENTS } from "@/components/editor/sections";
import { CustomSectionCard } from "@/components/editor/CustomSectionCard";
import { AddCustomSectionControl } from "@/components/editor/AddCustomSectionControl";
import { TrashIcon } from "@/components/icons";

function SortableSectionCard({ id }: { id: SectionId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const resume = useResumeStore((s) => s.resume);
  const removeCustomSection = useResumeStore((s) => s.removeCustomSection);
  const atsHighlightedSections = useResumeStore((s) => s.atsHighlightedSections);
  const isCustom = isCustomSectionId(id);
  const SectionComponent = isCustom ? null : DRAGGABLE_SECTION_COMPONENTS[id as BuiltInSectionId];
  const label = getSectionLabel(id, resume);
  const isFlagged = atsHighlightedSections.includes(id);

  return (
    <div
      ref={setNodeRef}
      id={`section-${id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-white p-4 shadow-sm ${isDragging ? "opacity-50" : ""} ${
        isFlagged ? "border-amber-300 ring-2 ring-amber-300" : "border-gray-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab select-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
            aria-label={`Drag ${label}`}
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{label}</h3>
        </div>
        {isCustom && (
          <button
            type="button"
            aria-label="Remove section"
            title="Remove section"
            onClick={() => removeCustomSection(id)}
            className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {isCustom ? <CustomSectionCard sectionId={id} /> : SectionComponent ? <SectionComponent /> : null}
    </div>
  );
}

function DroppableColumn({
  id,
  sectionIds,
}: {
  id: string;
  sectionIds: SectionId[];
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex min-h-[120px] flex-col gap-4">
      <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
        {sectionIds.map((id) => (
          <SortableSectionCard key={id} id={id} />
        ))}
      </SortableContext>
      {sectionIds.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
          Drop a section here
        </div>
      )}
    </div>
  );
}

/** Feature 5: Layout & Drag-and-Drop across 1- or 2-column layouts. */
export function SectionBoard() {
  const resume = useResumeStore((s) => s.resume);
  const moveSection = useResumeStore((s) => s.moveSection);
  const columnItems = getColumnSections(resume);
  const [activeId, setActiveId] = useState<SectionId | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as SectionId);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as SectionId;
    const overId = String(over.id);

    if (overId.startsWith("column-")) {
      const targetColumn = Number(overId.replace("column-", ""));
      moveSection(activeId, targetColumn, columnItems[targetColumn]?.length ?? 0);
      return;
    }

    const overSectionId = overId as SectionId;
    const targetColumn = columnItems.findIndex((col) => col.includes(overSectionId));
    if (targetColumn === -1) return;
    const targetIndex = columnItems[targetColumn].indexOf(overSectionId);
    moveSection(activeId, targetColumn, targetIndex);
  }

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`grid gap-4 ${columnItems.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
          {columnItems.map((sectionIds, columnIndex) => (
            <DroppableColumn key={columnIndex} id={`column-${columnIndex}`} sectionIds={sectionIds} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg border border-blue-300 bg-white p-4 shadow-lg">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                {getSectionLabel(activeId, resume)}
              </h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <AddCustomSectionControl />
    </div>
  );
}
