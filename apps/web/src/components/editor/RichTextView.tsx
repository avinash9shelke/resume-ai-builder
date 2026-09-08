import { formatEntryDateRange, type RichText } from "@resume-ai/schema";

/**
 * Renders a RichText entry array (see packages/resume-schema/src/richText.ts)
 * as HTML: consecutive "bullet" entries are grouped into one <ul>, "paragraph"
 * entries become <p> tags. Mirrors apps/pdf-service's Handlebars `richText` helper,
 * so the live preview matches the exported PDF.
 */
function renderRichTextHtml(entries: RichText): string {
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

export function RichTextView({ entries, className = "" }: { entries: RichText; className?: string }) {
  if (entries.length === 0) return null;
  return (
    // eslint-disable-next-line react/no-danger
    <div
      className={`rich-text-view [&_p]:m-0 [&_ul]:my-0.5 [&_ul]:ml-4 [&_ul]:list-disc [&_.entry-date]:text-gray-400 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderRichTextHtml(entries) }}
    />
  );
}
