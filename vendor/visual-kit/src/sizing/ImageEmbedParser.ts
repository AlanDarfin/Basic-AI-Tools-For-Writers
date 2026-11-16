export interface ImageEmbed {
  start: number;
  end: number;
  raw: string;
  target: string;
  label: string;
  kind: "wiki" | "markdown";
  width?: number;
  height?: number;
}
export const isImage = (path: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg|avif)(?:[?#].*)?$/i.test(path);
// Mask code without changing offsets, so examples are never rewritten.
export function maskCode(text: string): string {
  return text
    .replace(
      /^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^\1\2[^\n]*(?=\n|$)|$(?![\s\S]))/gm,
      (s) => s.replace(/[^\n]/g, " "),
    )
    .replace(/(`+)[\s\S]*?\1/g, (s) => " ".repeat(s.length))
    .replace(/^(?: {4}|\t).*$/gm, (s) => " ".repeat(s.length));
}
export function parseImages(text: string): ImageEmbed[] {
  const masked = maskCode(text),
    result: ImageEmbed[] = [];
  const re =
    /!\[\[([^\]\n]+)\]\]|!\[((?:\\.|[^\]\\])*)\]\(\s*(<[^>\n]+>|(?:\\.|[^\s()\\]|\([^()]*\))+)(?:\s+"[^"]*")?\s*\)/g;
  for (const match of masked.matchAll(re)) {
    if (match.index > 0 && text[match.index - 1] === "\\") continue;
    const wiki = match[1] !== undefined;
    const parts = wiki
      ? match[1].split("|")
      : [match[3].replace(/^<|>$/g, "").replace(/\\([() ])/g, "$1"), match[2]];
    const target = parts[0];
    if (!isImage(target)) continue;
    const label = wiki ? parts.slice(1).join("|") : parts[1];
    const size = /(?:^|\|)(\d+)(?:x(\d+))?$/.exec(label);
    result.push({
      start: match.index,
      end: match.index + match[0].length,
      raw: text.slice(match.index, match.index + match[0].length),
      target,
      label,
      kind: wiki ? "wiki" : "markdown",
      width: size ? +size[1] : undefined,
      height: size?.[2] ? +size[2] : undefined,
    });
  }
  return result;
}
export function resizedEmbed(
  embed: ImageEmbed,
  width?: number,
  preserveHeight = false,
): string {
  const label = embed.label.replace(/(?:^|\|)\d+(?:x\d+)?$/, "");
  const size = width
    ? `${width}${preserveHeight && embed.height ? "x" + embed.height : ""}`
    : "";
  const suffix = [label, size].filter(Boolean).join("|");
  if (embed.kind === "wiki")
    return `![[${embed.target}${suffix ? "|" + suffix : ""}]]`;
  // Retain destination/title syntax exactly; Obsidian reads sizes from alt text.
  return embed.raw.replace(/^!\[(?:\\.|[^\]\\])*\]/, `![${suffix}]`);
}
