import { Notice, TFile, TFolder } from "obsidian";
import type VisualKit from "../main";
import { askText } from "../ui";
import { ensureFolder, uniquePath } from "../paste/ImageFileWriter";
import { safeName } from "../paste/ImageNamingService";
import { HtmlNoteView, HTML_VIEW } from "./HtmlNoteView";
import { newDocument, parseHtml, replaceBody } from "./HtmlDocument";
import { vaultPath, relativeImage } from "./Assets";
import { registerHtmlNoteButton } from "./ExplorerButton";

export async function createHtmlNote(
  plugin: VisualKit,
  folder: string,
  name: string,
  source = newDocument(),
  sourcePath?: string,
) {
  // Obsidian represents the vault root TFolder.path as "/".
  const normalized = folder === "/" ? "" : folder.replaceAll("\\", "/");
  if (/^\/|^[A-Za-z]:|(?:^|\/)\.\.(?:\/|$)/.test(normalized))
    throw new Error(
      "HTML note folder must be relative to the vault (for example, HTML Notes).",
    );
  const basename = safeName(name.replace(/\.html?$/i, "").trim() || "Untitled");
  await ensureFolder(plugin.app, normalized);
  const path = uniquePath(plugin.app, normalized, `${basename}.html`);
  if (sourcePath) {
    const doc = parseHtml(source);
    let changed = false;
    for (const image of doc.querySelectorAll("img[src]")) {
      const target = vaultPath(image.getAttribute("src")!, sourcePath);
      if (target) {
        image.setAttribute("src", relativeImage(target, path));
        changed = true;
      }
    }
    if (changed) source = replaceBody(source, doc.body.innerHTML);
  }
  // Vault.create also rejects collisions occurring after this check.
  return plugin.app.vault.create(path, source);
}

export function registerHtmlNotes(plugin: VisualKit) {
  if (!plugin.settings.htmlNotes) return;
  const run = (action: () => Promise<unknown>) => {
    void action().catch((error) => new Notice(String(error), 12000));
  };
  plugin.registerView(
    HTML_VIEW,
    (leaf) =>
      new HtmlNoteView(leaf, plugin, (file) => saveHtmlTemplate(plugin, file)),
  );
  if (plugin.settings.htmlRegisterExtensions) {
    for (const extension of ["html", "htm"]) {
      try {
        plugin.registerExtensions([extension], HTML_VIEW);
      } catch {
        new Notice(
          `Another plugin handles .${extension} files. Visual Kit kept that handler. Use Open in HTML notes from the file menu, or disable automatic HTML file handling in settings and reload.`,
          15000,
        );
      }
    }
  }
  const open = async (file: TFile) => {
    const leaf = plugin.app.workspace.getLeaf("tab");
    await leaf.setViewState({
      type: HTML_VIEW,
      state: { file: file.path },
      active: true,
    });
  };
  const create = async (folder?: string) => {
    const templates = plugin.app.vault
      .getFiles()
      .filter(
        (file) =>
          file.path.startsWith("HTML Templates/") &&
          /\.html?$/i.test(file.path),
      )
      .sort((a, b) => a.path.localeCompare(b.path));
    let template = "";
    const name = await askText(
      plugin.app,
      "Create HTML note",
      "Untitled",
      "Create",
      (container) => {
        container.classList.add("vk-create-note");
        const label = createEl("label", {
          text: "Template",
          cls: "vk-template-label",
        });
        const select = createEl("select", {
          attr: { "aria-label": "Template" },
        });
        select.append(createEl("option", { text: "Blank note", value: "" }));
        for (const file of templates)
          select.append(
            createEl("option", {
              text: file.path.slice("HTML Templates/".length),
              value: file.path,
            }),
          );
        select.onchange = () => {
          template = select.value;
        };
        label.append(select);
        container.append(label);
      },
    );
    if (name === null) return;
    const file = await createHtmlNote(
      plugin,
      folder ??
        (plugin.settings.htmlFolder ||
          plugin.app.workspace.getActiveFile()?.parent?.path ||
          ""),
      name,
      template
        ? await plugin.app.vault.read(
            templates.find((file) => file.path === template)!,
          )
        : newDocument(),
      template || undefined,
    );
    await open(file);
  };
  plugin.registerVisualCommand({
    id: "create-html-note",
    name: "Create HTML note",
    callback: () => run(() => create()),
  });
  registerHtmlNoteButton(plugin, () => run(() => create()));
  plugin.registerVisualCommand({
    id: "save-html-template",
    name: "Save current HTML note as template",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file || !/\.html?$/i.test(file.path)) return false;
      if (!checking) run(() => saveHtmlTemplate(plugin, file));
      return true;
    },
  });
  for (const [id, name, whole] of [
    ["copy-as-rich-html", "Copy as rich HTML", false],
    ["copy-whole-html-note", "Copy whole HTML note", true],
  ] as const)
    plugin.registerVisualCommand({
      id,
      name,
      checkCallback: (checking) => {
        const view = plugin.app.workspace.getActiveViewOfType(HtmlNoteView);
        if (!view) return false;
        if (!checking) run(() => view.copy(whole));
        return true;
      },
    });
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof TFolder)
        menu.addItem((item) =>
          item
            .setTitle("Create HTML note")
            .setIcon("file-plus")
            .onClick(() => run(() => create(file.path))),
        );
      if (file instanceof TFile && /\.html?$/i.test(file.path)) {
        menu.addItem((item) =>
          item
            .setTitle("Save as HTML template")
            .setIcon("file-plus")
            .onClick(() => run(() => saveHtmlTemplate(plugin, file))),
        );
        menu.addItem((item) =>
          item
            .setTitle("Open in HTML notes")
            .setIcon("file-code")
            .onClick(() => run(() => open(file))),
        );
      }
    }),
  );
}

async function saveHtmlTemplate(plugin: VisualKit, file: TFile) {
  const name = await askText(
    plugin.app,
    "Save HTML template",
    file.basename,
    "Save template",
  );
  if (name === null) return;
  const view = plugin.app.workspace
    .getLeavesOfType(HTML_VIEW)
    .map((leaf) => leaf.view)
    .find(
      (view): view is HtmlNoteView =>
        view instanceof HtmlNoteView && view.file === file,
    );
  if (view) await view.save();
  await createHtmlNote(
    plugin,
    "HTML Templates",
    name,
    await plugin.app.vault.read(file),
    file.path,
  );
  new Notice("Template saved. Choose it when creating an HTML note.");
}
