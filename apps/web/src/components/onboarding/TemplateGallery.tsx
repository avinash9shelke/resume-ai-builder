"use client";

import { useState } from "react";
import { TEMPLATE_KEYS, type TemplateKey } from "@resume-ai/schema";
import { ResumePreview } from "@/components/editor/ResumePreview";
import { createSampleResume } from "@/lib/sampleResume";
import { TEMPLATE_LABELS } from "@/lib/templateLabels";
import { BriefcaseIcon, DiamondIcon, SparklesIcon } from "@/components/icons";

export interface TemplateGalleryProps {
  onSelect: (template: TemplateKey) => void;
}

type Category = "all" | "simple" | "modern" | "bold";

const CATEGORY_FILTERS: { key: Category; label: string; icon?: typeof BriefcaseIcon }[] = [
  { key: "all", label: "All" },
  { key: "simple", label: "Simple", icon: BriefcaseIcon },
  { key: "modern", label: "Modern", icon: DiamondIcon },
  { key: "bold", label: "Bold", icon: SparklesIcon },
];

/** Buckets each of our 20 real templates into a category for the filter pills
 * (design reference: screenshot) — clean/minimal single-column layouts read
 * as "Simple", colorful contemporary sidebars as "Modern", and high-contrast
 * banner/graphic designs as "Bold". */
const TEMPLATE_CATEGORIES: Record<TemplateKey, Exclude<Category, "all">> = {
  "classic-serif": "simple",
  "classic-clear": "simple",
  "precision-line": "simple",
  "steady-form": "simple",
  "editorial-rule": "simple",
  "meridian-slate": "simple",
  "dual-grid": "simple",
  refined: "modern",
  "cobalt-edge": "modern",
  "atlantic-blue": "modern",
  "true-blue": "modern",
  quicksilver: "modern",
  "teal-outline": "modern",
  "teal-portrait": "modern",
  "obsidian-edge": "bold",
  "silver-banner": "bold",
  "saffron-line": "bold",
  "hunter-green": "bold",
  "mercury-flow": "bold",
  "azure-banner": "bold",
};

/** Compact template card — fits a real, live-rendered mini preview of the
 * template (cropped to its top portion, like a peek through a window) into
 * the deck's compact card format, so users can see each template's actual
 * layout and colors rather than an abstract placeholder. Clicking opens the
 * full live-preview via the parent's onSelect. */
function TemplateCard({ template, onSelect }: { template: TemplateKey; onSelect: (template: TemplateKey) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="h-96 w-full overflow-hidden bg-white">
        <div style={{ zoom: 1.1 }}>
          <ResumePreview resume={createSampleResume(template)} />
        </div>
      </div>
      <span className="border-t border-gray-100 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-gray-600 group-hover:text-gray-900">
        {TEMPLATE_LABELS[template]}
      </span>
    </button>
  );
}

/**
 * Template picker (design reference: screenshot) — a white card housing
 * category filter pills (All / Simple / Modern / Bold) above a grid of
 * compact template cards. Clicking a card opens the larger
 * TemplatePreviewModal (with the real live preview) via the parent's onSelect.
 */
export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const [category, setCategory] = useState<Category>("all");
  const templates = TEMPLATE_KEYS.filter(
    (template) => category === "all" || TEMPLATE_CATEGORIES[template] === category,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-center text-sm font-semibold uppercase tracking-wide text-blue-600">
        Choose your template
      </p>
      <h1 className="mt-3 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Please select a template for your resume.
        <br />
        You can always change it later.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600">
        Yes, modern ATS systems do read double column templates and do not care at all if you use colors.
        Recruiters do appreciate readability and one-page resumes, though.
      </p>

      <div className="mx-auto mt-10 max-w-6xl rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((filter) => {
            const active = category === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setCategory(filter.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {filter.icon && <filter.icon className="h-4 w-4" />}
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {templates.map((template) => (
            <TemplateCard key={template} template={template} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
