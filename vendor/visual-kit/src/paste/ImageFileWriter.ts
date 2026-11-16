import { App, normalizePath } from "obsidian";
export async function ensureFolder(app: App, folder: string) {
  const parts = folder.split("/").filter(Boolean);
  let path = "";
  for (const part of parts) {
    path = path ? `${path}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(path))
      await app.vault.createFolder(path);
  }
}
export function uniquePath(app: App, folder: string, name: string): string {
  const base = normalizePath(folder ? `${folder}/${name}` : name);
  let path = base,
    count = 1;
  while (app.vault.getAbstractFileByPath(path))
    path = base.replace(/(\.[^.]+)$/, `-${count++}$1`);
  return path;
}
