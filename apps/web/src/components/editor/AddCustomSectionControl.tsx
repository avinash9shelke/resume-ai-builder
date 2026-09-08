"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";
import { AddSectionModal } from "@/components/editor/AddSectionModal";
import { PlusIcon } from "@/components/icons";

/** Opens the "Add a new section" gallery (design reference: user-provided screenshot). */
export function AddCustomSectionControl() {
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 self-start rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        <PlusIcon className="h-4 w-4" />
        Add New Section
      </button>

      <AddSectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(title, options) => addCustomSection(title, options)}
      />
    </>
  );
}
