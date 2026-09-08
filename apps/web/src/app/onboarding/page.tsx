"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createEmptyResume,
  DEFAULT_COLUMNS_BY_TEMPLATE,
  getDefaultSectionOrderForTemplate,
  getThemeColors,
  isCustomSectionId,
  TEMPLATE_KEYS,
  type Resume,
  type TemplateKey,
} from "@resume-ai/schema";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { UploadStep } from "@/components/onboarding/UploadStep";
import { TemplateGallery } from "@/components/onboarding/TemplateGallery";
import { TemplatePreviewModal } from "@/components/onboarding/TemplatePreviewModal";
import { ProcessingOptionModal, type ProcessingAction } from "@/components/onboarding/ProcessingOptionModal";

type Step = "templates" | "upload" | "processing";

/**
 * Sets the template, chosen color theme, and a section layout matching the
 * template's intended column structure on a draft resume — a 2-column
 * template needs its sections actually split across both columns (see
 * getDefaultSectionOrderForTemplate), otherwise the second column renders
 * empty. Any existing custom-section placements are preserved.
 */
function applyTemplate(draft: Resume, template: TemplateKey, theme: string) {
  draft.metadata.template = template;
  draft.metadata.theme = theme;
  draft.metadata.design.colors = getThemeColors(theme);
  draft.metadata.layout.columns = DEFAULT_COLUMNS_BY_TEMPLATE[template] ?? 1;
  const customPlacements = draft.metadata.layout.sectionOrder.filter((p) => isCustomSectionId(p.id));
  draft.metadata.layout.sectionOrder = [...getDefaultSectionOrderForTemplate(template), ...customPlacements];
}

/**
 * End-to-end onboarding wizard (design reference: screenshots):
 * Template Selection -> Template Preview ("Use Template") -> Upload (or
 * "Start from scratch") -> Processing Option (Work With Original Text /
 * Improve With AI, upload path only) -> Editor. This is now the only entry
 * point for creating a resume (see Home's "Get Started"/nav links and
 * Dashboard's "New resume"/"Upload resume" buttons).
 */
/** Either an uploaded file or resume text pasted directly — both feed the same AI extraction pipeline. */
type UploadSource = { kind: "file"; file: File } | { kind: "text"; text: string };

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Coming from the home page's template carousel/preview ("Proceed") passes
  // the already-chosen template (and theme) via query params, so the wizard
  // should open straight on the "Add Your Resume" step instead of making the
  // user pick a template all over again.
  const preselectedTemplate = searchParams.get("template");
  const initialTemplate =
    preselectedTemplate && TEMPLATE_KEYS.includes(preselectedTemplate as TemplateKey)
      ? (preselectedTemplate as TemplateKey)
      : null;
  const initialTheme = searchParams.get("theme");

  const [step, setStep] = useState<Step>(initialTemplate ? "upload" : "templates");
  const [source, setSource] = useState<UploadSource | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateKey | null>(null);
  const [chosenTemplate, setChosenTemplate] = useState<TemplateKey | null>(initialTemplate);
  const [chosenTheme, setChosenTheme] = useState<string>(initialTheme || "classic-blue");
  const [busy, setBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<ProcessingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createBlankResume(template: TemplateKey, theme: string) {
    setBusy(true);
    setError(null);
    try {
      const draft = createEmptyResume();
      draft.title = "Untitled Resume";
      applyTemplate(draft, template, theme);
      const resume = await api.createResume(draft);
      router.push(`/editor/${resume.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resume");
      setBusy(false);
    }
  }

  async function createFromUpload(improve: boolean) {
    if (!source || !chosenTemplate) return;
    setBusy(true);
    setActiveAction(improve ? "improve" : "original");
    setError(null);
    try {
      const parsed =
        source.kind === "file"
          ? await api.parseResumeFile(source.file, { improve })
          : await api.parseResumeText(source.text, { improve });
      const draft = parsed.resume;
      draft.title = draft.basics?.name ? `${draft.basics.name}'s Resume` : "Untitled Resume";
      applyTemplate(draft, chosenTemplate, chosenTheme);
      const resume = await api.createResume(draft);
      router.push(`/editor/${resume.id}${parsed.incomplete ? "?incomplete=1" : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse resume");
      setBusy(false);
      setActiveAction(null);
    }
  }

  function handleUseTemplate(template: TemplateKey, theme: string) {
    setPreviewTemplate(null);
    setChosenTemplate(template);
    setChosenTheme(theme);
    setStep("upload");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="mx-auto flex max-w-5xl items-center px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </nav>

      {error && (
        <p className="mx-auto mt-4 max-w-lg rounded-md bg-red-50 px-4 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {step === "templates" && <TemplateGallery onSelect={setPreviewTemplate} />}

      {step === "upload" && chosenTemplate && (
        <UploadStep
          busy={busy}
          onFileSelected={(selected) => {
            setSource({ kind: "file", file: selected });
            setStep("processing");
          }}
          onTextSubmitted={(text) => {
            setSource({ kind: "text", text });
            setStep("processing");
          }}
          onSkip={() => createBlankResume(chosenTemplate, chosenTheme)}
        />
      )}

      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />

      <ProcessingOptionModal
        open={step === "processing"}
        busy={busy}
        activeAction={activeAction}
        onWorkWithOriginal={() => createFromUpload(false)}
        onImproveWithAi={() => createFromUpload(true)}
        onClose={() => router.push("/dashboard")}
      />
    </main>
  );
}
