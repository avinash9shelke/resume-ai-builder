import { z } from "zod";

export * from "./richText";
import { RichTextSchema } from "./richText";

/**
 * Resume schema — modeled on the Reactive Resume schema (https://rxresu.me/schema.json),
 * adopted per user request. Field names/shapes for `basics`, `picture`, and the
 * 11 `sections` + their items match that schema. Two pragmatic adaptations:
 *   - Long-text fields (summary/description) keep our RichText (array of
 *     entries) representation rather than a single HTML string, since our
 *     whole rich-text editing UI is built around it.
 *   - `metadata` implements a practical subset (template, layout, page format,
 *     design colors, typography) rather than the full styleRules/stylesheet
 *     CSS-override DSL and per-page manual layout arrays, which are far
 *     beyond what a single-page PDF export needs.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const WebsiteSchema = z.object({
  url: z.string().optional().default(""),
  label: z.string().optional().default(""),
});
export type Website = z.infer<typeof WebsiteSchema>;

function emptyWebsite(): Website {
  return WebsiteSchema.parse({});
}

export const CustomFieldSchema = z.object({
  id: z.string(),
  icon: z.string().optional().default(""),
  text: z.string().optional().default(""),
  link: z.string().optional().default(""),
});
export type CustomField = z.infer<typeof CustomFieldSchema>;

export const PictureSchema = z.object({
  hidden: z.boolean().default(false),
  fit: z.enum(["cover", "contain"]).default("cover"),
  url: z.string().optional().default(""),
  size: z.number().min(32).max(512).default(120),
  rotation: z.number().min(0).max(360).default(0),
  aspectRatio: z.number().min(0.5).max(2.5).default(1),
  borderRadius: z.number().min(0).max(100).default(50),
  borderColor: z.string().optional().default("rgba(0, 0, 0, 0)"),
  borderWidth: z.number().min(0).default(0),
  shadowColor: z.string().optional().default("rgba(0, 0, 0, 0)"),
  shadowWidth: z.number().min(0).default(0),
});
export type Picture = z.infer<typeof PictureSchema>;

export const BasicsSchema = z.object({
  name: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  customFields: z.array(CustomFieldSchema).default([]),
});
export type Basics = z.infer<typeof BasicsSchema>;

export const SummarySchema = z.object({
  title: z.string().optional().default("Summary"),
  hidden: z.boolean().default(false),
  content: RichTextSchema,
});
export type Summary = z.infer<typeof SummarySchema>;

// ---------------------------------------------------------------------------
// Sections (per rxresu.me/schema.json `sections.*`)
// ---------------------------------------------------------------------------

export const ExperienceRoleSchema = z.object({
  id: z.string(),
  position: z.string().optional().default(""),
  period: z.string().optional().default(""),
  description: RichTextSchema,
});
export type ExperienceRole = z.infer<typeof ExperienceRoleSchema>;

export const ExperienceItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  company: z.string().optional().default(""),
  position: z.string().optional().default(""),
  location: z.string().optional().default(""),
  period: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
  roles: z.array(ExperienceRoleSchema).default([]),
  /** Optional company logo (a data URL), shown next to the entry — mirrors
   * `Picture.url`'s "store the image inline" approach rather than uploading
   * to separate storage. */
  logo: z.string().optional().default(""),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const EducationItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  school: z.string().optional().default(""),
  degree: z.string().optional().default(""),
  area: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  location: z.string().optional().default(""),
  period: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

export const ProjectItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  name: z.string().optional().default(""),
  period: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
});
export type ProjectItem = z.infer<typeof ProjectItemSchema>;

export const SkillItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  icon: z.string().optional().default(""),
  iconColor: z.string().optional().default(""),
  name: z.string().optional().default(""),
  proficiency: z.string().optional().default(""),
  level: z.number().min(0).max(5).default(0),
  keywords: z.array(z.string()).default([]),
});
export type SkillItem = z.infer<typeof SkillItemSchema>;

export const LanguageItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  language: z.string().optional().default(""),
  fluency: z.string().optional().default(""),
  level: z.number().min(0).max(5).default(0),
});
export type LanguageItem = z.infer<typeof LanguageItemSchema>;

