"use client";

import { useState } from "react";
import type { SubtitleStyle } from "@resume-ai/schema";
import { useResumeStore } from "@/lib/store";
import { AlignJustifyIcon, ColumnsIcon, MinusIcon, PlusIcon, SettingsIcon } from "@/components/icons";

const COLUMN_OPTIONS: { value: 1 | 2; label: string; icon: typeof ColumnsIcon }[] = [
  { value: 1, label: "One", icon: AlignJustifyIcon },
  { value: 2, label: "Two", icon: ColumnsIcon },
];

const SUBTITLE_OPTIONS: { value: SubtitleStyle; label: string; className: string }[] = [
  { value: "normal", label: "Normal", className: "" },
  { value: "bold", label: "Bold", className: "font-bold" },
  { value: "italic", label: "Italic", className: "italic" },
];

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 14;
const FONT_SIZE_STEP = 0.5;

/**
 * Layout panel (design reference: screenshot) — a "Layout" trigger button
 * opens a popover with Columns (One/Two), Font Size (slider + steppers), and
 * Subtitle style (Normal/Bold/Italic) controls, each in its own card. All
 * three are wired to `resume.metadata.layout`/`typography` and reflected
 * live in both the editor preview and the exported PDF.
 */
export function LayoutControls() {
  const [open, setOpen] = useState(false);
  const columns = useResumeStore((s) => s.resume.metadata.layout.columns);
  const typography = useResumeStore((s) => s.resume.metadata.typography);
  const setColumns = useResumeStore((s) => s.setColumns);
  const updateTypography = useResumeStore((s) => s.updateTypography);

  const fontSize = typography.fontSize;

  function clampFontSize(value: number) {
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <SettingsIcon className="h-4 w-4" />
        Layout
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl bg-gray-50 p-4 shadow-xl ring-1 ring-gray-200">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900">Columns</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {COLUMN_OPTIONS.map((option) => {
                  const active = columns === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setColumns(option.value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 py-3 text-xs font-semibold transition-colors ${
                        active
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <option.icon className="h-5 w-5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Font Size</p>
                <span className="text-xs font-semibold text-gray-500">{fontSize}pt</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease font size"
                  onClick={() => updateTypography({ fontSize: clampFontSize(fontSize - FONT_SIZE_STEP) })}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <input
                  type="range"
                  min={MIN_FONT_SIZE}
                  max={MAX_FONT_SIZE}
                  step={FONT_SIZE_STEP}
                  value={fontSize}
                  onChange={(e) => updateTypography({ fontSize: clampFontSize(Number(e.target.value)) })}
                  className="h-1.5 flex-1 accent-blue-600"
                />
                <button
                  type="button"
                  aria-label="Increase font size"
                  onClick={() => updateTypography({ fontSize: clampFontSize(fontSize + FONT_SIZE_STEP) })}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900">Subtitle style</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {SUBTITLE_OPTIONS.map((option) => {
                  const active = typography.subtitleStyle === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateTypography({ subtitleStyle: option.value })}
                      className={`rounded-lg border-2 py-2 text-xs transition-colors ${option.className} ${
                        active
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
