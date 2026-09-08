"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import { CustomSectionConfigModal } from "@/components/editor/CustomSectionConfigModal";
import {
  AtSignIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  CloseIcon,
  GlobeIcon,
  HeartIcon,
  QuoteIcon,
  StarIcon,
  TagIcon,
  ZapIcon,
} from "@/components/icons";

interface PreviewEntry {
  heading: string;
  description: string;
}

interface SectionTemplate {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Icon key persisted on the created CustomSection (see packages/resume-schema). */
  sectionIcon?: string;
  /** Optional example entries shown in the hover preview (design reference: screenshot).
   * Every template shows the hover preview + "Add to Resume" CTA regardless of whether
   * it has example entries — only the example-content portion of the preview is optional. */
  previewEntries?: PreviewEntry[];
  /** When true, clicking this card opens the field-configuration step instead of creating immediately (design reference: screenshot). */
  configurable?: boolean;
}

const STRENGTHS_PREVIEW: PreviewEntry[] = [
  {
    heading: "Go-getter",
    description: "20+ recognitions have taught me that with persistence, one can achieve anything.",
  },
  {
    heading: "Go-getter",
    description: "20+ recognitions have taught me that with persistence, one can achieve anything.",
  },
];

/**
 * Gallery of section templates (design reference: user-provided screenshot).
 * Most options create a new custom section pre-titled accordingly — the app
 * doesn't have bespoke layouts per template (pie charts, skill bars, etc.),
 * so every option renders through the same custom-section editor/preview.
 * Every card shows an "Add to Resume" hover CTA (see `hovered` state below);
 * "Strengths" additionally ships example entries shown in that preview.
 */
const SECTION_TEMPLATES: SectionTemplate[] = [
  { title: "Custom", icon: TagIcon, configurable: true },
  { title: "Key Achievements", icon: StarIcon },
  { title: "Strengths", icon: ZapIcon, sectionIcon: "diamond", previewEntries: STRENGTHS_PREVIEW },
  { title: "Volunteering", icon: HeartIcon },
  { title: "Industry Expertise", icon: BriefcaseIcon },
  { title: "Interests", icon: HeartIcon },
  { title: "My Time", icon: ClockIcon },
  { title: "Find Me Online", icon: GlobeIcon },
  { title: "Certifications", icon: CalendarIcon },
  { title: "Awards", icon: StarIcon },
  { title: "References", icon: AtSignIcon },
  { title: "My Life Philosophy", icon: QuoteIcon },
  { title: "Publications", icon: BookOpenIcon },
  { title: "Books", icon: BookOpenIcon },
  { title: "Additional Experience", icon: BriefcaseIcon },
  { title: "Additional Skills", icon: ZapIcon },
  { title: "Additional Publications", icon: BookOpenIcon },
  { title: "Custom Title", icon: TagIcon },
];

export interface AddSectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (
    title: string,
    options?: {
      icon?: string;
      showDate?: boolean;
      seedItems?: Array<{ heading: string; description: string }>;
    },
  ) => void;
}

export function AddSectionModal({ open, onClose, onSelect }: AddSectionModalProps) {
  const [hovered, setHovered] = useState<SectionTemplate | null>(null);
  const [configuring, setConfiguring] = useState<SectionTemplate | null>(null);

  if (!open) return null;

  function handleSelect(template: SectionTemplate) {
    if (template.configurable) {
      setConfiguring(template);
      return;
    }
    onSelect(template.title, { icon: template.sectionIcon, seedItems: template.previewEntries });
    onClose();
  }

  if (configuring) {
    return (
      <CustomSectionConfigModal
        open
        onClose={() => {
          setConfiguring(null);
          onClose();
        }}
        onBack={() => setConfiguring(null)}
        onAdd={(options) =>
          onSelect(configuring.title, { ...options, seedItems: [{ heading: "", description: "" }] })
        }
      />
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add a new section</h2>
            <p className="mt-1 text-sm text-gray-500">Click on a section to add it to your resume</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SECTION_TEMPLATES.map((template) => (
            <div
              key={template.title}
              className="relative"
              onMouseEnter={() => setHovered(template)}
              onMouseLeave={() => setHovered((h) => (h?.title === template.title ? null : h))}
            >
              <button
                type="button"
                onClick={() => handleSelect(template)}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 text-center hover:border-blue-300 hover:bg-blue-50/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <template.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-gray-700">{template.title}</span>
              </button>

              {/* Hover preview + CTA, scoped to this card only — stays inside the
                  hovered section's own container and disappears once the cursor
                  moves outside it, rather than overlaying the whole gallery. */}
              {hovered?.title === template.title && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-slate-500/95 p-2 text-center shadow-2xl">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-white/90">
                    {template.title}
                  </h3>
                  {template.previewEntries && template.previewEntries.length > 0 && (
                    <div className="flex w-full flex-col gap-1 px-1">
                      {template.previewEntries.slice(0, 1).map((entry, i) => (
                        <div key={i} className="text-[10px] leading-tight text-white/70">
                          {entry.description}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelect(template)}
                    className="mt-1 rounded-full bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-400"
                  >
                    Add to Resume
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
