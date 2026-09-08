"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@resume-ai/ui-core";
import { useResumeStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ProfileCard } from "@/components/editor/ProfileCard";
import { SectionBoard } from "@/components/editor/SectionBoard";
import { LayoutControls } from "@/components/editor/LayoutControls";
import { ResumePreview } from "@/components/editor/ResumePreview";
import { AtsScorePanel } from "@/components/editor/AtsScorePanel";
import { ChevronLeftIcon } from "@/components/icons";

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const resume = useResumeStore((s) => s.resume);
  const isDirty = useResumeStore((s) => s.isDirty);
  const loadResume = useResumeStore((s) => s.loadResume);
  const setTitle = useResumeStore((s) => s.setTitle);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getResume(params.id)
      .then(loadResume)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.updateResume(params.id, resume);
      loadResume(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save resume");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.exportPdf(resume);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resume.title || "resume"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-gray-500">Loading resume...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Back"
              title="Back"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
            <input
              value={resume.title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border-0 px-2 py-1 text-base font-semibold text-gray-900 focus:bg-gray-100 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <LayoutControls />
            <AtsScorePanel />
            <Button variant="secondary" disabled={saving || !isDirty} onClick={handleSave}>
              {saving ? "Saving..." : isDirty ? "Save" : "Saved"}
            </Button>
            <Button variant="primary" disabled={exporting} onClick={handleExport}>
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </header>

      {searchParams.get("incomplete") === "1" && (
        <div className="mx-auto mt-4 max-w-7xl px-6">
          <p className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
            We couldn&apos;t fully parse your resume. Please review and fill in any missing details.
          </p>
        </div>
      )}
      {error && (
        <div className="mx-auto mt-4 max-w-7xl px-6">
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <ProfileCard />
          <SectionBoard />
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ResumePreview />
        </div>
      </div>
    </main>
  );
}
