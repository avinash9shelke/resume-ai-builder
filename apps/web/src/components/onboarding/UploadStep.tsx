"use client";

import { useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CloudUploadIcon,
  EditIcon,
  FileIcon,
  LockIcon,
  UploadIcon,
} from "@/components/icons";

export interface UploadStepProps {
  busy?: boolean;
  onFileSelected: (file: File) => void;
  /** Feature 1 variant: the user pasted their resume as plain text instead of uploading a file. */
  onTextSubmitted: (text: string) => void;
  /** "Start From Scratch" — creates a blank resume and goes straight to the editor, no extra step. */
  onSkip: () => void;
}

type Mode = "upload" | "text" | "scratch";
/** "list" is the "Add Your Resume" import-options card; "paste" is the
 * dedicated full-screen "Paste Your Resume" view (design reference: screenshot). */
type View = "list" | "paste";

const MIN_PASTED_TEXT_LENGTH = 50;
const MAX_PASTED_TEXT_LENGTH = 5000;

/**
 * "Add Your Resume" panel (design reference: screenshot) — a single card
 * listing the three ways to start: upload a file, paste resume text, or
 * start from scratch. "Upload Resume" expands inline into its dropzone;
 * "Paste Text" navigates to a dedicated full-screen textarea (design
 * reference: screenshot) with its own "Parse and Continue" action that
 * feeds into the exact same flow as uploading a file; "Start From Scratch"
 * skips straight to the editor via onSkip (see onboarding/page.tsx).
 */
export function UploadStep({ busy, onFileSelected, onTextSubmitted, onSkip }: UploadStepProps) {
  const [view, setView] = useState<View>("list");
  const [mode, setMode] = useState<Mode>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  function selectMode(next: Mode) {
    if (next === "scratch") {
      onSkip();
      return;
    }
    if (next === "text") {
      setView("paste");
      return;
    }
    setMode(next);
  }

  if (view === "paste") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <button
            type="button"
            onClick={() => setView("list")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <ChevronLeftIcon className="h-4 w-4" />
            </span>
            Back to import options
          </button>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">Paste Your Resume</h1>
          <p className="mt-2 text-sm text-gray-500">
            Paste your resume content below. Our parser will extract your work history, skills, and
            education to build your portfolio.
          </p>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value.slice(0, MAX_PASTED_TEXT_LENGTH))}
            disabled={busy}
            maxLength={MAX_PASTED_TEXT_LENGTH}
            placeholder="Paste your resume text here..."
            autoFocus
            className="mt-5 h-52 w-full resize-none rounded-lg border border-indigo-300 bg-gray-50 p-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Plain text, markdown, or RTF supported</span>
            <span>
              {pastedText.length} / {MAX_PASTED_TEXT_LENGTH} characters
            </span>
          </div>

          <button
            type="button"
            disabled={busy || pastedText.trim().length < MIN_PASTED_TEXT_LENGTH}
            onClick={() => onTextSubmitted(pastedText)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Parsing..." : "Parse and Continue"}
            <ChevronRightIcon className="h-4 w-4" />
          </button>

          <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-5 text-xs text-gray-400">
            <LockIcon className="h-3.5 w-3.5" />
            Your privacy is protected. Secured &amp; encrypted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <FileIcon className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">Add Your Resume</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm text-gray-500">
          Choose how you&apos;d like to import your professional background to build your customized
          portfolio.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => selectMode("upload")}
            className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${
              mode === "upload" ? "border-indigo-600 bg-indigo-50/60" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-indigo-600">
              <CloudUploadIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">Upload Resume</span>
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Recommended
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">Import file from your device</p>
              <p className="text-xs font-medium text-indigo-600">PDF, DOC, DOCX up to 10MB</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-indigo-400" />
          </button>

          {mode === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className="text-sm text-gray-600">
                Drag and drop your resume here, or click below to browse.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="mt-4 flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UploadIcon className="h-4 w-4" />
                {busy ? "Uploading..." : "Browse Files"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => selectMode("text")}
            className="flex items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-gray-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <ClipboardIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-gray-900">Paste Text</span>
              <p className="mt-0.5 text-xs text-gray-500">Copy and paste your resume content</p>
              <p className="text-xs text-gray-400">Quick plain text parsing</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-indigo-400" />
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => selectMode("scratch")}
            className="flex items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <EditIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-gray-900">Start From Scratch</span>
              <p className="mt-0.5 text-xs text-gray-500">Build your resume step by step</p>
              <p className="text-xs text-gray-400">Guided experience</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-indigo-400" />
          </button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-5 text-xs text-gray-400">
          <LockIcon className="h-3.5 w-3.5" />
          Your privacy is protected. Secured &amp; encrypted.
        </p>
      </div>
    </div>
  );
}
