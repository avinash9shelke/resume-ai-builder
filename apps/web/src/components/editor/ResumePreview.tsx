"use client";

import { isCustomSectionId, type Resume, type SectionId, type TemplateKey } from "@resume-ai/schema";
import { useResumeStore } from "@/lib/store";
import { getColumnSections } from "@/lib/layout";
import { RichTextView } from "@/components/editor/RichTextView";
import { CUSTOM_SECTION_ICON_MAP } from "@/lib/customSectionIcons";
import {
  AtSignIcon,
  BookOpenIcon,
  BriefcaseIcon,
  FileIcon,
  FolderIcon,
  GlobeIcon,
  GraduationCapIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MedalIcon,
  PhoneIcon,
  StarIcon,
  UserIcon,
  ZapIcon,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

/** Small monochrome icon shown before each section heading and contact field (design reference: screenshot). */
const SECTION_ICONS: Partial<Record<SectionId, ComponentType<SVGProps<SVGSVGElement>>>> = {
  summary: FileIcon,
  experience: BriefcaseIcon,
  education: GraduationCapIcon,
  projects: FolderIcon,
  skills: ZapIcon,
  languages: GlobeIcon,
  interests: HeartIcon,
  awards: StarIcon,
  certifications: MedalIcon,
  publications: BookOpenIcon,
  volunteer: HeartIcon,
  references: UserIcon,
};

/**
 * Per-template visual treatment for the live preview (design reference:
 * screenshots — Double Column / Ivy League / Elegant / Crest). This mirrors
 * the pdf-service templates' identity (font, layout) without attempting
 * pixel-perfect parity — the exported PDF is the source of truth for print
 * output. Accent *color* comes from `metadata.design.colors` (the selected
 * theme, see @resume-ai/schema THEME_PRESETS), not from these classes.
 */
interface TemplateStyle {
  containerClass: string;
  headerAlignClass: string;
  nameClass: string;
  labelClass: string;
  headingClass: string;
  /** Approximates a tinted sidebar column background (light gray, or a border/tint accent). */
  sidebarClass?: string;
  /** True for templates whose sidebar fills solid with the theme's accent color (design
   * reference: screenshot) — text/pills/icons in that column switch to light colors for contrast. */
  isDarkSidebar?: boolean;
  /** Which column (0 or 1) the sidebar styling above applies to. Defaults to
   * 0 (most sidebar templates put it first) — a template whose sidebar is
   * the *second* column (e.g. a right-hand sidebar) sets this to 1. */
  sidebarColumnIndex?: 0 | 1;
  /** Renders Skills as a plain dot-bulleted list instead of pill tags
   * (design reference: screenshot), matching the equivalent PDF template. */
  plainSkillList?: boolean;
}

const TEMPLATE_STYLES: Record<TemplateKey, TemplateStyle> = {
  refined: {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm text-gray-500",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg bg-gray-100 p-3",
  },
  "classic-serif": {
    containerClass: "bg-white font-serif",
    headerAlignClass: "text-center",
    nameClass: "text-2xl font-normal tracking-wide",
    labelClass: "text-sm italic text-stone-500",
    headingClass: "border-stone-200",
  },
  "obsidian-edge": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "bg-gray-900 -mx-8 -mt-8 px-8 pt-8 pb-4 text-white",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm text-gray-300",
    headingClass: "border-gray-200",
  },
  "precision-line": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "border-b-2 border-gray-900 pb-3",
    nameClass: "text-xl font-bold tracking-tight",
    labelClass: "text-sm text-gray-600",
    headingClass: "border-transparent",
  },
  "silver-banner": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "border-b-2 border-gray-200 pb-3",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg bg-gray-50 p-3",
  },
  "cobalt-edge": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg p-3",
    isDarkSidebar: true,
  },
  "editorial-rule": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "border-b-2 border-gray-900 pb-3",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm italic text-gray-500",
    headingClass: "border-transparent",
  },
  "true-blue": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-transparent",
  },
  "saffron-line": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-transparent",
    sidebarClass: "rounded-lg bg-orange-50 p-3",
  },
  "steady-form": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
  },
  "hunter-green": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg p-3",
    isDarkSidebar: true,
  },
  quicksilver: {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm text-gray-500",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg bg-gray-100 p-3",
  },
  "classic-clear": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm text-gray-500",
    headingClass: "border-gray-200",
  },
  "atlantic-blue": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg p-3",
    isDarkSidebar: true,
  },
  "mercury-flow": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
  },
  "meridian-slate": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
  },
  // Main content lives in column[0] (see WIDE_FIRST_COLUMN_TEMPLATES) so this
  // preview's "first column is the sidebar" tinting doesn't apply here — the
  // exported PDF (with a real navy banner header) is the source of truth.
  "azure-banner": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
  },
  // The real sidebar is column[1] here (see WIDE_FIRST_COLUMN_TEMPLATES,
  // matching the PDF's right-hand sidebar) — sidebarColumnIndex tells this
  // preview to tint the second column instead of the first.
  "teal-outline": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg p-3",
    isDarkSidebar: true,
    sidebarColumnIndex: 1,
    plainSkillList: true,
  },
  "teal-portrait": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-200",
    sidebarClass: "rounded-lg p-3",
    isDarkSidebar: true,
  },
  "dual-grid": {
    containerClass: "bg-white font-sans",
    headerAlignClass: "",
    nameClass: "text-xl font-bold",
    labelClass: "text-sm font-semibold",
    headingClass: "border-gray-900 border-b-2",
  },
};

