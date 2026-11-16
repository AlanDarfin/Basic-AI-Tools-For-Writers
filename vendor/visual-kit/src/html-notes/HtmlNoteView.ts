import { setIcon, FileView, Notice, TFile, type WorkspaceLeaf } from "obsidian";
import type { EditorView } from "@codemirror/view";
import type VisualKit from "../main";
import { askText, choose } from "../ui";
import { imageFiles } from "../paste/ClipboardImageReader";
import { uniquePath } from "../paste/ImageFileWriter";
import { ImageEditorView } from "../editor/ImageEditorView";
import {
  HtmlDocument,
  parseHtml,
  sanitizeHtml,
  htmlElement,
  setSafeHtml,
  replaceBody,
  inertRoot,
} from "./HtmlDocument";
import { HtmlPersistence } from "./Persistence";
import { HtmlAssets, relativeImage, vaultPath } from "./Assets";
import { copyHtml } from "./Clipboard";
import { VisualEditor } from "./VisualEditor";
import { sourceEditor } from "./SourceEditor";
import { fullPreview } from "./FullPreview";

export const HTML_VIEW = "basic-visual-kit-html-note";
export type HtmlMode = "visual" | "source" | "preview";

export class HtmlNoteView extends FileView {
  private model?: HtmlDocument;
  private persistence?: HtmlPersistence;
  private visual?: VisualEditor;
  private source?: EditorView;
  private mode: HtmlMode = "visual";
  private toolbar!: HTMLElement;
  private status!: HTMLElement;
  private surface!: HTMLElement;
  private actions!: HTMLElement;
  private timer?: number;
  private assets: HtmlAssets;
  private generation = 0;
  private blocked = false;
  private referencePath = "";
  constructor(
    leaf: WorkspaceLeaf,
    private plugin: VisualKit,
    private saveTemplate?: (file: TFile) => Promise<void>,
  ) {
    super(leaf);
    this.assets = new HtmlAssets(plugin);
  }
  getViewType() {
    return HTML_VIEW;
  }
  getIcon() {
    return "file-code";
  }
  canAcceptExtension(extension: string) {
    return ["html", "htm"].includes(extension.toLowerCase());
  }
  async onOpen() {
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file !== this.file) return;
        const observed = this.persistence;
        this.run(async () => {
          const persistence = observed;
          if (!persistence || !(file instanceof TFile)) return;
          await persistence.whenIdle();
          const disk = await this.app.vault.read(file);
          if (persistence !== this.persistence || disk === persistence.baseline)
            return;
          if (persistence.dirty)
            this.conflict(
              "File changed outside this editor. Your edits are retained.",
            );
          else await this.onLoadFile(file);
        });
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file === this.file)
          this.conflict(
            "File deleted. Save a copy to preserve this editor's contents.",
          );
      }),
    );
  }
  async onLoadFile(file: TFile, discard = false) {
    const previous = this.persistence;
    const generation = ++this.generation;
    const data = await this.app.vault.read(file);
    if (generation !== this.generation) return;
    if (
      !discard &&
      previous &&
      previous === this.persistence &&
      this.referencePath === file.path &&
      previous.dirty
    ) {
      this.conflict(
        "The file changed while you were editing. Your edits were retained; reload explicitly or save a copy.",
      );
      return;
    }
    this.cancelTimer();
    this.disposeEditors();
    this.blocked = false;
    this.model = new HtmlDocument(data, this.contentEl.ownerDocument);
    this.referencePath = file.path;
    this.persistence = new HtmlPersistence(data, (change) =>
      this.app.vault.process(file, change),
    );
    this.contentEl.empty();
    this.contentEl.addClass("vk-html-note");
    this.toolbar = this.contentEl.createDiv({
      cls: "vk-html-toolbar",
      attr: { role: "toolbar", "aria-label": "HTML note controls" },
    });
    for (const mode of ["visual", "source", "preview"] as const)
      this.button(this.toolbar, mode[0].toUpperCase() + mode.slice(1), () =>
        this.setMode(mode),
      );
    this.button(this.toolbar, "Save", () => this.save(), "save");
    this.button(
      this.toolbar,
      "Copy as rich HTML",
      () => this.copy(false),
      "copy",
    );
    this.button(this.toolbar, "Copy whole note", () => this.copy(true));
    if (this.saveTemplate)
      this.button(
        this.toolbar,
        "Save as HTML template",
        () => this.file && this.saveTemplate?.(this.file),
        "file-plus",
      );
    this.status = this.contentEl.createDiv({
      cls: "vk-html-status",
      attr: { role: "status", "aria-live": "polite" },
    });
    this.actions = this.contentEl.createDiv({ cls: "vk-html-actions" });
    this.surface = this.contentEl.createDiv({ cls: "vk-html-surface" });
    this.setMode(this.plugin.settings.htmlDefaultMode);
  }
  private run(action: () => unknown, icon?: string) {
    void Promise.resolve()
      .then(action)
      .catch((error) => {
        this.message(String(error));
        new Notice(String(error), 12000);
      });
  }
  private message(text: string) {
    if (this.status) this.status.textContent = text;
  }
  private button(
    parent: HTMLElement,
    label: string,
    action: () => unknown,
    icon?: string,
  ) {
    const button = parent.createEl("button", {
      text: icon ? undefined : label,
      attr: { title: label, "aria-label": label },
    });
    if (icon) setIcon(button, icon);
    button.onmousedown = (event) => {
      if (event.button === 0) {
        this.visual?.capture();
        event.preventDefault();
      }
    };
    button.onclick = () => this.run(action);
    return button;
  }
  private select(
    parent: HTMLElement,
    label: string,
    options: Record<string, string>,
    action: (value: string) => void,
  ) {
    const wrapper = parent.createEl("label", { text: label });
    const select = wrapper.createEl("select", {
      attr: { "aria-label": label },
    });
    for (const [value, text] of Object.entries(options))
      select.createEl("option", { value, text });
    select.onmousedown = () => this.visual?.capture();
    select.onchange = () => this.run(() => action(select.value));
    return select;
  }
  private setMode(mode: HtmlMode) {
    if (!this.model) return;
    if (mode === "visual" && this.model.safe.issues.length) {
      mode = "source";
      this.message(
        this.model.safe.issues.join(" ") +
          " Original source retained. Visual editing is locked until these are resolved.",
      );
    } else
      this.message(
        this.blocked
          ? "Resolve the file conflict before saving."
          : "Changes autosave after 800 ms. Images resize their display only.",
      );
    this.disposeEditors();
    this.surface.empty();
    this.actions.empty();
    this.mode = mode;
    for (const button of this.toolbar.querySelectorAll("button")) {
      const label = button.getAttribute("aria-label")?.toLowerCase();
      if (label && ["visual", "source", "preview"].includes(label))
        button.setAttribute("aria-pressed", String(label === mode));
    }
    this.generation++;
    if (mode === "source") {
      this.source = sourceEditor(
        this.surface,
        this.model.source,
        (value) => this.updateSource(value),
        () => this.run(() => this.save()),
      );
    } else if (mode === "preview" && this.model.safe.issues.length) {
      fullPreview(this.surface, this.model.source, (source) => {
        const file = this.file && this.assets.resolve(source, this.file);
        return file ? this.app.vault.getResourcePath(file) : undefined;
      });
      this.message(
        "Full document preview. Edit complex layouts and stylesheets in Source mode.",
      );
    } else {
      this.visual = new VisualEditor(
        this.surface,
        this.model.safe.html,
        this.model.safe.bodyStyle,
        mode === "preview",
        (html) => this.updateBody(html),
        (event) => this.run(() => this.paste(event)),
        (event) => {
          event.preventDefault();
          this.run(() => this.copy(false));
        },
        (event) => {
          if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "s"
          ) {
            event.preventDefault();
            this.run(() => this.save());
          }
        },
        (message) => this.message(message),
      );
      this.visual.resource = (source) => {
        const file = this.file && this.assets.resolve(source, this.file);
        return file && /^(png|jpe?g|gif|webp|bmp|avif)$/i.test(file.extension)
          ? this.app.vault.getResourcePath(file)
          : undefined;
      };
      if (mode === "visual") this.formatting();
    }
    if (this.blocked)
      this.conflict("Conflict: edits retained. Save a copy or reload.");
  }
  private formatting() {
    const bar = this.actions;
    const more = this.overflow(bar, "More formatting");
    const tables = this.overflow(bar, "Table");
    const images = this.overflow(bar, "Image");
    const icons: Record<string, string> = {
      bold: "bold",
      italic: "italic",
      underline: "underline",
      insertUnorderedList: "list",
      insertOrderedList: "list-ordered",
    };
    for (const [label, command] of [
      ["Bold", "bold"],
      ["Italic", "italic"],
      ["Underline", "underline"],
      ["Strikethrough", "strikeThrough"],
      ["Subscript", "subscript"],
      ["Superscript", "superscript"],
      ["Clear formatting", "removeFormat"],
      ["Bullets", "insertUnorderedList"],
      ["Numbered list", "insertOrderedList"],
      ["Left", "justifyLeft"],
      ["Center", "justifyCenter"],
      ["Right", "justifyRight"],
      ["Justify", "justifyFull"],
      ["Separator", "insertHorizontalRule"],
    ])
      this.button(
        icons[command] ? bar : more,
        label,
        () => this.visual?.command(command),
        icons[command],
      );
    this.select(
      bar,
      "Block",
      {
        p: "Paragraph",
        h1: "Heading 1",
        h2: "Heading 2",
        h3: "Heading 3",
        h4: "Heading 4",
        h5: "Heading 5",
        h6: "Heading 6",
        blockquote: "Quote",
        pre: "Preformatted",
      },
      (value) => this.visual?.command("formatBlock", value),
    );
    this.select(
      more,
      "Font",
      {
        Arial: "Arial",
        "Times New Roman": "Times New Roman",
        Georgia: "Georgia",
        Verdana: "Verdana",
        "Courier New": "Courier New",
      },
      (value) => this.visual?.command("fontName", value),
    );
    this.select(
      more,
      "Size",
      {
        "2": "10 pt",
        "3": "12 pt",
        "4": "14 pt",
        "5": "18 pt",
        "6": "24 pt",
        "7": "36 pt",
      },
      (value) => this.visual?.command("fontSize", value),
    );
    for (const [label, command] of [
      ["Text color", "foreColor"],
      ["Highlight", "hiliteColor"],
    ]) {
      const wrapper = more.createEl("label", { text: label });
      const input = wrapper.createEl("input", {
        type: "color",
        attr: { "aria-label": label },
      });
      input.onmousedown = () => this.visual?.capture();
      input.oninput = () => this.visual?.command(command, input.value);
    }
    this.button(bar, "Link", async () => {
      const value = await askText(
        this.app,
        "Link URL (https, http, mailto or #)",
        "https://",
      );
      if (value && /^(https?:|mailto:|#)/i.test(value))
        this.visual?.command("createLink", value);
    });
    this.button(more, "Remove link", () => this.visual?.command("unlink"));
    this.button(bar, "Undo", () => this.visual?.undo(), "undo-2");
    this.button(bar, "Redo", () => this.visual?.undo(true), "redo-2");
    this.button(tables, "Insert table", async () => {
      const input = await askText(
        this.app,
        "Table size: rows x columns (1–30 each)",
        "3x3",
      );
      if (!input) return;
      const match = /^(\d+)\s*x\s*(\d+)$/i.exec(input.trim());
      if (
        !match ||
        +match[1] < 1 ||
        +match[1] > 30 ||
        +match[2] < 1 ||
        +match[2] > 30
      )
        throw new Error("Use rows x columns, each between 1 and 30.");
      this.visual?.insert(
        `<table style="border-collapse:collapse"><tbody>${Array.from({ length: +match[1] }, () => `<tr>${'<td style="border:1px solid #bbb;padding:6px"><br></td>'.repeat(+match[2])}</tr>`).join("")}</tbody></table><p><br></p>`,
      );
    });
    for (const action of [
      "Add row",
      "Delete row",
      "Add column",
      "Delete column",
      "Cell color",
      "Cell border",
    ])
      this.button(tables, action, () => this.table(action));
    this.button(images, "Insert image", () => {
      const input = htmlElement("input", this.contentEl.ownerDocument);
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = () =>
        this.run(() => this.pasteFiles(Array.from(input.files || [])));
      input.click();
    });
    this.button(images, "Resize image", () => this.resizeImage());
    this.button(images, "Remove image", () => {
      const image = this.visual?.selectedImage();
      if (!image) throw new Error("Select an image first.");
      this.visual?.mutate(() => image.remove());
    });
    this.button(images, "Import linked images", () => this.importLinked());
    this.button(images, "Annotate image", () => this.annotate());
  }
  private overflow(parent: HTMLElement, label: string) {
    const details = parent.createEl("details", { cls: "vk-html-overflow" });
    const summary = details.createEl("summary", { text: label });
    summary.onmousedown = () => this.visual?.capture();
    details.ontoggle = () => {
      if (details.open)
        for (const other of parent.querySelectorAll("details[open]"))
          if (other !== details) other.removeAttribute("open");
    };
    return details.createDiv({ cls: "vk-html-overflow-panel" });
  }
  private async table(action: string) {
    const cell = this.visual?.selectedCell();
    if (!cell) throw new Error("Place the cursor in a table cell first.");
    const row = cell.parentElement as HTMLTableRowElement,
      table = cell.closest("table")!;
    // A full grid transformation is required for merged cells. Preserve spans instead of guessing.
    if (
      /row|column/.test(action) &&
      Array.from(table.querySelectorAll("td,th")).some(
        (cell) =>
          +(cell.getAttribute("rowspan") || 1) !== 1 ||
          +(cell.getAttribute("colspan") || 1) !== 1,
      )
    )
      throw new Error(
        "Row and column operations on merged cells require Source mode. Existing spans are preserved.",
      );
    let color: string | null = null;
    if (action === "Cell color" || action === "Cell border") {
      color = await askText(this.app, `${action} (#RRGGBB)`, "#dddddd");
      if (!color) return;
      if (!/^#[0-9a-f]{6}$/i.test(color))
        throw new Error("Use a six-digit hexadecimal color.");
    }
    this.visual?.mutate((doc) => {
      if (action === "Add row") {
        const next = row.cloneNode(true) as HTMLTableRowElement;
        for (const item of next.cells)
          item.replaceChildren(htmlElement("br", doc));
        row.after(next);
      }
      if (action === "Delete row") row.remove();
      if (action === "Add column")
        for (const item of Array.from(table.rows)) {
          const next = htmlElement("td", doc);
          document.body.setCssStyles.call(next, { border: "1px solid #bbb" });
          next.append(htmlElement("br", doc));
          item.insertBefore(next, item.cells[cell.cellIndex + 1] || null);
        }
      if (action === "Delete column")
        for (const item of Array.from(table.rows))
          item.cells[cell.cellIndex]?.remove();
      if (action === "Cell color") cell.style.backgroundColor = color!;
      if (action === "Cell border") cell.style.border = `1px solid ${color!}`;
    });
  }
  private async resizeImage() {
    const image = this.visual?.selectedImage();
    if (!image) throw new Error("Select an image first.");
    const input = await askText(
      this.app,
      "Image display size: width or width x height (pixels)",
      image.getAttribute("width") || "600",
    );
    if (!input) return;
    const match = /^(\d+)(?:\s*x\s*(\d+))?$/i.exec(input.trim());
    if (
      !match ||
      [+match[1], ...(match[2] ? [+match[2]] : [])].some(
        (n) => n < 1 || n > 16384,
      )
    )
      throw new Error("Image dimensions must be between 1 and 16384 pixels.");
    this.visual?.mutate(() => {
      image.width = +match[1];
      image.style.width = `${match[1]}px`;
      if (match[2]) {
        image.height = +match[2];
        image.style.height = `${match[2]}px`;
      } else {
        image.removeAttribute("height");
        document.body.setCssStyles.call(image, { height: "auto" });
      }
    });
  }
  private annotate() {
    const image = this.visual?.selectedImage(),
      note = this.file;
    if (!image || !note) throw new Error("Select a local image first.");
    const file = this.assets.resolve(
      image.getAttribute("data-vk-source") || "",
      note,
    );
    if (!file)
      throw new Error("Import the image into the vault before annotating it.");
    const before = this.model!.source,
      editor = this.visual;
    new ImageEditorView(this.plugin, file, undefined, "select", undefined, {
      note,
      apply: async (path) => {
        if (
          this.file !== note ||
          this.model?.source !== before ||
          this.visual !== editor ||
          !image.isConnected
        ) {
          new Notice(
            "Note changed. Annotated image saved in the vault; reference was not replaced.",
          );
          return;
        }
        const answer = await choose(this.app, "Update HTML image", path, [
          { label: "Use annotated image", value: "replace" },
        ]);
        if (answer && this.model?.source === before && image.isConnected)
          editor?.mutate(() => {
            image.removeAttribute("data-vk-source");
            image.src = relativeImage(path, note.path);
          });
      },
    }).open();
  }
  private updateBody(body: string) {
    try {
      this.model!.editBody(body);
      this.changed();
    } catch (error) {
      // Preserve the complete editable representation if Chromium introduces
      // unsupported markup. Never replace it with a sanitized approximation.
      this.model!.setSource(replaceBody(this.model!.source, body));
      this.changed();
      this.setMode("source");
      this.message(`Visual changes retained in source mode. ${String(error)}`);
      new Notice(
        "Visual changes retained in source mode; review unsupported markup before returning to visual.",
        12000,
      );
    }
  }
  private updateSource(source: string) {
    // Keep literal source even while the user is halfway through typing a tag.
    this.model!.setSource(source);
    this.changed();
  }
  private changed() {
    this.persistence!.current = this.model!.source;
    this.cancelTimer();
    if (!this.blocked)
      this.timer = window.setTimeout(() => this.run(() => this.save()), 800);
    this.message(
      this.blocked
        ? "Conflict: edits retained. Save a copy or reload."
        : "Unsaved changes…",
    );
  }
  async save() {
    this.cancelTimer();
    if (!this.persistence) return;
    if (this.blocked)
      throw new Error("Resolve the file conflict before saving.");
    try {
      await this.persistence.save();
      this.message(
        this.persistence.dirty ? "Unsaved changes…" : "Saved locally.",
      );
    } catch (error) {
      this.conflict(String(error));
      throw error;
    }
  }
  private conflict(message: string) {
    this.blocked = true;
    this.cancelTimer();
    this.message(message);
    if (!this.actions) return;
    this.actions.empty();
    this.button(this.actions, "Reload from disk", async () => {
      const answer = await choose(
        this.app,
        "Reload HTML note",
        "Discard this editor's unsaved changes and reload the file? Save a copy first to retain them.",
        [{ label: "Reload and discard edits", value: "reload" }],
      );
      if (answer && this.file) await this.onLoadFile(this.file, true);
    });
    this.button(this.actions, "Save edits as copy", () => this.saveCopy());
    this.button(this.actions, "Resolve in Source mode", () => {
      this.setMode("source");
      this.conflict(
        "Compare your retained source with the disk file. Save as a copy, then reload to merge changes explicitly.",
      );
    });
  }
  private async saveCopy() {
    if (!this.file || !this.model) return;
    const path = uniquePath(
      this.app,
      this.file.parent?.path || "",
      `${this.file.basename}-recovered.html`,
    );
    const copy = await this.app.vault.create(path, this.model.source);
    new Notice(`Edits preserved in ${copy.path}`, 10000);
    return copy;
  }
  async copy(whole = false) {
    if (!this.file || !this.model) return;
    const selection = whole ? undefined : this.visual?.selectedHtml();
    if (!whole && !selection)
      throw new Error(
        "Select formatted content first, or choose Copy whole note.",
      );
    if (!selection && this.model.safe.issues.length)
      throw new Error(
        "This document contains unsupported markup. Review Source mode before copying a safe selection from Preview.",
      );
    await copyHtml(
      this.plugin,
      this.file,
      selection || this.model.safe.html,
      this.model.safe.bodyStyle,
    );
    new Notice("Rich HTML and plain text copied");
  }
  private async paste(event: ClipboardEvent | DragEvent) {
    const data =
      "clipboardData" in event ? event.clipboardData : event.dataTransfer;
    const files = imageFiles(data),
      html = data?.getData("text/html") || "";
    if (!html) {
      if (files.length) await this.pasteFiles(files);
      else {
        const root = htmlElement("div");
        const text = data?.getData("text/plain") || "";
        text.split(/\r?\n/).forEach((line) => {
          const p = htmlElement("p");
          root.append(p);
          if (line) p.textContent = line;
          else p.append(htmlElement("br"));
        });
        this.visual?.insert(root.innerHTML);
      }
      return;
    }
    const safe = sanitizeHtml(html, document, true);
    const insertion = this.visual?.insertionRange();
    const generation = this.generation,
      before = this.model!.source,
      note = this.file!;
    const root = inertRoot();
    setSafeHtml(root, safe.html);
    if (safe.bodyStyle) {
      const wrapper = htmlElement("div", root.ownerDocument);
      wrapper.setAttribute("style", safe.bodyStyle);
      wrapper.append(...root.childNodes);
      root.append(wrapper);
    }
    // Text-only pastes need no attachment import or asynchronous vault work.
    const errors =
      root.querySelector("img") || files.length
        ? await this.assets.import(root, note, files)
        : [];
    if (
      generation !== this.generation ||
      before !== this.model?.source ||
      note !== this.file
    ) {
      const recovery = await this.app.vault.create(
        uniquePath(
          this.app,
          note.parent?.path || "",
          `${note.basename}-paste.html`,
        ),
        root.innerHTML,
      );
      throw new Error(
        `Note changed during paste. Pasted content preserved in ${recovery.path}.`,
      );
    }
    this.visual?.insert(root.innerHTML, insertion);
    if (safe.issues.length)
      new Notice(
        "Unsupported formatting was removed from pasted content.",
        8000,
      );
    if (errors.length) new Notice(errors.join("\n"), 15000);
  }
  private async pasteFiles(files: File[]) {
    const insertion = this.visual?.insertionRange();
    const generation = this.generation,
      before = this.model!.source,
      note = this.file!;
    const root = inertRoot(),
      errors = await this.assets.import(root, note, files);
    if (generation !== this.generation || before !== this.model?.source) {
      const recovery = await this.app.vault.create(
        uniquePath(
          this.app,
          note.parent?.path || "",
          `${note.basename}-paste.html`,
        ),
        root.innerHTML,
      );
      throw new Error(
        `Note changed. Imported images preserved in ${recovery.path}.`,
      );
    }
    this.visual?.insert(root.innerHTML, insertion);
    if (errors.length) new Notice(errors.join("\n"), 15000);
  }
  private async importLinked() {
    if (!this.model || !this.file) return;
    if (this.model.safe.issues.length)
      throw new Error(
        "Resolve unsupported markup in Source mode before importing images.",
      );
    const before = this.model.source,
      note = this.file,
      generation = this.generation;
    const parsed = parseHtml(before),
      errors = await this.assets.import(parsed.body, note);
    if (generation !== this.generation || before !== this.model.source)
      throw new Error(
        "Note changed during import. Saved attachments remain available; retry the import.",
      );
    this.model.editBody(parsed.body.innerHTML);
    this.changed();
    this.setMode(this.mode);
    if (errors.length) new Notice(errors.join("\n"), 15000);
  }
  async onRename(file: TFile) {
    const oldPath = this.referencePath;
    await super.onRename(file);
    this.referencePath = file.path;
    if (
      !this.model ||
      oldPath.split("/").slice(0, -1).join("/") === file.parent?.path
    )
      return;
    if (this.model.safe.issues.length) {
      this.message(
        "File moved. Unsupported source is preserved; update relative image paths in Source mode.",
      );
      return;
    }
    const root = parseHtml(this.model.safe.html).body;
    let changed = false;
    for (const img of root.querySelectorAll("img")) {
      const path = vaultPath(img.getAttribute("src") || "", oldPath);
      if (path) {
        img.setAttribute("src", relativeImage(path, file.path));
        changed = true;
      }
    }
    if (changed) {
      this.model.editBody(root.innerHTML);
      this.changed();
      this.setMode(this.mode);
    }
  }
  private cancelTimer() {
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
  }
  private disposeEditors() {
    this.visual?.destroy();
    this.visual = undefined;
    this.source?.destroy();
    this.source = undefined;
  }
  async onUnloadFile() {
    this.cancelTimer();
    this.surface?.setAttribute("inert", "");
    if (this.persistence?.dirty) {
      try {
        while (this.persistence.dirty) await this.save();
      } catch {
        await this.saveCopy();
      }
    }
    ++this.generation;
    this.disposeEditors();
    this.persistence = undefined;
    this.model = undefined;
  }
  async onClose() {
    await this.onUnloadFile();
    this.contentEl.empty();
  }
}
