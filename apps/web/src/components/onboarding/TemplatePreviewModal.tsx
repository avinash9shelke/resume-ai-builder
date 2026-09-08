"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME_BY_TEMPLATE, THEME_PRESETS, type TemplateKey } from "@resume-ai/schema";
import { ResumePreview } from "@/components/editor/ResumePreview";
import { createSampleResume } from "@/lib/sampleResume";
import { TEMPLATE_LABELS } from "@/lib/templateLabels";
import { CheckIcon, CloseIcon } from "@/components/icons";

export interface TemplatePreviewModalProps {
  template: TemplateKey | null;
  onClose: () => void;
  onUseTemplate: (template: TemplateKey, theme: string) => void;
}

const FEATURES = [
  "A4 / US-Letter size",
  "Editable rich-text sections",
  "Fully customizable color theme",
  "Print-ready, ATS-friendly format",
  "Export to PDF anytime",
];

/**
 * Full-size preview of the selected template (design reference: screenshot)
 * — the resume preview on the left, template name/description/feature list
 * and the "Proceed" CTA on the right. The color-theme swatch picker is
 * preserved as-is (see THEME_PRESETS) alongside the new layout.
 */
export function TemplatePreviewModal({ template, onClose, onUseTemplate }: TemplatePreviewModalProps) {
  const [theme, setTheme] = useState<string>("classic-blue");

  useEffect(() => {
    if (template) setTheme(DEFAULT_THEME_BY_TEMPLATE[template]);
  }, [template]);

  if (!template) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:flex-row">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex justify-center bg-gray-50 p-8 sm:w-1/2">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 shadow-md">
            <ResumePreview resume={createSampleResume(template, theme)} />
          </div>
        </div>

        <div className="flex w-full flex-col overflow-y-auto p-10 sm:w-1/2">
          <h2 className="text-4xl font-bold uppercase tracking-tight text-gray-900">
            {TEMPLATE_LABELS[template]}
          </h2>
          <p className="mt-4 text-base text-gray-500">
            Each template has been crafted with care to make designing your resume an absolute breeze
            for you.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-base text-gray-700">
                <CheckIcon className="h-5 w-5 shrink-0 text-emerald-500" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Color theme
            </p>
            <div className="flex items-center gap-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  aria-label={preset.label}
                  title={preset.label}
                  onClick={() => setTheme(preset.key)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                    theme === preset.key ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset.colors.primary }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onUseTemplate(template, theme)}
            className="mt-10 w-full rounded-lg bg-gray-900 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-gray-800"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
