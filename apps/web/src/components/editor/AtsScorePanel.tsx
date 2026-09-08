"use client";

import { useState } from "react";
import type { AtsCategoryResult, AtsScoreResponse } from "@resume-ai/schema";
import { useResumeStore } from "@/lib/store";
import { api } from "@/lib/api";
import { AlertTriangleIcon, CheckIcon, CloseIcon, GaugeIcon, SparklesIcon } from "@/components/icons";

const STATUS_STYLES: Record<AtsCategoryResult["status"], { ring: string; badge: string; icon: string }> = {
  good: { ring: "border-emerald-100", badge: "bg-emerald-100 text-emerald-700", icon: "text-emerald-600" },
  warning: { ring: "border-amber-100", badge: "bg-amber-100 text-amber-700", icon: "text-amber-600" },
  critical: { ring: "border-red-100", badge: "bg-red-100 text-red-700", icon: "text-red-600" },
};

function scoreRingClasses(score: number) {
  if (score >= 80) return { text: "text-emerald-600", border: "border-emerald-300" };
  if (score >= 50) return { text: "text-amber-600", border: "border-amber-300" };
  return { text: "text-red-600", border: "border-red-300" };
}

function scrollToSection(sectionId: string) {
  document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * "Check ATS Score" trigger + results panel — sends the current resume to
 * ats-service, shows the overall score and a per-category breakdown with
 * actionable suggestions, and highlights (in amber, via the shared
 * `atsHighlightedSections` store state) the sections that most need work.
 * From there, jumping to a flagged section surfaces its existing AI Polish
 * button so the user can act on the feedback immediately.
 */
export function AtsScorePanel() {
  const resume = useResumeStore((s) => s.resume);
  const setAtsHighlightedSections = useResumeStore((s) => s.setAtsHighlightedSections);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsScoreResponse | null>(null);

  async function handleCheck() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const response = await api.checkAtsScore(resume);
      setResult(response);
      setAtsHighlightedSections(response.highlightedSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute ATS score");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCheck}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <GaugeIcon className="h-4 w-4" />
        ATS Score
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">ATS Score</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading && <p className="text-sm text-gray-500">Scoring your resume...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              {result && !loading && (
                <>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 ${scoreRingClasses(result.overallScore).border}`}
                    >
                      <span className={`text-2xl font-extrabold ${scoreRingClasses(result.overallScore).text}`}>
                        {result.overallScore}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {result.overallScore >= 80
                          ? "Great! Your resume is ATS-ready."
                          : result.overallScore >= 50
                            ? "Decent start — a few fixes will help a lot."
                            : "Your resume needs work to pass ATS screening."}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Based on contact info, summary, experience impact, skills, education, and length.
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 flex flex-col gap-3">
                    {result.categories.map((category) => {
                      const style = STATUS_STYLES[category.status];
                      return (
                        <li key={category.id} className={`rounded-lg border ${style.ring} p-3`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {category.status === "good" ? (
                                <CheckIcon className={`h-4 w-4 ${style.icon}`} />
                              ) : (
                                <AlertTriangleIcon className={`h-4 w-4 ${style.icon}`} />
                              )}
                              <span className="text-sm font-semibold text-gray-900">{category.label}</span>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.badge}`}>
                              {category.score}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-gray-600">{category.message}</p>

                          {category.suggestions.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-500">
                              {category.suggestions.map((suggestion) => (
                                <li key={suggestion}>{suggestion}</li>
                              ))}
                            </ul>
                          )}

                          {category.status !== "good" && category.sectionId && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false);
                                setTimeout(() => scrollToSection(category.sectionId!), 50);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                            >
                              <SparklesIcon className="h-3.5 w-3.5" />
                              Go improve this with AI Polish
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {result && !loading && (
              <div className="border-t border-gray-100 px-6 py-3">
                <button
                  type="button"
                  onClick={handleCheck}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Re-check score
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
