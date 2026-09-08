import type { ComponentType } from "react";
import type { BuiltInSectionId } from "@resume-ai/schema";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { SkillsSection } from "./SkillsSection";
import { ProjectsSection } from "./ProjectsSection";
import { CertificationsSection } from "./CertificationsSection";
import { AwardsSection } from "./AwardsSection";
import { LanguagesSection } from "./LanguagesSection";
import { InterestsSection } from "./InterestsSection";
import { ReferencesSection } from "./ReferencesSection";
import { PublicationsSection } from "./PublicationsSection";
import { VolunteerSection } from "./VolunteerSection";

/**
 * Draggable/reorderable built-in sections (everything except `basics`/
 * `summary`, which are fixed headers). Custom (user-defined) sections are
 * rendered separately via CustomSectionCard, keyed by their `custom:<uuid>` id.
 */
export const DRAGGABLE_SECTION_COMPONENTS: Partial<Record<BuiltInSectionId, ComponentType>> = {
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  certifications: CertificationsSection,
  awards: AwardsSection,
  languages: LanguagesSection,
  interests: InterestsSection,
  references: ReferencesSection,
  publications: PublicationsSection,
  volunteer: VolunteerSection,
};
