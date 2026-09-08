"use client";

import { useState } from "react";
import { CloseIcon, DiamondIcon } from "@/components/icons";

export interface CustomSectionConfigResult {
  icon?: string;
  showDate?: boolean;
}

export interface CustomSectionConfigModalProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onAdd: (options: CustomSectionConfigResult) => void;
}

/**
 * "Custom section" configuration step (design reference: user-provided
 * screenshot): lets the user pick which fields a custom section's entries
 * should have (Title/Description are always on; Date and Icon are optional),
 * with a live mini preview.
 */
export function CustomSectionConfigModal({
  open,
  onClose,
  onBack,
  onAdd,
}: CustomSectionConfigModalProps) {
  const [showDate, setShowDate] = useState(false);
  const [showIcon, setShowIcon] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        {onBack && (
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="absolute left-4 top-4 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            &larr;
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <h2 className="text-center text-2xl font-bold text-gray-900">Custom section</h2>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Live preview */}
          <div className="rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2">
              {showIcon && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <DiamondIcon className="h-3.5 w-3.5" />
                </span>
              )}
              <div className="border-b-2 border-blue-600 pb-0.5 text-sm font-bold uppercase tracking-wide text-blue-600">
                Section Title
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-blue-600 underline">Title</span>
              {showDate && <span className="text-xs text-gray-400">Date period</span>}
            </div>
            <p className="mt-1 text-sm text-gray-500">Description</p>
          </div>

          {/* Field toggles */}
          <div>
            <p className="text-sm font-medium text-gray-700">What should this section have?</p>
            <div className="mt-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" checked disabled className="h-4 w-4 accent-emerald-500" />
                Title
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" checked disabled className="h-4 w-4 accent-emerald-500" />
                Description
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => setShowDate(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Date
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showIcon}
                  onChange={(e) => setShowIcon(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Icon
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              onAdd({ icon: showIcon ? "diamond" : "", showDate });
              onClose();
            }}
            className="rounded-full bg-indigo-500 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-400"
          >
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
}
