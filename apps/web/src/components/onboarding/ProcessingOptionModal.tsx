"use client";

import { useEffect, useState } from "react";
import { CloseIcon, SparklesIcon, ZapIcon } from "@/components/icons";

export type ProcessingAction = "original" | "improve";

export interface ProcessingOptionModalProps {
  open: boolean;
  busy?: boolean;
  /** Which action is currently running, so the loader can show contextual copy. */
  activeAction?: ProcessingAction | null;
  onWorkWithOriginal: () => void;
  onImproveWithAi: () => void;
  /** Closing the panel abandons the upload flow (design reference: screenshot). */
  onClose: () => void;
}

const LOADER_COPY: Record<ProcessingAction, string> = {
  original: "Extracting your experience...",
  improve: "Polishing your resume with AI...",
};

/** Animated progress bar that fills toward ~92% over ~18s, then snaps to 100%
 * once `busy` turns false (the parent navigates away right after). */
function ProgressBar({ running }: { running: boolean }) {
  const [width, setWidth] = useState(4);

  useEffect(() => {
    if (!running) {
      setWidth(100);
      return;
    }
    setWidth(4);
    const id = setTimeout(() => setWidth(92), 50);
    return () => clearTimeout(id);
  }, [running]);

  return (
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-indigo-600 transition-[width] duration-[18000ms] ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/**
 * "I read your resume. Here's my plan." processing choice (design reference:
 * screenshot) — lets the user pick whether the uploaded resume's text is
 * mapped as-is or first refined by the AI agent. While the chosen action is
 * running, shows an animated loader (design reference: screenshot) instead
 * of the choice buttons.
 */
export function ProcessingOptionModal({
  open,
  busy,
  activeAction,
  onWorkWithOriginal,
  onImproveWithAi,
  onClose,
}: ProcessingOptionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {busy && activeAction ? (
          <div className="flex items-center gap-4 py-2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
              <ZapIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-gray-900">{LOADER_COPY[activeAction]}</p>
              <ProgressBar running={busy} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 pr-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <SparklesIcon className="h-5 w-5" />
              </span>
              <h2 className="mt-1.5 text-lg font-bold text-gray-900">
                I read your resume. Here&apos;s my plan.
              </h2>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Feature your wins</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Your achievements deserve their own section up top.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">A lot more later</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Call me anytime from the AI Assistant menu.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              Give me about 20 seconds. Every fact stays yours, and you can edit all of it.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={onWorkWithOriginal}
                className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Work With Original Text
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onImproveWithAi}
                className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Yes, Improve With AI
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
