/**
 * A RichTextEntry stores its content as *inline* HTML (just the formatted
 * text, e.g. "Pioneer of <strong>computing</strong>"), while Tiptap's
 * `getHTML()`/`setContent()` operate on a full document with a wrapping
 * <p> node. These helpers convert between the two.
 */

export function wrapInParagraph(html: string): string {
  return `<p>${html}</p>`;
}

export function unwrapParagraph(html: string): string {
  const match = html.match(/^<p[^>]*>([\s\S]*)<\/p>\s*$/);
  return match ? match[1] : html;
}
