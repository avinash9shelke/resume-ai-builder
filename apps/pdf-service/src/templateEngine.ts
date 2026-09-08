import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import {
  formatEntryDateRange,
  isCustomSectionId,
  type BuiltInSectionId,
  type CustomSection,
  type Resume,
  type RichText,
} from "@resume-ai/schema";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("or", (...args: unknown[]) => args.slice(0, -1).some(Boolean));

/**
 * Small monochrome line icons (design reference: screenshot) shown before
 * contact fields and section headings — mirrors apps/web/src/components/icons.tsx
 * so the PDF and the live editor preview use visually matching icons.
 */
const ICON_PATHS: Record<string, string> = {
  email: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.28"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>',
  location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  summary: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  experience: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  education: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/>',
  projects: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
  skills: '<path d="M13 2 3 14h8l-1 8 10-12h-8Z"/>',
  languages: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/>',
  interests: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  awards: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8Z"/>',
  certifications: '<circle cx="12" cy="15" r="6"/><path d="m9 10-4-7M15 10l4-7M9.5 15.5 12 13l2.5 2.5"/>',
  publications: '<path d="M2 5c2-1.5 5-2 8 0v14c-3-2-6-1.5-8 0Z"/><path d="M22 5c-2-1.5-5-2-8 0v14c3-2 6-1.5 8 0Z"/>',
  volunteer: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  references: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
};

Handlebars.registerHelper(
  "icon",
  (name: string) =>
    new Handlebars.SafeString(
      `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] ?? ""}</svg>`,
    ),
);

/**
 * Renders a RichText entry array (see packages/resume-schema/src/richText.ts)
 * to HTML: consecutive "bullet" entries are grouped into a single <ul>,
 * "paragraph" entries become <p> tags, each optionally suffixed with its date.
 */
function renderRichTextHtml(entries: RichText | undefined): string {
  if (!entries || entries.length === 0) return "";
  const parts: string[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      parts.push(`<ul>${bulletBuffer.map((html) => `<li>${html}</li>`).join("")}</ul>`);
      bulletBuffer = [];
    }
  };

  for (const entry of entries) {
    if (!entry.html) continue;
    if (entry.type === "bullet") {
      bulletBuffer.push(entry.html);
      continue;
    }
    flushBullets();
    const range = formatEntryDateRange(entry);
    const dateSuffix = range ? ` <span class="entry-date">(${range})</span>` : "";
    parts.push(`<p>${entry.html}${dateSuffix}</p>`);
  }
  flushBullets();
  return parts.join("");
}

Handlebars.registerHelper(
  "richText",
  (entries: RichText | undefined) => new Handlebars.SafeString(renderRichTextHtml(entries)),
);

const LEVEL_DOT_MAX = 5;

/**
 * Renders a language/skill proficiency `level` (0-5) as a row of filled/empty
 * dots (design reference: screenshot). Hidden by default (see `.level-dots`
 * in base-styles.hbs) — only templates that opt in via CSS (`display: ...`)
 * show it, since most existing templates only show the text fluency/proficiency label.
 */
Handlebars.registerHelper(
  "levelDots",
  (level: number | undefined) => {
    const filled = Math.max(0, Math.min(LEVEL_DOT_MAX, level ?? 0));
    const dots = Array.from({ length: LEVEL_DOT_MAX }, (_, i) =>
      i < filled ? '<span class="level-dot filled"></span>' : '<span class="level-dot"></span>',
    ).join("");
    return new Handlebars.SafeString(`<span class="level-dots">${dots}</span>`);
  },
);

// Shared per-section-type rendering (work/education/skills/etc.), reused across all templates.
Handlebars.registerPartial(
  "sectionsBody",
  fs.readFileSync(path.join(__dirname, "templates", "partials", "sections-body.hbs"), "utf-8"),
);
// Shared base CSS rules (box-sizing, lists, tags, icon avatars) common to every template.
Handlebars.registerPartial(
  "baseStyles",
  fs.readFileSync(path.join(__dirname, "templates", "partials", "base-styles.hbs"), "utf-8"),
);

/** A single entry to render within a column: either a built-in section kind, or a resolved custom section. */
type ColumnEntry =
  | { kind: Exclude<BuiltInSectionId, "basics" | "summary"> }
  | { kind: "custom"; custom: CustomSection };

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

function loadTemplate(name: string): Handlebars.TemplateDelegate {
  const cached = templateCache.get(name);
  if (cached) return cached;

  const filePath = path.join(__dirname, "templates", `${name}.hbs`);
  const source = fs.readFileSync(filePath, "utf-8");
  const compiled = Handlebars.compile(source);
  templateCache.set(name, compiled);
  return compiled;
}

/** Groups ordered sections (built-in + custom) into their target columns for rendering. */
function buildColumns(resume: Resume): ColumnEntry[][] {
  const { columns, sectionOrder } = resume.metadata.layout;
  const customById = new Map(resume.customSections.map((section) => [section.id, section]));
  const result: ColumnEntry[][] = Array.from({ length: columns }, () => []);

  for (const placement of sectionOrder) {
    // basics/summary are rendered in the header, not as a placeable section.
    if (placement.id === "basics" || placement.id === "summary") continue;
    const columnIndex = Math.min(placement.column, columns - 1);

    if (isCustomSectionId(placement.id)) {
      const custom = customById.get(placement.id);
      if (custom) result[columnIndex].push({ kind: "custom", custom });
      continue;
    }

    result[columnIndex].push({
      kind: placement.id as Exclude<BuiltInSectionId, "basics" | "summary">,
    });
  }
  return result;
}

const AVAILABLE_TEMPLATES = new Set([
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
]);

export function renderResumeHtml(resume: Resume): string {
  const templateName = AVAILABLE_TEMPLATES.has(resume.metadata.template)
    ? resume.metadata.template
    : "refined";
  const template = loadTemplate(templateName);
  return template({
    ...resume,
    profileSettings: resume.metadata.profileSettings,
    accentColor: resume.metadata.design.colors.primary,
    textColor: resume.metadata.design.colors.text,
    fontFamily: resume.metadata.typography.fontFamily,
    fontSize: resume.metadata.typography.fontSize,
    subtitleWeight: resume.metadata.typography.subtitleStyle === "bold" ? "700" : "500",
    subtitleFontStyle: resume.metadata.typography.subtitleStyle === "italic" ? "italic" : "normal",
    columns: buildColumns(resume),
  });
}
