"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Resume, TemplateKey } from "@resume-ai/schema";
import { Button, Card } from "@resume-ai/ui-core";
import { api } from "@/lib/api";
import { TEMPLATE_LABELS } from "@/lib/templateLabels";
import { Logo } from "@/components/Logo";
import { DownloadIcon, EditIcon, TrashIcon } from "@/components/icons";

function formatDateTime(value: string | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api
      .listResumes()
      .then(setResumes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    await api.deleteResume(id);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleExport(resume: Resume) {
    setBusyId(resume.id ?? null);
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
      setBusyId(null);
    }
  }

  const sorted = [...resumes].sort((a, b) => {
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="mx-auto flex max-w-6xl items-center px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Resumes</h1>
            <p className="mt-1 text-sm text-gray-500">
              A history of every resume you&apos;ve created, with when it was created and last updated.
            </p>
          </div>
          <Link href="/onboarding">
            <Button variant="primary">+ New resume</Button>
          </Link>
        </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading...</p>
      ) : sorted.length === 0 ? (
        <Card className="mt-8 p-10 text-center text-gray-500">
          No resumes yet.{" "}
          <Link href="/onboarding" className="font-medium text-blue-600 hover:underline">
            Create one
          </Link>{" "}
          from scratch or by uploading an existing resume to get started.
        </Card>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Template</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((resume) => (
                <tr key={resume.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/editor/${resume.id}`)}
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      {resume.title || "Untitled Resume"}
                    </button>
                    <p className="mt-0.5 text-xs text-gray-400">{resume.basics?.name || "No name set"}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {TEMPLATE_LABELS[resume.metadata?.template as TemplateKey] ?? resume.metadata?.template ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{formatDateTime(resume.createdAt)}</td>
                  <td className="px-5 py-4 text-gray-500">{formatDateTime(resume.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Edit"
                        title="Edit"
                        onClick={() => router.push(`/editor/${resume.id}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Export PDF"
                        title="Export PDF"
                        disabled={busyId === resume.id}
                        onClick={() => handleExport(resume)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        title="Delete"
                        onClick={() => handleDelete(resume.id!)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </main>
  );
}