function SectionHeading({
  children,
  className,
  color,
  icon: Icon,
}: {
  children: string;
  className: string;
  color: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <h3
      style={{ color }}
      className={`mb-1.5 flex items-center gap-1.5 border-b pb-1 text-[11px] font-bold uppercase tracking-wider ${className}`}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </h3>
  );
}

export interface ResumePreviewProps {
  /** Overrides the resume shown, instead of pulling from the editor store
   * (used by the onboarding template gallery to render sample previews). */
  resume?: Resume;
}

/** Real-time preview mirroring the pdf-service templates. */
export function ResumePreview({ resume: resumeProp }: ResumePreviewProps = {}) {
  const storeResume = useResumeStore((s) => s.resume);
  const resume = resumeProp ?? storeResume;
  const { basics, summary, picture, metadata } = resume;
  const columnItems = getColumnSections(resume);
  const templateKey: TemplateKey =
    metadata.template in TEMPLATE_STYLES ? (metadata.template as TemplateKey) : "refined";
  const style = TEMPLATE_STYLES[templateKey];
  const accent = metadata.design.colors.primary;

  function renderSection(id: SectionId, colAccent: string) {
    // On a dark (solid accent-color) sidebar, a chip tinted *toward* the accent color
    // (mostly white) would be unreadable — use a translucent white chip instead.
    const isDarkColumn = colAccent === "#fff";
    const chipBg = isDarkColumn ? "rgba(255,255,255,0.15)" : `color-mix(in srgb, ${colAccent} 12%, white)`;
    const cardBorder = isDarkColumn ? "rgba(255,255,255,0.25)" : `color-mix(in srgb, ${colAccent} 20%, #e5e7eb)`;
    const titleClass = isDarkColumn ? "text-white" : "text-gray-800";
    const dateClass = isDarkColumn ? "text-white/70" : "text-gray-400";
    const descClass = isDarkColumn ? "text-white/85" : "text-gray-500";
    const subtitleWeightClass =
      metadata.typography.subtitleStyle === "bold"
        ? "font-bold"
        : metadata.typography.subtitleStyle === "italic"
          ? "italic font-normal"
          : "font-medium";
    if (isCustomSectionId(id)) {
      const customSection = resume.customSections.find((s) => s.id === id);
      if (!customSection || customSection.items.length === 0) return null;
      const Icon = customSection.icon ? CUSTOM_SECTION_ICON_MAP[customSection.icon] : undefined;
      return (
        <section key={id} className="mb-4">
          <SectionHeading className={style.headingClass} color={colAccent} icon={Icon}>
            {customSection.title}
          </SectionHeading>
          {customSection.items.map((item) => (
            <div key={item.id} className="mb-2 flex items-start gap-2">
              {Icon && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Icon className="h-3 w-3" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                  <span>{item.title || "Entry"}</span>
                  {customSection.showDate && item.date && (
                    <span className={`text-[10px] font-normal ${dateClass}`}>{item.date}</span>
                  )}
                </div>
                <RichTextView entries={item.description} className={`text-[10.5px] ${descClass}`} />
              </div>
            </div>
          ))}
        </section>
      );
    }

    switch (id) {
      case "experience":
        return resume.sections.experience.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.experience}>
              {resume.sections.experience.title}
            </SectionHeading>
            {resume.sections.experience.items.map((item) => (
              <div key={item.id} className="mb-2 flex items-start gap-2">
                {item.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logo} alt="" className="mt-0.5 h-6 w-6 shrink-0 object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                    <span>{item.position || "Position"}</span>
                    <span className={`text-[10px] font-normal ${dateClass}`}>{item.period}</span>
                  </div>
                  <p className={`text-[10.5px] ${subtitleWeightClass}`} style={{ color: colAccent }}>
                    {item.company}
                  </p>
                  <RichTextView entries={item.description} className="mt-0.5 text-[10.5px]" />
                </div>
              </div>
            ))}
          </section>
        ) : null;
      case "education":
        return resume.sections.education.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.education}>
              {resume.sections.education.title}
            </SectionHeading>
            {resume.sections.education.items.map((item) => (
              <div key={item.id} className="mb-2">
                <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                  <span>{item.school || "School"}</span>
                  <span className={`text-[10px] font-normal ${dateClass}`}>{item.period}</span>
                </div>
                <p className={`text-[10.5px] ${subtitleWeightClass}`} style={{ color: colAccent }}>
                  {item.degree} {item.area}
                </p>
              </div>
            ))}
          </section>
        ) : null;
      case "skills":
        return resume.sections.skills.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.skills}>
              {resume.sections.skills.title}
            </SectionHeading>
            {style.plainSkillList ? (
              <div className="flex flex-col gap-1">
                {resume.sections.skills.items.map((skill) => (
                  <div key={skill.id} className={`flex items-center gap-1.5 text-[10px] ${titleClass}`}>
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: colAccent }}
                    />
                    {skill.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {resume.sections.skills.items.map((skill) => (
                  <span
                    key={skill.id}
                    style={{ color: colAccent, backgroundColor: chipBg }}
                    className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        ) : null;
      case "projects":
        return resume.sections.projects.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.projects}>
              {resume.sections.projects.title}
            </SectionHeading>
            {resume.sections.projects.items.map((item) => (
              <div key={item.id} className="mb-2">
                <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                  <span>{item.name || "Project"}</span>
                  <span className={`text-[10px] font-normal ${dateClass}`}>{item.period}</span>
                </div>
                <RichTextView entries={item.description} className="text-[10.5px]" />
              </div>
            ))}
          </section>
        ) : null;
      case "certifications":
        return resume.sections.certifications.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.certifications}>
              {resume.sections.certifications.title}
            </SectionHeading>
            {resume.sections.certifications.items.map((item) => (
              <div key={item.id} className="mb-2">
                <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                  <span>{item.title || "Certification"}</span>
                  <span className={`text-[10px] font-normal ${dateClass}`}>{item.date}</span>
                </div>
                {item.issuer && (
                  <p className={`text-[10.5px] ${subtitleWeightClass}`} style={{ color: colAccent }}>
                    {item.issuer}
                  </p>
                )}
              </div>
            ))}
          </section>
        ) : null;
      case "publications":
        return resume.sections.publications.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.publications}>
              {resume.sections.publications.title}
            </SectionHeading>
            {resume.sections.publications.items.map((item) => (
              <div key={item.id} className="mb-2">
                <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                  <span>{item.title || "Publication"}</span>
                  <span className={`text-[10px] font-normal ${dateClass}`}>{item.date}</span>
                </div>
                {item.publisher && (
                  <p className={`text-[10.5px] ${subtitleWeightClass}`} style={{ color: colAccent }}>
                    {item.publisher}
                  </p>
                )}
              </div>
            ))}
          </section>
        ) : null;
      case "volunteer":
        return resume.sections.volunteer.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.volunteer}>
              {resume.sections.volunteer.title}
            </SectionHeading>
            {resume.sections.volunteer.items.map((item) => (
              <div key={item.id} className="mb-2">
                <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                  <span>{item.organization || "Organization"}</span>
                  <span className={`text-[10px] font-normal ${dateClass}`}>{item.period}</span>
                </div>
                <RichTextView entries={item.description} className="text-[10.5px]" />
              </div>
            ))}
          </section>
        ) : null;
      case "awards":
        return resume.sections.awards.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.awards}>
              {resume.sections.awards.title}
            </SectionHeading>
            {resume.sections.awards.items.map((item) => {
              const AwardIcon = SECTION_ICONS.awards;
              return (
                <div
                  key={item.id}
                  className="mb-2 flex items-start gap-2.5 rounded-lg border p-2.5"
                  style={{ borderColor: cardBorder }}
                >
                  {AwardIcon && (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ color: colAccent, backgroundColor: chipBg }}
                    >
                      <AwardIcon className="h-3 w-3" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`flex justify-between text-[11.5px] font-semibold ${titleClass}`}>
                      <span>{item.title || "Award"}</span>
                      <span className={`text-[10px] font-normal ${dateClass}`}>{item.date}</span>
                    </div>
                    {item.awarder && (
                      <p className={`text-[10.5px] ${subtitleWeightClass}`} style={{ color: colAccent }}>
                        {item.awarder}
                      </p>
                    )}
                    <RichTextView entries={item.description} className="text-[10.5px]" />
                  </div>
                </div>
              );
            })}
          </section>
        ) : null;
      case "languages":
        return resume.sections.languages.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.languages}>
              {resume.sections.languages.title}
            </SectionHeading>
            {resume.sections.languages.items.map((item) => (
              <p key={item.id} className="text-[10.5px]">
                <span className="font-semibold">{item.language}</span> — {item.fluency}
              </p>
            ))}
          </section>
        ) : null;
      case "interests":
        return resume.sections.interests.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.interests}>
              {resume.sections.interests.title}
            </SectionHeading>
            {resume.sections.interests.items.map((item) => (
              <p key={item.id} className="text-[10.5px] font-semibold">
                {item.name}
              </p>
            ))}
          </section>
        ) : null;
      case "references":
        return resume.sections.references.items.length > 0 ? (
          <section key={id} className="mb-4">
            <SectionHeading className={style.headingClass} color={colAccent} icon={SECTION_ICONS.references}>
              {resume.sections.references.title}
            </SectionHeading>
            {resume.sections.references.items.map((item) => (
              <div key={item.id} className="mb-2">
                <p className="text-[11px] font-semibold">{item.name}</p>
                <RichTextView entries={item.description} className="text-[10.5px]" />
              </div>
            ))}
          </section>
        ) : null;
      default:
        return null;
    }
  }

  const profileSettings = metadata.profileSettings;
  // Baseline of 11pt (the schema default) maps to a 1x scale — the "Font
  // Size" layout control scales the whole preview proportionally, since the
  // countless fixed-px Tailwind text sizes throughout aren't relative units.
  const fontSizeScale = metadata.typography.fontSize / 11;

  return (
    <div
      style={{ zoom: fontSizeScale }}
      className={`mx-auto aspect-[210/297] w-full max-w-[520px] overflow-y-auto p-8 text-gray-800 shadow-md ${style.containerClass}`}
    >
      <header className={`mb-4 ${style.headerAlignClass}`}>
        {!picture.hidden && picture.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picture.url}
            alt="Profile"
            className={`h-16 w-16 object-cover ${
              style.headerAlignClass.includes("text-center") ? "mx-auto mb-2" : "float-right"
            } ${profileSettings.photoStyle === "square" ? "rounded-lg" : "rounded-full"}`}
          />
        )}
        <h1 className={style.nameClass + (profileSettings.uppercaseName ? " uppercase" : "")}>
          {basics.name || "Your Name"}
        </h1>
        {profileSettings.showHeadline && (
          <p style={{ color: accent }} className={style.labelClass}>
            {basics.headline || "Your headline"}
          </p>
        )}
        <p
          className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 ${
            style.headerAlignClass.includes("text-center") ? "justify-center" : ""
          }`}
        >
          {profileSettings.showEmail && basics.email && (
            <span className="flex items-center gap-1">
              <AtSignIcon className="h-3 w-3 shrink-0" style={{ color: accent }} />
              {basics.email}
            </span>
          )}
          {profileSettings.showPhone && basics.phone && (
            <span className="flex items-center gap-1">
              <PhoneIcon className="h-3 w-3 shrink-0" style={{ color: accent }} />
              {basics.phone}
            </span>
          )}
          {profileSettings.showWebsite && basics.website.url && (
            <span className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3 shrink-0" style={{ color: accent }} />
              {basics.website.url}
            </span>
          )}
          {profileSettings.showLocation && basics.location && (
            <span className="flex items-center gap-1">
              <MapPinIcon className="h-3 w-3 shrink-0" style={{ color: accent }} />
              {basics.location}
            </span>
          )}
          {basics.customFields.map((field) => (
            <span key={field.id}>{field.text}</span>
          ))}
        </p>
        {!summary.hidden && summary.content.length > 0 && (
          <div className="mt-2">
            <SectionHeading className={style.headingClass} color={accent} icon={SECTION_ICONS.summary}>
              {summary.title}
            </SectionHeading>
            <RichTextView entries={summary.content} className="text-[10.5px]" />
          </div>
        )}
      </header>

      <div className={`grid gap-6 ${columnItems.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {columnItems.map((sectionIds, columnIndex) => {
          const isSidebarColumn =
            columnItems.length === 2 && columnIndex === (style.sidebarColumnIndex ?? 0);
          return (
            <div
              key={columnIndex}
              className={style.sidebarClass && isSidebarColumn ? style.sidebarClass : ""}
              style={isSidebarColumn && style.isDarkSidebar ? { backgroundColor: accent, color: "#fff" } : undefined}
            >
              {sectionIds.map((id) =>
                renderSection(id, isSidebarColumn && style.isDarkSidebar ? "#fff" : accent),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
