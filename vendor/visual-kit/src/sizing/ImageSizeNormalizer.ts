import { parseImages, resizedEmbed } from "./ImageEmbedParser";
export function normalizeImages(
  markdown: string,
  width?: number,
  preserveHeight = false,
): string {
  if (
    width !== undefined &&
    (!Number.isInteger(width) || width < 1 || width > 16384)
  )
    throw new Error("Width must be an integer between 1 and 16384.");
  let result = markdown;
  for (const embed of parseImages(markdown).reverse())
    result =
      result.slice(0, embed.start) +
      resizedEmbed(embed, width, preserveHeight) +
      result.slice(embed.end);
  return result;
}
