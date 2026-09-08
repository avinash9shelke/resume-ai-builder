"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangleIcon,
  AtSignIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CloudUploadIcon,
  EditIcon,
  FileIcon,
  GaugeIcon,
  MapPinIcon,
  SparklesIcon,
  TypeIcon,
  ZapIcon,
} from "@/components/icons";

const FLIP_INTERVAL_MS = 3500;

/** "Editor" face — a compact recreation of the real editor's profile header
 * (see apps/web/src/components/editor/ProfileCard.tsx and the matching
 * HowItWorks.tsx Step 2 mockup), so this card reads as our actual product
 * rather than a generic illustration. */
function EditorFace() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <p className="text-lg font-extrabold text-purple-900">AVINASH SHELKE</p>
      <p className="mt-0.5 text-xs font-medium text-gray-300">🚀 Your headline, e.g. Staff Software Engineer</p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-600">
        <span className="flex items-center gap-1">
          <AtSignIcon className="h-3 w-3 text-gray-400" />
          avinashe107@gmail.com
        </span>
        <span className="flex items-center gap-1">
          <MapPinIcon className="h-3 w-3 text-gray-400" />
          Pune, MH
        </span>
      </div>
      <div className="mt-4 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Summary</p>
        <div className="mt-1.5 rounded-md border border-gray-100 px-2.5 py-2">
          <p className="text-[10px] leading-relaxed text-gray-600">
            Staff Software Engineer with 11+ years of experience architecting scalable, distributed
            systems across FinTech, E-Commerce, and Ed-Tech.
          </p>
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">Experience</p>
        <div className="mt-1.5 rounded-md border border-gray-100 px-2.5 py-2">
          <p className="text-[10px] font-semibold text-gray-800">Staff Software Engineer · HMH</p>
          <p className="mt-1 text-[10px] leading-relaxed text-gray-600">
            Architected and built the HMH Coachly platform from the ground up using cloud-native,
            event-driven microservices on AWS.
          </p>
        </div>
      </div>
    </div>
  );
}

/** "Upload Resume" face — mirrors the real onboarding import-options list
 * (see apps/web/src/components/onboarding/UploadStep.tsx). */
function UploadResumeFace() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <p className="text-sm font-bold text-gray-900">Add Your Resume</p>
      <div className="mt-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-3 rounded-xl border-2 border-indigo-600 bg-indigo-50/60 p-3">
          <CloudUploadIcon className="h-5 w-5 shrink-0 text-indigo-600" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900">Upload Resume</span>
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                Recommended
              </span>
            </div>
            <p className="text-[10px] text-gray-500">PDF, DOC, DOCX up to 10MB</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <ClipboardIcon className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-gray-900">Paste Text</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <EditIcon className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-gray-900">Start From Scratch</span>
        </div>
      </div>
    </div>
  );
}

/** ATS category sample data (design reference: real scoring copy from
 * apps/ats-service/app/scoring.py) — label, score, badge color, and the
 * actual short feedback message the real ATS Score panel would show. */
const ATS_SAMPLE_CATEGORIES = [
  {
    label: "Contact Information",
    score: 50,
    badge: "bg-amber-100 text-amber-700",
    message: "Missing: LinkedIn, Portfolio URL. Add these so recruiters can reach you.",
  },
  {
    label: "Professional Summary",
    score: 0,
    badge: "bg-red-100 text-red-700",
    message: "Add a professional summary — it's often the first thing recruiters scan.",
  },
  {
    label: "Experience & Impact",
    score: 24,
    badge: "bg-amber-100 text-amber-700",
    message: "Some bullets could better highlight quantified, achievement-driven work.",
  },
];

/** "ATS Score" face — mirrors FeatureHighlights.tsx's AtsScoreVisual /
 * apps/web/src/components/editor/AtsScorePanel.tsx, with real sample ATS
 * feedback copy per category instead of just a label and score badge. */
