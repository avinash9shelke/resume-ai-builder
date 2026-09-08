"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateKey } from "@resume-ai/schema";
import { ResumePreview } from "@/components/editor/ResumePreview";
import { createSampleResume } from "@/lib/sampleResume";
import { TemplatePreviewModal } from "@/components/onboarding/TemplatePreviewModal";

const CAROUSEL_TEMPLATES: TemplateKey[] = [
  "atlantic-blue",
  "precision-line",
  "cobalt-edge",
  "silver-banner",
  "true-blue",
  "hunter-green",
  "obsidian-edge",
  "quicksilver",
];

const SLIDE_INTERVAL_MS = 3000;
const CARD_SPACING_PX = 260;

/**
 * Auto-advancing template showcase (design reference: screenshot) — a
 * center-focused slide carousel: the active template's full, live-rendered
 * preview sits large in the middle with a "Start With This Template" CTA,
 * flanked by the neighboring templates scaled down and faded, with dot
 * pagination below (the active dot in purple/indigo). Clicking the CTA
 * opens the same full template-preview popup used in the onboarding flow
 * (design reference: screenshot) rather than jumping straight to /onboarding.
 */
export function TemplateCarousel() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateKey | null>(null);

  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % CAROUSEL_TEMPLATES.length),
      SLIDE_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="overflow-hidden bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Templates</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          A template for every story
        </h2>
      </div>

      <div className="relative mx-auto mt-10 flex h-[420px] max-w-4xl items-center justify-center">
        {CAROUSEL_TEMPLATES.map((template, i) => {
          const total = CAROUSEL_TEMPLATES.length;
          let offset = i - active;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;
          if (Math.abs(offset) > 2) return null;

          const isCenter = offset === 0;

          return (
            <div
              key={template}
              className="absolute transition-all duration-700 ease-out"
              style={{
                transform: `translateX(${offset * CARD_SPACING_PX}px) scale(${isCenter ? 1 : 0.82})`,
                zIndex: 10 - Math.abs(offset),
                opacity: Math.abs(offset) > 1 ? 0 : isCenter ? 1 : 0.5,
              }}
            >
              <div className="relative w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="h-96 w-full overflow-hidden bg-white">
                  <div style={{ zoom: 0.42 }}>
                    <ResumePreview resume={createSampleResume(template)} />
                  </div>
                </div>
                {isCenter && (
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(template)}
                    className="absolute inset-x-4 bottom-4 flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-indigo-700"
                  >
                    Start With This Template
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-1.5">
        {CAROUSEL_TEMPLATES.map((template, i) => (
          <button
            key={template}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all ${
              i === active ? "h-2.5 w-2.5 bg-indigo-600" : "h-2 w-2 bg-gray-300 hover:bg-indigo-300"
            }`}
          />
        ))}
      </div>

      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={(template, theme) =>
          router.push(`/onboarding?template=${template}&theme=${theme}`)
        }
      />
    </section>
  );
}
