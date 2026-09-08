import type { ReactNode } from "react";
import { TrashIcon } from "@/components/icons";

export interface ItemCardProps {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}

export function ItemCard({ title, onRemove, children }: ItemCardProps) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <button
          type="button"
          aria-label="Remove"
          title="Remove"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
