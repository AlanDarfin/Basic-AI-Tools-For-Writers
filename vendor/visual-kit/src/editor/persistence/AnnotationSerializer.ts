export interface AnnotationDocument {
  version: 1;
  source: string;
  canvas: Record<string, unknown>;
  crop: { x: number; y: number; width: number; height: number };
  nextMarker: number;
}
export function parseAnnotation(text: string): AnnotationDocument {
  const value = JSON.parse(text) as AnnotationDocument;
  if (
    value.version !== 1 ||
    typeof value.source !== "string" ||
    !/^data:image\/(png|jpeg|gif|webp|bmp|avif);base64,/.test(value.source) ||
    !value.canvas ||
    !Array.isArray(value.canvas.objects) ||
    !value.crop ||
    !Object.values(value.crop).every(Number.isFinite) ||
    value.crop.width <= 0 ||
    value.crop.height <= 0
  )
    throw new Error("Invalid annotation document");
  // Sidecars are untrusted vault content: no external image sources or unsupported objects.
  const inspect = (obj: unknown): void => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, v] of Object.entries(obj)) {
      if (
        key === "src" &&
        (typeof v !== "string" ||
          !/^data:image\/(png|jpeg|gif|webp|bmp|avif);base64,/.test(v))
      )
        throw new Error("External resources are not allowed in annotations");
      if (v && typeof v === "object") inspect(v);
    }
  };
  inspect(value.canvas);
  return value;
}
