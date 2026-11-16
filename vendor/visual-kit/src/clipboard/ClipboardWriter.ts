import { clipboard, nativeImage } from "electron";
export function writeRich(
  html: string,
  text: string,
  imageDataURL?: string,
): Promise<void> {
  const image = imageDataURL
    ? nativeImage.createFromDataURL(imageDataURL)
    : undefined;
  clipboard.write({
    html,
    text,
    ...(image && !image.isEmpty() ? { image } : {}),
  });
  return Promise.resolve();
}
export function writeImage(dataURL: string): Promise<void> {
  const image = nativeImage.createFromDataURL(dataURL);
  if (image.isEmpty())
    return Promise.reject(new Error("Unable to decode image for clipboard"));
  clipboard.writeImage(image);
  return Promise.resolve();
}
export function toDataURL(bytes: ArrayBuffer, mime: string): string {
  const array = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < array.length; i += 8192)
    binary += String.fromCharCode(...array.subarray(i, i + 8192));
  return `data:${mime};base64,${btoa(binary)}`;
}
export const imageMime = (ext: string) =>
  ({ jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml" })[
    ext.toLowerCase()
  ] ?? `image/${ext.toLowerCase()}`;
