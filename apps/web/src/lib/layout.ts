import type { BuiltInSectionId, Resume, SectionId } from "@resume-ai/schema";
import { isCustomSectionId } from "@resume-ai/schema";

/** Groups ordered, non-basics section ids (built-in + custom) into their column, for the DnD board and preview. */
export function getColumnSections(resume: Resume): SectionId[][] {
  const { columns, sectionOrder } = resume.metadata.layout;
  const result: SectionId[][] = Array.from({ length: columns }, () => []);
  for (const placement of sectionOrder) {
    if (placement.id === "basics" || placement.id === "summary") continue;
    const columnIndex = Math.min(placement.column, columns - 1);
    result[columnIndex].push(placement.id as SectionId);
  }
  return result;
}

export const SECTION_LABELS: Record<BuiltInSectionId, string> = {
  basics: "Basics",
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  languages: "Languages",
  interests: "Interests",
  awards: "Awards",
  certifications: "Certifications",
  publications: "Publications",
  volunteer: "Volunteering",
  references: "References",
};

/** Resolves a display label for any section id, including custom sections (by their user-given title). */
export function getSectionLabel(id: SectionId, resume: Resume): string {
  if (isCustomSectionId(id)) {
    return resume.customSections.find((s) => s.id === id)?.title || "Custom Section";
  }
  return SECTION_LABELS[id as BuiltInSectionId] ?? id;
}