function AtsScoreFace() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-red-200 text-base font-bold text-red-600">
          44
        </span>
        <p className="text-xs font-semibold text-gray-700">Your resume needs work to pass ATS screening.</p>
      </div>
      <div className="mt-4 flex-1 space-y-2">
        {ATS_SAMPLE_CATEGORIES.map((category) => (
          <div key={category.label} className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <AlertTriangleIcon className="h-3.5 w-3.5 text-indigo-600" />
                {category.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${category.badge}`}>
                {category.score}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-gray-500">{category.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "AI Assistance" face — mirrors FeatureHighlights.tsx's AiAssistanceVisual. */
function AiAssistanceFace() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <div className="flex w-40 flex-col items-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <CloudUploadIcon className="h-4 w-4" />
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <FileIcon className="h-3 w-3" />
          resume.pdf
        </div>
      </div>
      <div className="flex w-56 items-center gap-2.5 rounded-xl bg-white p-3 shadow-md">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <ZapIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-900">Extracting your experience...</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-4/5 rounded-full bg-indigo-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** "AI Polish" face — mirrors FeatureHighlights.tsx's AiPolishVisual, using
 * one of Avinash's actual sample-resume bullets (see sampleResume.ts's CGI
 * entry) as the "before" text, for consistency with the other flip cards. */
function AiPolishFace() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Your bullet</p>
        <p className="mt-1.5 text-xs text-gray-400 line-through decoration-gray-300">
          Simplified refund procedures for multiple merchants, enhancing operational efficiency.
        </p>
      </div>
      <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 shadow-md">
        <ChevronRightIcon className="h-4 w-4 rotate-90 text-white" />
      </span>
      <div className="rounded-xl border border-violet-100 bg-white p-3 shadow-md">
        <div className="flex items-center gap-1.5 text-violet-600">
          <SparklesIcon className="h-4 w-4" />
          <span className="text-xs font-bold">AI Suggestion</span>
        </div>
        <p className="mt-1.5 text-xs font-medium text-gray-700">
          &ldquo;Streamlined refund procedures for 50+ merchants, cutting processing time by 35% and
          eliminating manual errors.&rdquo;
        </p>
      </div>
    </div>
  );
}

const CARDS = [
  { title: "Editor", icon: TypeIcon, iconClass: "bg-blue-600", Face: EditorFace },
  { title: "Upload Resume", icon: CloudUploadIcon, iconClass: "bg-indigo-600", Face: UploadResumeFace },
  { title: "ATS Score", icon: GaugeIcon, iconClass: "bg-indigo-600", Face: AtsScoreFace },
  { title: "AI Assistance", icon: ZapIcon, iconClass: "bg-indigo-600", Face: AiAssistanceFace },
  { title: "AI Polish", icon: SparklesIcon, iconClass: "bg-violet-600", Face: AiPolishFace },
];

/**
 * Auto-flipping product showcase (design reference: screenshots) — cycles
 * through our real product panels (Editor, Upload Resume, ATS Score, AI
 * Assistance, AI Polish) one at a time, each face rebuilt from our own
 * existing panel designs (not generic stock mockups) so it reads as our
 * actual product. Two faint stacked cards behind give it the layered-card
 * depth from the reference without needing separate physical cards.
 */
export function ProductFlipCards() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % CARDS.length), FLIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const current = CARDS[index];

  return (
    <div className="rounded-3xl bg-[#F5F6FF] p-10">
      <div className="relative mx-auto h-[420px] w-full max-w-sm" style={{ perspective: "1500px" }}>
        <div className="absolute inset-0 rotate-3 rounded-2xl border border-gray-100 bg-white shadow-md" />
        <div className="absolute inset-0 -rotate-2 rounded-2xl border border-gray-100 bg-white shadow-md" />

        <div
          key={index}
          className="absolute inset-0 animate-card-flip-in"
          style={{ transformStyle: "preserve-3d" }}
        >
          <current.Face />

          <div className="absolute -top-4 left-5 flex items-center gap-2 rounded-full border border-gray-100 bg-white px-3 py-1.5 shadow-md">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${current.iconClass} text-white`}>
              <current.icon className="h-3 w-3" />
            </span>
            <span className="text-xs font-bold text-gray-900">{current.title}</span>
          </div>
        </div>

        <div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-1.5">
          {CARDS.map((card, i) => (
            <span
              key={card.title}
              className={`h-1.5 w-6 rounded-full transition-colors ${i === index ? "bg-gray-900" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
