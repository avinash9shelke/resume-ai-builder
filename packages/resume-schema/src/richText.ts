import { z } from "zod";

/**
 * Structured rich text used by long-text fields (Basics.summary, WorkItem.summary,
 * ProjectItem.description, CustomSectionItem.description). Each field is a list
 * of block "entries" (matching the reference design's +Entry/Remove-entry UI):
 * a paragraph or bullet block, holding inline-formatted HTML (bold/italic/
 * underline/align/link), with an optional per-entry date.
 */

export const RICH_TEXT_BLOCK_TYPES = ["paragraph", "bullet"] as const;
export type RichTextBlockType = (typeof RICH_TEXT_BLOCK_TYPES)[number];

export const RichTextEntrySchema = z.object({
  id: z.string(),
  type: z.enum(RICH_TEXT_BLOCK_TYPES).default("paragraph"),
  /** Inline-formatted content: plain text plus <strong>/<em>/<u>/<a> markup only. */
  html: z.string().optional().default(""),
  /** Start of an optional "YYYY-MM" date range for this entry. */
  date: z.string().optional().default(""),
  /** End of the range; empty means "date" is a single point in time (or ongoing). */
  dateTo: z.string().optional().default(""),
});
export type RichTextEntry = z.infer<typeof RichTextEntrySchema>;

export const RichTextSchema = z.array(RichTextEntrySchema).default([]);
export type RichText = z.infer<typeof RichTextSchema>;

export function createRichTextEntry(
  idFactory: () => string,
  partial: Partial<Omit<RichTextEntry, "id">> = {},
): RichTextEntry {
  return RichTextEntrySchema.parse({ id: idFactory(), ...partial });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const HTML_TAG_REGEX = /<[^>]*>/g;

/** Strips markup and joins entries into plain text (used for AI parsing/polish requests). */
export function richTextToPlainText(entries: RichText): string {
  return entries
    .map((entry) => {
      const text = entry.html.replace(HTML_TAG_REGEX, "").trim();
      if (!text) return "";
      return entry.type === "bullet" ? `• ${text}` : text;
    })
    .filter(Boolean)
    .join("\n");
}

// Mirrors BULLET_PREFIXES in apps/ai-service/app/models/schema.py.
const BULLET_PREFIXES = ["• ", "- ", "* ", "◦ ", "▪ "];

/**
 * Wraps a plain-text string (e.g. an AI Polish suggestion) into rich text
 * entries. A line starting with a bullet marker (e.g. "• ") becomes a
 * bullet-type entry with the marker stripped, so bulleted content (resume
 * bullet points) renders as a bulleted list in the UI instead of a stack of
 * plain paragraphs.
 *
 * If *any* line has a bullet marker, every line is treated as a bullet — a
 * resume field is realistically either "all bullets" or "a paragraph",
 * never a mix, and the model occasionally drops the marker from just one
 * line of an otherwise fully-bulleted block, which would otherwise leave a
 * stray paragraph sitting in the middle of a bullet list.
 */
export function plainTextToRichText(text: string, idFactory: () => string): RichText {
  const parsed = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const prefix = BULLET_PREFIXES.find((p) => line.startsWith(p));
      return { content: prefix ? line.slice(prefix.length).trim() : line, hasMarker: Boolean(prefix) };
    });

  const type: RichTextBlockType = parsed.some((p) => p.hasMarker) ? "bullet" : "paragraph";
  return parsed.map(({ content }) => createRichTextEntry(idFactory, { html: escapeHtml(content), type }));
}

/**
 * Reads a single-line RichText field back out as plain text — unlike
 * `richTextToPlainText`, never trims, so it round-trips cleanly with
 * `setSingleLineRichText` while the user is still typing (a trailing space
 * would otherwise be trimmed away on every keystroke).
 */
export function getSingleLineText(entries: RichText): string {
  return entries[0]?.html.replace(HTML_TAG_REGEX, "") ?? "";
}

/**
 * Updates (or creates) a single-line RichText entry in place, preserving the
 * existing entry's id/date and — unlike `plainTextToRichText` — never trimming
 * the text. Use this for live per-keystroke editing of a single-line field
 * (e.g. a custom section entry's description); `plainTextToRichText`'s
 * per-line trim would otherwise eat a trailing space on every keystroke.
 * Pair with `getSingleLineText` (not `richTextToPlainText`) to read it back.
 */
export function setSingleLineRichText(entries: RichText, text: string, idFactory: () => string): RichText {
  if (!text) return [];
  const existing = entries[0];
  return [
    {
      id: existing?.id ?? idFactory(),
      type: existing?.type ?? "paragraph",
      html: escapeHtml(text),
      date: existing?.date ?? "",
      dateTo: existing?.dateTo ?? "",
    },
  ];
}

/** Formats an entry's "YYYY-MM" date (and optional "YYYY-MM" dateTo) for display, e.g. "Apr 2020 - Dec 2020". */
export function formatEntryDateRange(entry: Pick<RichTextEntry, "date" | "dateTo">): string {
  const format = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) return value;
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthIndex = Number(match[2]) - 1;
    return `${monthNames[monthIndex] ?? match[2]} ${match[1]}`;
  };

  if (!entry.date) return "";
  if (!entry.dateTo) return format(entry.date);
  return `${format(entry.date)} - ${format(entry.dateTo)}`;
}