export const InterestItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  icon: z.string().optional().default(""),
  iconColor: z.string().optional().default(""),
  name: z.string().optional().default(""),
  keywords: z.array(z.string()).default([]),
});
export type InterestItem = z.infer<typeof InterestItemSchema>;

export const AwardItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  title: z.string().optional().default(""),
  awarder: z.string().optional().default(""),
  date: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
});
export type AwardItem = z.infer<typeof AwardItemSchema>;

export const CertificationItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  title: z.string().optional().default(""),
  issuer: z.string().optional().default(""),
  date: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
});
export type CertificationItem = z.infer<typeof CertificationItemSchema>;

export const PublicationItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  title: z.string().optional().default(""),
  publisher: z.string().optional().default(""),
  date: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
});
export type PublicationItem = z.infer<typeof PublicationItemSchema>;

export const VolunteerItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  organization: z.string().optional().default(""),
  location: z.string().optional().default(""),
  period: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
});
export type VolunteerItem = z.infer<typeof VolunteerItemSchema>;

export const ReferenceItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  name: z.string().optional().default(""),
  position: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  phone: z.string().optional().default(""),
  description: RichTextSchema,
});
export type ReferenceItem = z.infer<typeof ReferenceItemSchema>;

function sectionWrapper<T extends z.ZodTypeAny>(itemSchema: T, defaultTitle: string) {
  const wrapper = z.object({
    title: z.string().optional().default(defaultTitle),
    hidden: z.boolean().default(false),
    items: z.array(itemSchema).default([]),
  });
  return wrapper.optional().default(() => wrapper.parse({}));
}

export const SectionsSchema = z.object({
  experience: sectionWrapper(ExperienceItemSchema, "Experience"),
  education: sectionWrapper(EducationItemSchema, "Education"),
  projects: sectionWrapper(ProjectItemSchema, "Projects"),
  skills: sectionWrapper(SkillItemSchema, "Skills"),
  languages: sectionWrapper(LanguageItemSchema, "Languages"),
  interests: sectionWrapper(InterestItemSchema, "Interests"),
  awards: sectionWrapper(AwardItemSchema, "Awards"),
  certifications: sectionWrapper(CertificationItemSchema, "Certifications"),
  publications: sectionWrapper(PublicationItemSchema, "Publications"),
  volunteer: sectionWrapper(VolunteerItemSchema, "Volunteering"),
  references: sectionWrapper(ReferenceItemSchema, "References"),
});
export type Sections = z.infer<typeof SectionsSchema>;
export type SectionKey = keyof Sections;
export const SECTION_KEYS = [
  "experience",
  "education",
  "projects",
  "skills",
  "languages",
  "interests",
  "awards",
  "certifications",
  "publications",
  "volunteer",
  "references",
] as const satisfies readonly SectionKey[];

// ---------------------------------------------------------------------------
// Custom sections (extension, not part of the core schema's `oneOf` union —
// simplified to one generic item shape rather than the full polymorphic set).
// ---------------------------------------------------------------------------

export const CustomSectionItemSchema = z.object({
  id: z.string(),
  hidden: z.boolean().default(false),
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  date: z.string().optional().default(""),
  website: WebsiteSchema.optional().default(emptyWebsite),
  description: RichTextSchema,
});
export type CustomSectionItem = z.infer<typeof CustomSectionItemSchema>;

export const CUSTOM_SECTION_ICON_KEYS = ["diamond"] as const;
export type CustomSectionIconKey = (typeof CUSTOM_SECTION_ICON_KEYS)[number];

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional().default("Custom Section"),
  hidden: z.boolean().default(false),
  items: z.array(CustomSectionItemSchema).default([]),
  /** Optional icon key chosen when the section was created from a template. */
  icon: z.string().optional().default(""),
  /** Whether entries in this section show an editable date field. */
  showDate: z.boolean().optional().default(false),
});
export type CustomSection = z.infer<typeof CustomSectionSchema>;

export const CUSTOM_SECTION_PREFIX = "custom:";

export function isCustomSectionId(id: string): boolean {
  return id.startsWith(CUSTOM_SECTION_PREFIX);
}

