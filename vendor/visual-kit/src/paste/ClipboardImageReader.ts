export interface ClipboardImage {
  name: string;
  bytes: ArrayBuffer;
  extension: string;
}
const formats: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};
export function imageFiles(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files = Array.from(data.files);
  if (files.length)
    return files.filter(
      (f) =>
        formats[f.type] || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(f.name),
    );
  return Array.from(data.items)
    .filter((i) => i.kind === "file")
    .map((i) => i.getAsFile())
    .filter((f): f is File => !!f && !!formats[f.type]);
}
export async function readImage(file: File): Promise<ClipboardImage> {
  const bytes = await file.arrayBuffer();
  if (!bytes.byteLength) throw new Error("Empty image");
  const signature = new Uint8Array(bytes);
  const text = new TextDecoder().decode(signature.slice(0, 512));
  const extension =
    signature[0] === 137 && text.includes("PNG")
      ? "png"
      : signature[0] === 255 && signature[1] === 216
        ? "jpg"
        : text.startsWith("GIF8")
          ? "gif"
          : text.startsWith("RIFF") && text.slice(8, 12) === "WEBP"
            ? "webp"
            : text.startsWith("BM")
              ? "bmp"
              : text.includes("<svg")
                ? "svg"
                : text.includes("ftypavif") || text.includes("ftypavis")
                  ? "avif"
                  : null;
  if (!extension) throw new Error("Unsupported or invalid image content");
  return { name: file.name, bytes, extension };
}
