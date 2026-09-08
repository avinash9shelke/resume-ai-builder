import { FeatureCard } from "@/components/home/FeatureCard";
import {
  AlertTriangleIcon,
  BoldIcon,
  ChevronRightIcon,
  ColumnsIcon,
  FileIcon,
  GaugeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  SparklesIcon,
  TypeIcon,
  UnderlineIcon,
  UploadIcon,
  ZapIcon,
} from "@/components/icons";

/** "Resume Builder" mockup: a resume card, a floating resume-score badge, and a rich-text toolbar. */
function ResumeBuilderVisual() {
  return (
    <>
      <div className="absolute left-1/2 top-2 w-52 -translate-x-1/2 rounded-lg bg-white p-3 shadow-lg">
        <p className="text-sm font-bold text-gray-900">Chloé Anne Bouchard</p>
        <div className="mt-2 space-y-1">
          <div className="h-1.5 w-full rounded bg-gray-100" />
          <div className="h-1.5 w-4/5 rounded bg-gray-100" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded bg-gray-100" />
            <div className="h-1.5 w-3/4 rounded bg-gray-100" />
            <div className="h-1.5 w-full rounded bg-gray-100" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded bg-gray-100" />
            <div className="h-1.5 w-3/4 rounded bg-gray-100" />
            <div className="h-1.5 w-full rounded bg-gray-100" />
          </div>
        </div>
      </div>
      <div className="absolute right-1 top-16 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
          81%
        </span>
        <div>
          <p className="text-xs font-semibold text-gray-900">Resume Score</p>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-gray-500 shadow-xl">
        <BoldIcon className="h-4 w-4" />
        <ItalicIcon className="h-4 w-4" />
        <UnderlineIcon className="h-4 w-4" />
        <span className="h-4 w-px bg-gray-200" />
        <ListIcon className="h-4 w-4" />
        <LinkIcon className="h-4 w-4" />
      </div>
    </>
  );
}

/** "AI Polish" mockup: a paragraph with a floating AI-rewrite suggestion bubble. */
function AiPolishVisual() {
  return (
    <>
      <div className="absolute left-1/2 top-0 w-60 -translate-x-1/2 rounded-lg bg-white p-3.5 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Your bullet</p>
        <p className="mt-1.5 text-xs text-gray-400 line-through decoration-gray-300">
          Worked on outreach campaigns and helped increase leads.
        </p>
      </div>

      <span className="absolute left-1/2 top-[68px] flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-violet-600 shadow-md">
        <ChevronRightIcon className="h-4 w-4 rotate-90 text-white" />
      </span>

      <div className="absolute bottom-2 left-1/2 w-64 -translate-x-1/2 rounded-xl border border-violet-100 bg-white p-3 shadow-xl">
        <div className="flex items-center gap-1.5 text-violet-600">
          <SparklesIcon className="h-4 w-4" />
          <span className="text-xs font-bold">AI Suggestion</span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-gray-700">
          &ldquo;Drove a 32% increase in qualified pipeline through targeted outreach.&rdquo;
        </p>
        <div className="mt-2 flex justify-end gap-1.5">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
            Skip
          </span>
          <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            Use this
          </span>
        </div>
      </div>
    </>
  );
}

/** "Flexible Layouts" mockup: draggable columns with a 1/2-column toggle. */
function FlexibleLayoutsVisual() {
  return (
    <>
      <div className="absolute left-1/2 top-2 flex w-56 -translate-x-1/2 gap-2.5 rounded-lg bg-white p-3 shadow-lg">
        <div className="flex-1 space-y-1.5 rounded bg-emerald-50 p-2">
          <div className="h-1.5 w-full rounded bg-emerald-200/70" />
          <div className="h-1.5 w-3/4 rounded bg-emerald-200/70" />
          <div className="h-1.5 w-full rounded bg-emerald-200/70" />
        </div>
        <div className="flex-1 space-y-1.5 rounded bg-gray-50 p-2">
          <div className="h-1.5 w-full rounded bg-gray-200" />
          <div className="h-1.5 w-3/4 rounded bg-gray-200" />
          <div className="h-1.5 w-full rounded bg-gray-200" />
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white p-1 shadow-xl">
        <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500">
          1-column
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
          <ColumnsIcon className="h-3.5 w-3.5" />
          2-column
        </span>
      </div>
    </>
  );
}

