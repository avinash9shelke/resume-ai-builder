import type {
  AtsScoreResponse,
  ParseResumeResponse,
  PolishRequest,
  PolishResponse,
  Resume,
} from "@resume-ai/schema";

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || body?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listResumes: () => fetch("/api/resumes").then((r) => asJson<Resume[]>(r)),

  getResume: (id: string) => fetch(`/api/resumes/${id}`).then((r) => asJson<Resume>(r)),

  createResume: (resume: Partial<Resume>) =>
    fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
    }).then((r) => asJson<Resume>(r)),

  updateResume: (id: string, resume: Resume) =>
    fetch(`/api/resumes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
    }).then((r) => asJson<Resume>(r)),

  deleteResume: (id: string) => fetch(`/api/resumes/${id}`, { method: "DELETE" }),

  parseResumeFile: (file: File, options?: { improve?: boolean }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.improve) formData.append("improve", "true");
    return fetch("/api/parse", { method: "POST", body: formData }).then((r) =>
      asJson<ParseResumeResponse>(r),
    );
  },

  /** Feature 1 variant: the user pastes their resume as plain text instead of
   * uploading a file — parsed through the exact same AI pipeline. */
  parseResumeText: (text: string, options?: { improve?: boolean }) => {
    const formData = new FormData();
    formData.append("text", text);
    if (options?.improve) formData.append("improve", "true");
    return fetch("/api/parse", { method: "POST", body: formData }).then((r) =>
      asJson<ParseResumeResponse>(r),
    );
  },

  polish: (request: PolishRequest) =>
    fetch("/api/polish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }).then((r) => asJson<PolishResponse>(r)),

  checkAtsScore: (resume: Resume) =>
    fetch("/api/ats-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
    }).then((r) => asJson<AtsScoreResponse>(r)),

  exportPdf: async (resume: Resume): Promise<Blob> => {
    const res = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "PDF export failed");
    }
    return res.blob();
  },
};
