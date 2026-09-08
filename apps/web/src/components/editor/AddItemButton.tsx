"use client";

import { PlusIcon } from "@/components/icons";

export interface AddItemButtonProps {
  label: string;
  onClick: () => void;
}

/** Icon-only "add item" button (design reference: plus-circle button, no text label). */
export function AddItemButton({ label, onClick }: AddItemButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center self-start rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500"
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  );
}