/** "AI Assistance" mockup: an upload dropzone extracting details from an
 * uploaded resume (icon + loader use the same purple/indigo #4F46E5 hue as
 * the real onboarding loader — see ProcessingOptionModal.tsx). */
function AiAssistanceVisual() {
  return (
    <>
      <div className="absolute left-1/2 top-4 flex w-44 -translate-x-1/2 flex-col items-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-white p-5 shadow-lg">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <UploadIcon className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FileIcon className="h-3.5 w-3.5" />
          resume.pdf
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 flex w-60 -translate-x-1/2 items-center gap-2.5 rounded-xl bg-white p-3 shadow-xl">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <ZapIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900">Extracting your experience...</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-4/5 rounded-full bg-indigo-600" />
          </div>
        </div>
      </div>
    </>
  );
}

/** "ATS Score" mockup: a score badge + a couple of flagged category cards,
 * matching the real ATS Score panel (design reference: screenshot) shown in
 * the editor (see apps/web/src/components/editor/AtsScorePanel.tsx). */
function AtsScoreVisual() {
  return (
    <>
      <div className="absolute left-1/2 top-0 flex w-72 -translate-x-1/2 items-center gap-4 rounded-xl bg-white p-4 shadow-lg">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-red-200 text-lg font-bold text-red-600">
          44
        </span>
        <p className="text-xs font-semibold text-gray-700">
          Your resume needs work to pass ATS screening.
        </p>
      </div>
      <div className="absolute bottom-0 left-1/2 w-72 -translate-x-1/2 space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2 shadow-md">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <AlertTriangleIcon className="h-3.5 w-3.5 text-indigo-600" />
            Contact Information
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">50</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-red-100 bg-white px-3 py-2 shadow-md">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <AlertTriangleIcon className="h-3.5 w-3.5 text-indigo-600" />
            Professional Summary
          </span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">0</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2 shadow-md">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <AlertTriangleIcon className="h-3.5 w-3.5 text-indigo-600" />
            Experience &amp; Impact
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">24</span>
        </div>
      </div>
    </>
  );
}

const FEATURES = [
  {
    title: "Resume Builder",
    description:
      "Build the resume that gets you hired. Editable sections for Basics, Experience, Education, Skills, and more — with a real-time preview as you type.",
    icon: TypeIcon,
    bgClass: "bg-blue-50",
    badgeBgClass: "bg-white",
    iconClass: "text-blue-600",
    visual: ResumeBuilderVisual,
  },
  {
    title: "AI Polish",
    description:
      "Get 5 AI-generated variations for any summary or bullet point, then preview, replace, or discard each suggestion in one click.",
    icon: SparklesIcon,
    bgClass: "bg-violet-50",
    badgeBgClass: "bg-white",
    iconClass: "text-violet-600",
    visual: AiPolishVisual,
  },
  {
    title: "Flexible Layouts",
    description:
      "Drag and drop sections, switch between 1- and 2-column layouts, and manage your profile photo — all without touching your content.",
    icon: ColumnsIcon,
    bgClass: "bg-emerald-50",
    badgeBgClass: "bg-white",
    iconClass: "text-emerald-600",
    visual: FlexibleLayoutsVisual,
  },
  {
    title: "AI Assistance",
    description:
      "Upload an existing resume and let AI extract and structure your experience automatically, so you never start from a blank page.",
    icon: ZapIcon,
    bgClass: "bg-indigo-50",
    badgeBgClass: "bg-white",
    iconClass: "text-indigo-600",
    visual: AiAssistanceVisual,
  },
  {
    title: "ATS Score",
    description:
      "Check how your resume scores against real ATS screening criteria — contact info, summary, experience impact, skills, education, and length — with actionable fixes for every flagged category.",
    icon: GaugeIcon,
    bgClass: "bg-indigo-50",
    badgeBgClass: "bg-white",
    iconClass: "text-indigo-600",
    visual: AtsScoreVisual,
    fullWidth: true,
  },
];

export function FeatureHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            bgClass={feature.bgClass}
            badgeBgClass={feature.badgeBgClass}
            iconClass={feature.iconClass}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            className={feature.fullWidth ? "lg:col-span-2" : undefined}
          >
            <feature.visual />
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}
