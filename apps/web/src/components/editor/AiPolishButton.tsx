"use client";

import { useState } from "react";
import type { PolishTarget } from "@resume-ai/schema";
import { api } from "@/lib/api";
import { CloseIcon, SparklesIcon } from "@/components/icons";

export interface AiPolishButtonProps {
  target: PolishTarget;
  text: string;
  context?: Record<string, string>;
  onReplace: (text: string) => void;
}

/** Feature 3: AI Polish — fetches 5 suggestions and lets the user preview/replace/skip
 * through them one at a time (design reference: screenshot). */
export function AiPolishButton({ target, text, context, onReplace }: AiPolishButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  async function handleOpen() {
    if (!text.trim()) {
      setError("Add some text first, then ask AI to polish it.");
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError(null);
    setIndex(0);
    try {
      const response = await api.polish({ target, text, context });
      setSuggestions(response.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Polish failed");
    } finally {
      setLoading(false);
    }
  }

  const current = suggestions[index];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="AI Polish"
        title="AI Polish"
        onClick={handleOpen}
        className="flex h-9 w-9 items-center justify-center rounded-md text-violet-600 hover:bg-violet-50"
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-96 rounded-xl border border-violet-100 bg-white p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 text-violet-600">
            <SparklesIcon className="h-4 w-4" />
            <span className="text-sm font-bold">AI Suggestion</span>
          </div>

          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <SparklesIcon className="h-4 w-4 animate-spin text-violet-400" />
              <span className="animate-pulse">Generating suggestions...</span>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {!loading && !error && current && (
            <>
              <p className="mt-3 text-sm text-gray-700">&ldquo;{current}&rdquo;</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">
                  {index + 1} of {suggestions.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (index + 1 < suggestions.length) {
                        setIndex(index + 1);
                      } else {
                        setOpen(false);
                      }
                    }}
                    className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-200"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onReplace(current);
                      setOpen(false);
                    }}
                    className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                  >
                    Use this
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && !error && !current && suggestions.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              You&apos;ve seen all suggestions.{" "}
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="font-semibold text-violet-600 hover:underline"
              >
                Start over
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
