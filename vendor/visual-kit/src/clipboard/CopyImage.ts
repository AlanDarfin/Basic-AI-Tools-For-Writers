import { imageMime, toDataURL } from "./ClipboardWriter";

/** Decode before touching the clipboard; bake display dimensions into compatible PNGs. */
export async function prepareCopyImage(
  bytes: ArrayBuffer,
  extension: string,
  width?: number,
  height?: number,
  compatible = true,
) {
  if (!bytes.byteLength || bytes.byteLength > 25 * 1024 * 1024)
    throw new Error("Image is empty or exceeds 25 MB.");
  for (const value of [width, height])
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < 1 || value > 16384)
    )
      throw new Error("Image dimensions must be between 1 and 16384 pixels.");
  // SVG may contain external resources. Require an explicit raster export instead.
  if (extension.toLowerCase() === "svg")
    throw new Error("Export this SVG as PNG before copying it to a ticket.");
  const bitmap = await createImageBitmap(
    new Blob([bytes], { type: imageMime(extension) }),
  );
  try {
    const outputWidth = width ?? bitmap.width;
    const outputHeight =
      height ??
      Math.max(1, Math.round((bitmap.height * outputWidth) / bitmap.width));
    if (
      !bitmap.width ||
      !bitmap.height ||
      outputWidth * outputHeight > 32_000_000
    )
      throw new Error(
        "Image is invalid or exceeds the 32 megapixel export limit.",
      );
    if (!compatible)
      return {
        source: toDataURL(bytes, imageMime(extension)),
        width: outputWidth,
        height: outputHeight,
      };
    const canvas = createEl("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot prepare image for clipboard.");
    ctx.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
    const source = canvas.toDataURL("image/png");
    canvas.width = canvas.height = 0;
    return { source, width: outputWidth, height: outputHeight };
  } finally {
    bitmap.close();
  }
}
