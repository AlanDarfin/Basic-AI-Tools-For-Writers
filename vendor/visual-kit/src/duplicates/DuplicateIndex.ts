import { App, TFile } from "obsidian";
import { isImage } from "../sizing/ImageEmbedParser";
import { imageHash } from "./ImageHasher";
export interface HashEntry {
  hash: string;
  path: string;
  size: number;
  modifiedAt: number;
}
export class DuplicateIndex {
  entries = new Map<string, HashEntry>();
  constructor(private app: App) {}
  async update(file: TFile) {
    if (!isImage(file.path)) return;
    const path = file.path,
      modifiedAt = file.stat.mtime,
      size = file.stat.size;
    const hash = await imageHash(await this.app.vault.readBinary(file));
    if (
      file.path === path &&
      file.stat.mtime === modifiedAt &&
      this.app.vault.getAbstractFileByPath(path) === file
    )
      this.entries.set(path, { hash, path, size, modifiedAt });
  }
  async rebuild(progress?: (done: number, total: number) => void) {
    this.entries.clear();
    const files = this.app.vault.getFiles().filter((f) => isImage(f.path));
    for (let i = 0; i < files.length; i++) {
      await this.update(files[i]);
      progress?.(i + 1, files.length);
    }
  }
  async find(
    hash: string,
    folder: string,
    notePath: string,
    referenced: string[],
  ): Promise<TFile[]> {
    // Discover files missing from a persisted cache and refresh changed entries.
    for (const file of this.app.vault
      .getFiles()
      .filter((f) => isImage(f.path))) {
      const entry = this.entries.get(file.path);
      if (
        !entry ||
        entry.size !== file.stat.size ||
        entry.modifiedAt !== file.stat.mtime
      )
        await this.update(file);
    }
    const matches: TFile[] = [];
    for (const [path, entry] of this.entries) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        this.entries.delete(path);
        continue;
      }
      if (entry.hash === hash) {
        // Revalidate bytes: index is never the source of truth.
        await this.update(file);
        if (this.entries.get(path)?.hash === hash) matches.push(file);
      }
    }
    const parent = notePath.split("/").slice(0, -1);
    const rank = (f: TFile) => {
      if (
        f.parent?.path === folder ||
        (folder && f.path.startsWith(folder + "/"))
      )
        return 100000;
      if (referenced.includes(f.path)) return 90000;
      const parts = f.path.split("/");
      let shared = 0;
      while (shared < parent.length && parts[shared] === parent[shared])
        shared++;
      return shared * 100 - parts.length;
    };
    return matches.sort(
      (a, b) => rank(b) - rank(a) || a.path.localeCompare(b.path),
    );
  }
}
