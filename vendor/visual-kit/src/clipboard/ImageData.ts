/** Decode local image data without fetching or making a network request. */
export function imageDataBytes(url: string): ArrayBuffer {
  const match = /^data:image\/[a-z0-9.+-]+;base64,([a-z0-9+/=\s]+)$/i.exec(url);
  if (!match) throw new Error("Expected a base64 image data URL");
  return Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0))
    .buffer;
}
