export const RICH_TEXT_PREFIX = "<!--portfolio-rich-text-->";

export function isRichText(value: string) {
  return value.startsWith(RICH_TEXT_PREFIX);
}

export function getRichTextHtml(value: string) {
  return isRichText(value) ? value.slice(RICH_TEXT_PREFIX.length) : "";
}
