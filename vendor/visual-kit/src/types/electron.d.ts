// Desktop-only host APIs; Electron is supplied by Obsidian, not bundled.
declare module "electron" {
  interface NativeImage {
    isEmpty(): boolean;
  }
  export const clipboard: {
    write(data: { html: string; text: string; image?: NativeImage }): void;
    writeImage(image: NativeImage): void;
  };
  export const nativeImage: { createFromDataURL(url: string): NativeImage };
}