/** The set of reorderable/placeable section ids, including the fixed ones. */
export const SECTION_IDS = ["basics", "summary", ...SECTION_KEYS] as const;
export type BuiltInSectionId = (typeof SECTION_IDS)[number];

/** A section id is either a built-in id, or a `custom:<uuid>` id referencing `Resume.customSections`. */
export type SectionId = BuiltInSectionId | `${typeof CUSTOM_SECTION_PREFIX}${string}`;

export const SectionPlacementSchema = z.object({
  id: z.string(),
  column: z.number().int().min(0).max(1),
});
export type SectionPlacement = z.infer<typeof SectionPlacementSchema>;

// ---------------------------------------------------------------------------
// Metadata: template, layout, page, design (theme), typography
// ---------------------------------------------------------------------------

/** Visual PDF/preview template keys (see apps/pdf-service/src/templates/). */
export const TEMPLATE_KEYS = [
  "refined",
  "classic-serif",
  "obsidian-edge",
  "precision-line",
  "silver-banner",
  "cobalt-edge",
  "editorial-rule",
  "true-blue",
  "saffron-line",
  "steady-form",
  "hunter-green",
  "quicksilver",
  "classic-clear",
  "atlantic-blue",
  "mercury-flow",
  "meridian-slate",
  "azure-banner",
  "teal-outline",
  "teal-portrait",
  "dual-grid",
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

const LayoutSchema = z.object({
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
  sectionOrder: z
    .array(SectionPlacementSchema)
    .default(() => SECTION_IDS.map((id) => ({ id, column: 0 }))),
});

export const PAGE_FORMATS = ["a4", "letter"] as const;
export type PageFormat = (typeof PAGE_FORMATS)[number];

const PageSchema = z.object({
  format: z.enum(PAGE_FORMATS).default("letter"),
  marginX: z.number().min(0).max(100).default(14),
  marginY: z.number().min(0).max(100).default(12),
  hideLinkUnderline: z.boolean().default(false),
});

/**
 * A named color palette, applied via `metadata.design.colors`. Each template
 * ships several of these as selectable "theme variants" (see
 * apps/pdf-service/src/themes.ts and apps/web/src/lib/themes.ts).
 */
export const DesignColorsSchema = z.object({
  primary: z.string().default("rgba(37, 99, 235, 1)"),
  text: z.string().default("rgba(17, 24, 39, 1)"),
  background: z.string().default("rgba(255, 255, 255, 1)"),
});
export type DesignColors = z.infer<typeof DesignColorsSchema>;

const DesignSchema = z.object({
  colors: DesignColorsSchema.optional().default(() => DesignColorsSchema.parse({})),
});

export const SUBTITLE_STYLES = ["normal", "bold", "italic"] as const;
export type SubtitleStyle = (typeof SUBTITLE_STYLES)[number];

export const TypographySchema = z.object({
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().min(6).max(24).default(11),
  lineHeight: z.number().min(0.5).max(4).default(1.5),
  /** Weight/style applied to subtitles (company, institution, issuer, etc.) across the resume. */
  subtitleStyle: z.enum(SUBTITLE_STYLES).default("normal"),
});
export type Typography = z.infer<typeof TypographySchema>;

export const PHOTO_STYLES = ["circle", "square"] as const;
export type PhotoStyle = (typeof PHOTO_STYLES)[number];

/**
 * Controls which fields of the Profile/Basics card are shown, and how the
 * name/photo are styled. Surfaced via the section-settings ("gear") menu.
 */
/**
 * Selectable color-theme variants (applied via `metadata.design.colors` /
 * `metadata.theme`). The same palette set is offered for every template;
 * each template just has a different sensible default (see
 * DEFAULT_THEME_BY_TEMPLATE) matching its existing visual identity.
 */
export const THEME_PRESETS = [
  { key: "classic-blue", label: "Classic Blue", colors: { primary: "rgba(37, 99, 235, 1)", text: "rgba(17, 24, 39, 1)", background: "rgba(255, 255, 255, 1)" } },
  { key: "midnight", label: "Midnight", colors: { primary: "rgba(30, 41, 59, 1)", text: "rgba(15, 23, 42, 1)", background: "rgba(255, 255, 255, 1)" } },
  { key: "emerald", label: "Emerald", colors: { primary: "rgba(5, 150, 105, 1)", text: "rgba(17, 24, 39, 1)", background: "rgba(255, 255, 255, 1)" } },
  { key: "crimson", label: "Crimson", colors: { primary: "rgba(220, 38, 38, 1)", text: "rgba(17, 24, 39, 1)", background: "rgba(255, 255, 255, 1)" } },
  { key: "amber", label: "Amber", colors: { primary: "rgba(217, 119, 6, 1)", text: "rgba(17, 24, 39, 1)", background: "rgba(255, 255, 255, 1)" } },
  { key: "violet", label: "Violet", colors: { primary: "rgba(124, 58, 237, 1)", text: "rgba(17, 24, 39, 1)", background: "rgba(255, 255, 255, 1)" } },
] as const satisfies readonly { key: string; label: string; colors: DesignColors }[];
export type ThemeKey = (typeof THEME_PRESETS)[number]["key"];

export const DEFAULT_THEME_BY_TEMPLATE: Record<TemplateKey, ThemeKey> = {
  refined: "midnight",
  "classic-serif": "midnight",
  "obsidian-edge": "midnight",
  "precision-line": "classic-blue",
  "silver-banner": "classic-blue",
  "cobalt-edge": "classic-blue",
  "editorial-rule": "midnight",
  "true-blue": "classic-blue",
  "saffron-line": "amber",
  "steady-form": "midnight",
  "hunter-green": "emerald",
  quicksilver: "midnight",
  "classic-clear": "midnight",
  "atlantic-blue": "classic-blue",
  "mercury-flow": "midnight",
  "meridian-slate": "classic-blue",
  "azure-banner": "classic-blue",
  "teal-outline": "emerald",
  "teal-portrait": "emerald",
  "dual-grid": "classic-blue",
};

export function getThemeColors(themeKey: string): DesignColors {
  const preset = THEME_PRESETS.find((t) => t.key === themeKey);
  return preset ? preset.colors : THEME_PRESETS[0].colors;
}

/**
 * Number of columns each template's layout is designed for. `LayoutSchema`'s
 * default `sectionOrder` puts every section in column 0 — fine for
 * single-column templates, but a 2-column template (sidebar or plain) needs
 * its sections actually split across both columns (see
 * `getDefaultSectionOrderForTemplate`), otherwise the second column renders
 * empty and the first is squeezed into half the page width.
 */
export const DEFAULT_COLUMNS_BY_TEMPLATE: Record<TemplateKey, 1 | 2> = {
  refined: 2,
  "classic-serif": 1,
  "obsidian-edge": 1,
  "precision-line": 1,
  "silver-banner": 1,
  "cobalt-edge": 2,
  "editorial-rule": 1,
  "true-blue": 2,
  "saffron-line": 2,
  "steady-form": 1,
  "hunter-green": 2,
  quicksilver: 2,
  "classic-clear": 1,
  "atlantic-blue": 2,
  "mercury-flow": 2,
  "meridian-slate": 2,
  "azure-banner": 2,
  "teal-outline": 2,
  "teal-portrait": 2,
  "dual-grid": 1,
};

/** Sections placed in the narrower "meta" column (sidebar, or the narrow side of a plain 2-column split). */
const META_SECTIONS: readonly SectionKey[] = ["skills", "languages", "interests", "certifications"];

/**
 * Templates whose *first* column is actually the wide/main one (e.g.
 * "mercury-flow"'s `column-main` is `columns.[0]`), so the meta sections
 * belong in column 1 instead of column 0.
 */
const WIDE_FIRST_COLUMN_TEMPLATES: ReadonlySet<TemplateKey> = new Set([
  "mercury-flow",
  "meridian-slate",
  "azure-banner",
  "teal-outline",
]);

/**
 * A sensible default `sectionOrder`, splitting sections across columns to
 * match the given template's intended layout (see DEFAULT_COLUMNS_BY_TEMPLATE).
 */
export function getDefaultSectionOrderForTemplate(template: TemplateKey): SectionPlacement[] {
  const columns = DEFAULT_COLUMNS_BY_TEMPLATE[template] ?? 1;
  if (columns === 1) {
    return SECTION_IDS.map((id) => ({ id, column: 0 }));
  }
  const metaColumn = WIDE_FIRST_COLUMN_TEMPLATES.has(template) ? 1 : 0;
  const mainColumn = metaColumn === 0 ? 1 : 0;
  return SECTION_IDS.map((id) => ({
    id,
    column: id !== "basics" && id !== "summary" && META_SECTIONS.includes(id as SectionKey) ? metaColumn : mainColumn,
  }));
}

export const ProfileSettingsSchema = z.object({
  showHeadline: z.boolean().default(true),
  showPhone: z.boolean().default(false),
  showWebsite: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  uppercaseName: z.boolean().default(true),
  photoStyle: z.enum(PHOTO_STYLES).default("circle"),
});
export type ProfileSettings = z.infer<typeof ProfileSettingsSchema>;

export const MetadataSchema = z.object({
  // Deliberately a permissive string (not z.enum(TEMPLATE_KEYS)): an unknown/
  // since-removed template value should still validate and render — the pdf
  // renderer/preview fall back to "classic" for anything not in TEMPLATE_KEYS
  // — rather than hard-failing the whole resume.
  template: z.string().default("refined"),
  /** Which named THEME_PRESETS color-theme variant is active. */
  theme: z.string().optional().default("classic-blue"),
  layout: LayoutSchema.optional().default(() => LayoutSchema.parse({})),
  page: PageSchema.optional().default(() => PageSchema.parse({})),
  design: DesignSchema.optional().default(() => DesignSchema.parse({})),
  typography: TypographySchema.optional().default(() => TypographySchema.parse({})),
  profileSettings: ProfileSettingsSchema.optional().default(() => ProfileSettingsSchema.parse({})),
  notes: z.string().optional().default(""),
});
export type Metadata = z.infer<typeof MetadataSchema>;

// ---------------------------------------------------------------------------
// Resume
// ---------------------------------------------------------------------------

export const ResumeSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional().default("Untitled Resume"),
  picture: PictureSchema.optional().default(() => PictureSchema.parse({})),
  basics: BasicsSchema.optional().default(() => BasicsSchema.parse({})),
  summary: SummarySchema.optional().default(() => SummarySchema.parse({})),
  sections: SectionsSchema.optional().default(() => SectionsSchema.parse({})),
  customSections: z.array(CustomSectionSchema).default([]),
  metadata: MetadataSchema.optional().default(() => MetadataSchema.parse({})),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Resume = z.infer<typeof ResumeSchema>;

export function createEmptyResume(): Resume {
  return ResumeSchema.parse({});
}

/** AI Polish request/response contracts shared between web and ai-service. */
export const PolishTargetSchema = z.enum([
  "summary",
  "experience_description",
  "project_description",
]);
export type PolishTarget = z.infer<typeof PolishTargetSchema>;

export const PolishRequestSchema = z.object({
  target: PolishTargetSchema,
  text: z.string().min(1),
  context: z.record(z.string(), z.string()).optional(),
});
export type PolishRequest = z.infer<typeof PolishRequestSchema>;

export const PolishResponseSchema = z.object({
  suggestions: z.array(z.string()).length(5),
});
export type PolishResponse = z.infer<typeof PolishResponseSchema>;

export const ParseResumeResponseSchema = z.object({
  resume: ResumeSchema,
  incomplete: z.boolean().default(false),
  warnings: z.array(z.string()).default([]),
});
export type ParseResumeResponse = z.infer<typeof ParseResumeResponseSchema>;

/** ATS Score request/response contracts shared between web and ats-service. */
export const AtsScoreStatusSchema = z.enum(["good", "warning", "critical"]);
export type AtsScoreStatus = z.infer<typeof AtsScoreStatusSchema>;

export const AtsCategoryResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  score: z.number(),
  weight: z.number(),
  status: AtsScoreStatusSchema,
  message: z.string(),
  suggestions: z.array(z.string()).default([]),
  sectionId: z.string().nullable().default(null),
});
export type AtsCategoryResult = z.infer<typeof AtsCategoryResultSchema>;

export const AtsScoreResponseSchema = z.object({
  overallScore: z.number(),
  categories: z.array(AtsCategoryResultSchema),
  highlightedSections: z.array(z.string()),
});
export type AtsScoreResponse = z.infer<typeof AtsScoreResponseSchema>;
