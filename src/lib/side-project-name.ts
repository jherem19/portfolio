const UPPERCASE_TERMS = new Set(["3d", "ai", "ar", "vr", "xr", "ui", "ux", "wasd", "web3", "webgl"]);

export function getSideProjectName(value: string) {
  try {
    const url = new URL(value);
    const pathPart = url.pathname.split("/").filter(Boolean).at(-1);
    const source = decodeURIComponent(pathPart || url.hostname.replace(/^www\./, "").split(".")[0]);
    return source
      .replace(/[-_]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => UPPERCASE_TERMS.has(word.toLowerCase()) ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" ");
  } catch {
    return "Side project";
  }
}
