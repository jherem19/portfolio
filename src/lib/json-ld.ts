export function jsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
