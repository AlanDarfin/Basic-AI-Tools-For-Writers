import { TFile, requestUrl } from "obsidian";
import type VisualKit from "../main";
import { readImage } from "../paste/ClipboardImageReader";
import { imageFolder, imageName } from "../paste/ImageNamingService";
import { ensureFolder, uniquePath } from "../paste/ImageFileWriter";
import { imageHash } from "../duplicates/ImageHasher";
import { imageDataBytes } from "../clipboard/ImageData";
import { choose } from "../ui";
import { htmlElement } from "./HtmlDocument";

export const IMAGE_LIMIT = 25 * 1024 * 1024;

/** Resolve portable HTML paths without permitting access outside the vault. */
export function vaultPath(source: string, notePath: string): string | null {
  if (/^[a-z][a-z\d+.-]*:|^[\\/]/i.test(source)) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(source.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (
    decoded.includes("\\") ||
    Array.from(decoded).some((char) => char.charCodeAt(0) < 32)
  )
    return null;
  const parts = notePath.split("/").slice(0, -1);
  for (const part of decoded.split("/")) {
    if (part === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else if (part && part !== ".") parts.push(part);
  }
  return parts.join("/");
}
export function relativeImage(path: string, notePath: string): string {
  const target = path.split("/"),
    base = notePath.split("/").slice(0, -1);
  while (base.length && target[0] === base[0]) {
    target.shift();
    base.shift();
  }
  return [...base.map(() => ".."), ...target.map(encodeURIComponent)].join("/");
}

export class HtmlAssets {
  constructor(private plugin: VisualKit) {}
  resolve(source: string, note: TFile): TFile | null {
    const path = vaultPath(source, note.path);
    if (!path) return null;
    const file = this.plugin.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }
  async bytes(
    source: string,
    note: TFile,
  ): Promise<{ bytes: ArrayBuffer; extension: string }> {
    const local = this.resolve(source, note);
    let file: File;
    if (local)
      file = new File(
        [await this.plugin.app.vault.readBinary(local)],
        local.name,
      );
    else if (source.startsWith("data:")) {
      if (source.length > IMAGE_LIMIT * 1.4)
        throw new Error("Embedded image exceeds 25 MB.");
      file = new File([imageDataBytes(source)], "image");
    } else {
      const url = new URL(source);
      if (!/^https?:$/.test(url.protocol) || url.username || url.password)
        throw new Error(
          "Image URL is not portable. Paste the image file instead.",
        );
      if (this.plugin.settings.htmlExternalImages !== "download")
        throw new Error(
          "Remote images are blocked. Enable downloading in HTML notes settings, or paste the image file.",
        );
      const response = await requestUrl({ url: url.href, throw: false });
      if (response.status < 200 || response.status >= 300)
        throw new Error(
          "Image could not be downloaded. It may require a browser login; paste the image file instead.",
        );
      file = new File([response.arrayBuffer], "remote-image");
    }
    return this.validate(file);
  }
  async validate(file: File) {
    if (file.size > IMAGE_LIMIT)
      throw new Error("Image exceeds the 25 MB limit.");
    const result = await readImage(file);
    if (result.extension === "svg")
      throw new Error(
        "Export SVG as PNG before inserting it into an HTML note.",
      );
    return result;
  }
  async store(file: File, note: TFile, counter: number): Promise<string> {
    const { app, settings, index } = this.plugin;
    const item = await this.validate(file);
    const folder = imageFolder(
      settings.folder,
      note.basename,
      note.parent?.path || "",
    );
    await ensureFolder(app, folder);
    let existing: TFile | undefined;
    if (settings.duplicates && settings.duplicateAction !== "save") {
      const matches = await index.find(
        await imageHash(item.bytes),
        folder,
        note.path,
        [],
      );
      existing = matches[0];
      if (existing && settings.duplicateAction === "ask") {
        const answer = await choose(
          app,
          "Duplicate image detected",
          existing.path,
          [
            { label: "Reuse image", value: "reuse" },
            { label: "Save duplicate", value: "save" },
          ],
        );
        if (answer === null) throw new Error("Image import cancelled.");
        if (answer === "save") existing = undefined;
      }
    }
    const saved =
      existing ??
      (await app.vault.createBinary(
        uniquePath(
          app,
          folder,
          imageName(settings.naming, note.basename, counter, item.extension),
        ),
        item.bytes,
      ));
    if (settings.duplicates) await index.update(saved);
    return relativeImage(saved.path, note.path);
  }
  async import(
    root: HTMLElement,
    note: TFile,
    files: File[] = [],
  ): Promise<string[]> {
    const images = Array.from(root.querySelectorAll("img"));
    if (images.length > 100 || files.length > 100)
      throw new Error("Paste at most 100 images at a time.");
    if (!images.length && files.length) {
      for (const file of files) {
        const img = htmlElement("img", root.ownerDocument);
        img.alt = file.name;
        root.append(img);
        images.push(img);
      }
    }
    const errors: string[] = [];
    let total = 0;
    for (let i = 0; i < images.length; i++) {
      const img = images[i],
        source = img.getAttribute("src") || "";
      if (this.resolve(source, note)) continue;
      if (!this.plugin.settings.htmlImportImages) {
        errors.push(
          "Image import is disabled; original image references were retained.",
        );
        continue;
      }
      try {
        const attached = files.length === images.length ? files[i] : undefined;
        const data =
          attached ??
          new File(
            [(await this.bytes(source, note)).bytes],
            img.alt || "image",
          );
        total += data.size;
        if (total > 32 * 1024 * 1024)
          throw new Error("Image batch exceeds 32 MB.");
        img.setAttribute("src", await this.store(data, note, i + 1));
      } catch (error) {
        // Retain the reference and alt text: the rendered editor adds a visible warning, never drops the image.
        if (!img.alt) img.alt = "Image unavailable — paste the image file";
        errors.push(`${img.alt}: ${String(error)}`);
      }
    }
    await this.plugin.persist();
    return errors;
  }
}
