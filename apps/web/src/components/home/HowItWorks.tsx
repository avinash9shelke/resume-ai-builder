import type { TemplateKey } from "@resume-ai/schema";
import { ResumePreview } from "@/components/editor/ResumePreview";
import { createSampleResume } from "@/lib/sampleResume";
import { TEMPLATE_LABELS } from "@/lib/templateLabels";
import {
  AlignJustifyIcon,
  AtSignIcon,
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  ColumnsIcon,
  DiamondIcon,
  LinkIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
} from "@/components/icons";

const PREVIEW_TEMPLATES: TemplateKey[] = ["precision-line", "silver-banner", "cobalt-edge"];

/** Step 1 mockup: template filter pills + a row of real, live-rendered
 * template previews (design reference: screenshot) — showing the actual
 * resume content/layout of each template rather than an abstract swatch. */
function ChooseTemplateVisual() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">All</span>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600">
          <BriefcaseIcon className="h-3.5 w-3.5" />
          Simple
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600">
          <DiamondIcon className="h-3.5 w-3.5" />
          Modern
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600">
          <SparklesIcon className="h-3.5 w-3.5" />
          Bold
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {PREVIEW_TEMPLATES.map((template) => (
          <div key={template} className="flex flex-col overflow-hidden rounded-lg border border-gray-100 shadow-sm">
            <div className="h-32 w-full overflow-hidden bg-white">
              <div style={{ zoom: 0.34 }}>
                <ResumePreview resume={createSampleResume(template)} />
              </div>
            </div>
            <span className="border-t border-gray-100 px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-gray-600">
              {TEMPLATE_LABELS[template]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Step 2 mockup: a pixel-close recreation of the real editor's profile
 * header (design reference: screenshot) — see
 * apps/web/src/components/editor/ProfileCard.tsx — with its hover-only
 * camera/settings actions pinned visible, the name/headline/contact row,
 * and the Summary field with its AI Polish sparkles button. Local to this
 * step only; not a shared/reusable component. */
function AddExperienceVisual() {
  return (
    <div className="relative rounded-2xl border-2 border-blue-400 bg-white p-5 shadow-lg">
      <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-100 bg-white px-2 py-1.5 shadow-md">
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500">
          <CameraIcon className="h-3.5 w-3.5" />
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-gray-500">
          <SettingsIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold text-purple-900">AVINASH SHELKE</p>
          <p className="mt-0.5 text-sm font-medium text-gray-300">🚀 Your headline, e.g. Staff Software Engineer</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <AtSignIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              avinashe107@gmail.com
            </span>
            <span className="flex items-center gap-1 text-gray-300">
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              yourwebsite.com
            </span>
          </div>
          <div className="mt-1 flex items-center gap-x-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              Pune, MH 412105
            </span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 text-gray-300">
              <PlusIcon className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-400">
          Add photo
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Summary</p>
          <SparklesIcon className="h-3.5 w-3.5 text-violet-500" />
        </div>
        <p className="rounded-md border border-gray-100 px-2.5 py-2 text-[11px] leading-relaxed text-gray-600">
          Staff Software Engineer with 11+ years of experience designing and delivering scalable,
          high-performance applications across Ed-Tech, Media, and Banking domains. Expertise in Java,
          Spring Boot, Microservices, Event-Driven Architecture, and AWS Cloud Services.
        </p>
      </div>
    </div>
  );
}

/** Step 3 mockup: the editor's real "Layout" popover (design reference:
 * screenshot) — Columns (One/Two), Font Size (slider + steppers), and
 * Subtitle style (Normal/Bold/Italic), each in its own nested card, matching
 * apps/web/src/components/editor/LayoutControls.tsx pixel-for-pixel. */
function CustomizeLayoutVisual() {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 shadow-lg ring-1 ring-gray-200">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-900">Columns</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <span className="flex flex-col items-center gap-2 rounded-lg border-2 border-blue-600 bg-blue-50 py-3 text-xs font-semibold text-blue-700">
            <AlignJustifyIcon className="h-5 w-5" />
            One
          </span>
          <span className="flex flex-col items-center gap-2 rounded-lg border-2 border-gray-200 py-3 text-xs font-semibold text-gray-500">
            <ColumnsIcon className="h-5 w-5" />
            Two
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">Font Size</p>
          <span className="text-xs font-semibold text-gray-500">11pt</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600">
            <MinusIcon className="h-3.5 w-3.5" />
          </span>
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div className="relative h-full w-1/2 rounded-full bg-blue-600">
              <span className="absolute -right-1.5 -top-[3px] h-3 w-3 rounded-full bg-blue-600" />
            </div>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600">
            <PlusIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-900">Subtitle style</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <span className="rounded-lg border-2 border-blue-600 bg-blue-50 py-2 text-center text-xs text-blue-700">
            Normal
          </span>
          <span className="rounded-lg border-2 border-gray-200 py-2 text-center text-xs font-bold text-gray-500">
            Bold
          </span>
          <span className="rounded-lg border-2 border-gray-200 py-2 text-center text-xs italic text-gray-500">
            Italic
          </span>
        </div>
      </div>
    </div>
  );
}

/** Step 4 mockup: a fanned stack of resume pages, each showing real
 * resume-like content (name, headline, contact row, section bars) rather
 * than abstract lines, with a floating success toast overlapping the
 * bottom-left corner (design reference: screenshot). */
function DownloadPdfVisual() {
  return (
    <div className="relative pb-8">
      <div className="relative flex h-52 items-center justify-center">
        {/* Back page: plain text lines peeking out. */}
        <div
          className="absolute h-44 w-32 rounded-lg border border-gray-200 bg-white p-3 shadow-md"
          style={{ transform: "rotate(-14deg) translateX(-52px)", zIndex: 0 }}
        >
          <div className="space-y-1.5">
            <div className="h-1.5 w-3/4 rounded bg-gray-300" />
            <div className="h-1.5 w-1/2 rounded bg-gray-200" />
          </div>
          <div className="mt-3 space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-1 w-full rounded bg-gray-100" />
            ))}
          </div>
        </div>

        {/* Middle page: name + photo + contact row. */}
        <div
          className="absolute h-44 w-32 rounded-lg border border-gray-200 bg-white p-3 shadow-md"
          style={{ transform: "rotate(11deg) translateX(48px)", zIndex: 1 }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 shrink-0 rounded-full bg-blue-100" />
            <div className="space-y-1">
              <div className="h-1.5 w-14 rounded bg-gray-300" />
              <div className="h-1 w-10 rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-1 w-full rounded bg-gray-100" />
            ))}
          </div>
        </div>

        {/* Front page: full header + section bars, matching our real resume style. */}
        <div
          className="absolute h-48 w-36 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
          style={{ transform: "rotate(-2deg)", zIndex: 2 }}
        >
          <p className="text-[11px] font-extrabold text-gray-900">Alex Morgan</p>
          <p className="mt-0.5 text-[8px] font-medium text-blue-600">Product Designer</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="h-1 w-8 rounded-full bg-gray-200" />
            <span className="h-1 w-6 rounded-full bg-gray-200" />
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="h-1.5 w-1/3 rounded bg-blue-200" />
            <div className="h-1 w-full rounded bg-gray-100" />
            <div className="h-1 w-full rounded bg-gray-100" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-1/3 rounded bg-blue-200" />
            <div className="h-1 w-full rounded bg-gray-100" />
            <div className="h-1 w-2/3 rounded bg-gray-100" />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-3 left-6 right-6 flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-xl">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-bold text-gray-900">Resume successfully downloaded</span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    number: 1,
    title: "Choose a template",
    description:
      "Pick from a range of professionally designed templates, or start from a blank canvas — you can always switch later.",
    visual: ChooseTemplateVisual,
  },
  {
    number: 2,
    title: "Add your experience",
    description:
      "Fill in your details section by section. Already have a resume? Upload it and let AI extract everything for you.",
    visual: AddExperienceVisual,
  },
  {
    number: 3,
    title: "Customize layout & design",
    description:
      "Switch between 1- and 2-column layouts, adjust colors and fonts, and watch your resume update in real time.",
    visual: CustomizeLayoutVisual,
  },
  {
    number: 4,
    title: "Download unlimited PDFs",
    description:
      "Your draft is saved automatically. Export a pixel-perfect PDF anytime, make changes, and download again for free.",
    visual: DownloadPdfVisual,
  },
];

/** "How it works" step-by-step walkthrough (design reference: screenshot) —
 * each step pairs a mockup of the actual editor experience with a short
 * explanation, reusing our own brand colors/content rather than the
 * reference's. */
export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">How it works</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Build your resume in four simple steps
        </h2>
      </div>

      <div className="mt-16 flex flex-col gap-16">
        {STEPS.map((step) => (
          <div key={step.number} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-6">
              <step.visual />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {step.number}. {step.title}
              </h3>
              <p className="mt-3 max-w-md text-base text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
