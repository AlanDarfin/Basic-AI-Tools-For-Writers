import { imageDataBytes } from "../clipboard/ImageData";
import { Modal, Notice, TFile, Editor } from "obsidian";
import {
  Canvas,
  FabricImage,
  FabricObject,
  Rect,
  Ellipse,
  Textbox,
  Circle,
  Group,
  Polygon,
  PencilBrush,
  Point,
  Color,
} from "fabric";
import type VisualKit from "../main";
import { HistoryManager } from "./history/HistoryManager";
import {
  AnnotationDocument,
  parseAnnotation,
} from "./persistence/AnnotationSerializer";
import { imageMime, toDataURL, writeImage } from "../clipboard/ClipboardWriter";
import { askText, choose } from "../ui";
import { ensureFolder, uniquePath } from "../paste/ImageFileWriter";
import { imageFolder, safeName } from "../paste/ImageNamingService";
import { ImageEmbed } from "../sizing/ImageEmbedParser";
FabricObject.customProperties = [...FabricObject.customProperties, "data"];
type Tool =
  | "select"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "text"
  | "draw"
  | "number"
  | "highlight"
  | "redaction"
  | "crop";
export interface EmbedContext {
  editor: Editor;
  note: TFile;
  embed: ImageEmbed;
  before: string;
}
export interface HtmlAnnotationTarget {
  note: TFile;
  apply(path: string): Promise<void>;
}
export class ImageEditorView extends Modal {
  private canvas!: Canvas;
  private source = "";
  private crop = { x: 0, y: 0, width: 0, height: 0 };
  private nextMarker = 1;
  private history = new HistoryManager<AnnotationDocument>();
  private restoring = false;
  private dirty = false;
  private busy = false;
  private loaded = false;
  private tool: Tool = "select";
  private start?: Point;
  private preview?: FabricObject;
  private space = false;
  private pan?: { x: number; y: number };
  private color: string;
  private lineWidth: number;
  private fontSize: number;
  private opacity = 1;
  private fill = false;
  private rounded = false;
  private bold = false;
  private align: "left" | "center" | "right" = "left";
  private background = false;
  private arrowSize = 18;
  private viewport!: HTMLDivElement;
  private status!: HTMLElement;
  private abort = new AbortController();
  private toolButtons = new Map<Tool, HTMLButtonElement>();
  constructor(
    private plugin: VisualKit,
    private file: TFile,
    private context?: EmbedContext,
    private initial: Tool = "select",
    initialColor?: string,
    private htmlTarget?: HtmlAnnotationTarget,
  ) {
    super(plugin.app);
    this.color = initialColor ?? plugin.settings.color;
    this.lineWidth = plugin.settings.lineWidth;
    this.fontSize = plugin.settings.fontSize;
  }
  onOpen() {
    this.modalEl.addClass("qrc-editor");
    this.titleEl.setText(`Annotate — ${this.file.name}`);
    void this.initialize().catch((e) => {
      new Notice(String(e));
      this.close();
    });
  }
  private button(parent: HTMLElement, label: string, action: () => void) {
    const b = parent.createEl("button", { text: label });
    b.onclick = action;
    return b;
  }
  private run(action: () => Promise<void>) {
    if (this.busy) return;
    this.busy = true;
    void action()
      .catch((e) => new Notice(String(e), 10000))
      .finally(() => (this.busy = false));
  }
  private async initialize() {
    if (this.file.extension.toLowerCase() === "gif") {
      const choice = await choose(
        this.app,
        "Animated image",
        "Annotation exports a static PNG frame. The GIF will remain unchanged.",
        [{ label: "Edit static frame", value: "yes" }],
      );
      if (!choice) {
        this.close();
        return;
      }
    }
    const tools = this.contentEl.createDiv({ cls: "qrc-toolbar" });
    const names: [Tool, string][] = [
      ["select", "Select (V)"],
      ["arrow", "Arrow (A)"],
      ["rectangle", "Rectangle (R)"],
      ["ellipse", "Ellipse (E)"],
      ["text", "Text (T)"],
      ["draw", "Draw (D)"],
      ["number", "Number (N)"],
      ["highlight", "Highlight (H)"],
      ["redaction", "Redaction"],
      ["crop", "Crop"],
    ];
    for (const [tool, label] of names)
      this.toolButtons.set(
        tool,
        this.button(tools, label, () => this.setTool(tool)),
      );
    const props = this.contentEl.createDiv({ cls: "qrc-toolbar" });
    for (const [label, color] of [
      ["Error", "#ef4444"],
      ["Attention", "#facc15"],
      ["Success", "#22c55e"],
      ["Info", "#3b82f6"],
      ["White", "#ffffff"],
      ["Black", "#000000"],
    ]) {
      const b = this.button(props, label, () => {
        this.color = color;
        this.applyProperties();
      });
      b.setCssStyles({ borderBottom: `4px solid ${color}` });
    }
    const color = props.createEl("input", {
      type: "color",
      value: this.color,
      attr: { "aria-label": "Color" },
    });
    color.oninput = () => {
      this.color = color.value;
      this.applyProperties();
    };
    const numeric = (
      label: string,
      value: number,
      min: number,
      max: number,
      change: (v: number) => void,
    ) => {
      const l = props.createEl("label", { text: label });
      const i = l.createEl("input", {
        type: "number",
        value: String(value),
        attr: { min: String(min), max: String(max), "aria-label": label },
      });
      i.onchange = () => {
        const n = +i.value;
        if (Number.isFinite(n) && n >= min && n <= max) {
          change(n);
          this.applyProperties();
        }
      };
    };
    numeric("Stroke", this.lineWidth, 1, 100, (v) => (this.lineWidth = v));
    numeric("Font", this.fontSize, 8, 300, (v) => (this.fontSize = v));
    numeric("Opacity", this.opacity, 0.05, 1, (v) => (this.opacity = v));
    numeric("Arrow head", this.arrowSize, 5, 100, (v) => (this.arrowSize = v));
    const toggle = (label: string, change: (v: boolean) => void) => {
      const l = props.createEl("label", { text: label });
      const i = l.createEl("input", { type: "checkbox" });
      i.onchange = () => {
        change(i.checked);
        this.applyProperties();
      };
    };
    toggle("Fill", (v) => (this.fill = v));
    toggle("Rounded", (v) => (this.rounded = v));
    toggle("Bold", (v) => (this.bold = v));
    toggle("Text background", (v) => (this.background = v));
    const align = props.createEl("select", {
      attr: { "aria-label": "Text alignment" },
    });
    for (const a of ["left", "center", "right"])
      align.createEl("option", { text: a, value: a });
    align.onchange = () => {
      this.align = align.value as typeof this.align;
      this.applyProperties();
    };
    this.viewport = this.contentEl.createDiv({ cls: "qrc-viewport" });
    const element = this.viewport.createEl("canvas");
    this.canvas = new Canvas(element, {
      width: 1000,
      height: 600,
      backgroundColor: "#25262b",
      preserveObjectStacking: true,
      selection: true,
    });
    this.source = toDataURL(
      await this.app.vault.readBinary(this.file),
      imageMime(this.file.extension),
    );
    const base = await FabricImage.fromURL(this.source);
    if (this.file.extension.toLowerCase() === "svg") {
      this.source = base.toDataURL({ format: "png", multiplier: 1 });
      await base.setSrc(this.source);
    }
    this.crop = { x: 0, y: 0, width: base.width, height: base.height };
    base.set({ selectable: false, evented: false });
    base.setPositionByOrigin(new Point(0, 0), "left", "top");
    this.canvas.add(base);
    const sidecar = this.app.vault.getAbstractFileByPath(
      this.file.path.replace(/\.[^.]+$/, ".qrc.json"),
    );
    if (sidecar instanceof TFile) {
      const data = parseAnnotation(await this.app.vault.read(sidecar));
      await this.restore(data);
    }
    this.canvas.on("object:modified", () => this.snapshot());
    this.canvas.on("text:changed", () => this.snapshot());
    this.canvas.on("path:created", ({ path }) => {
      path.set({ opacity: this.opacity, stroke: this.color });
      this.snapshot();
    });
    this.canvas.on("mouse:down", (e) => this.pointerDown(e.e as MouseEvent));
    this.canvas.on("mouse:move", (e) => this.pointerMove(e.e as MouseEvent));
    this.canvas.on("mouse:up", () => this.pointerUp());
    const actions = this.contentEl.createDiv({ cls: "qrc-toolbar" });
    this.button(actions, "Undo", () => this.run(() => this.undo()));
    this.button(actions, "Redo", () => this.run(() => this.redo()));
    this.button(actions, "Delete", () => this.removeSelected());
    this.button(actions, "Fit image", () => this.fit());
    this.button(actions, "100%", () => this.zoom(1));
    this.button(actions, "−", () => this.zoom(this.canvas.getZoom() / 1.2));
    this.button(actions, "+", () => this.zoom(this.canvas.getZoom() * 1.2));
    this.button(actions, "Save as new", () => this.run(() => this.save("new")));
    this.button(actions, "Save copy…", () => this.run(() => this.save("copy")));
    this.button(actions, "Replace original…", () =>
      this.run(() => this.save("replace")),
    );
    this.button(actions, "Copy", () =>
      this.run(async () => {
        await writeImage(this.export());
        new Notice("Annotated image copied");
      }),
    );
    this.button(actions, "Save & Copy", () =>
      this.run(() => this.save(this.plugin.settings.saveMode, true)),
    );
    this.button(actions, "Flatten image", () => this.run(() => this.flatten()));
    this.button(actions, "Close", () => this.requestClose());
    this.status = this.contentEl.createDiv({ cls: "qrc-status" });
    this.loaded = true;
    this.fit();
    this.snapshot();
    this.dirty = false;
    this.setTool(this.initial);
    this.modalEl.addEventListener("keydown", (e) => this.key(e), {
      signal: this.abort.signal,
    });
    this.modalEl.addEventListener(
      "keyup",
      (e) => {
        if (e.code === "Space") this.space = false;
      },
      { signal: this.abort.signal },
    );
    this.viewport.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.canvas.zoomToPoint(
            new Point(e.offsetX, e.offsetY),
            Math.max(
              0.05,
              Math.min(8, this.canvas.getZoom() * (e.deltaY > 0 ? 0.9 : 1.1)),
            ),
          );
        } else {
          e.preventDefault();
          this.canvas.relativePan(new Point(-e.deltaX, -e.deltaY));
        }
      },
      { passive: false, signal: this.abort.signal },
    );
    this.scope.register([], "Escape", () => {
      this.requestClose();
      return false;
    });
    // Obsidian's close button and backdrop also go through the unsaved-change guard.
  }
  private data(): AnnotationDocument {
    return {
      version: 1,
      source: this.source,
      canvas: this.canvas.toJSON() as Record<string, unknown>,
      crop: { ...this.crop },
      nextMarker: this.nextMarker,
    };
  }
  private snapshot() {
    if (this.restoring) return;
    this.history.push(this.data());
    this.dirty = true;
  }
  private async restore(data: AnnotationDocument) {
    this.restoring = true;
    try {
      await this.canvas.loadFromJSON(data.canvas);
      this.source = data.source;
      this.crop = data.crop;
      this.nextMarker = data.nextMarker;
      this.canvas.getObjects()[0]?.set({ selectable: false, evented: false });
      this.canvas.requestRenderAll();
    } finally {
      this.restoring = false;
    }
  }
  private async undo() {
    const data = this.history.undo();
    if (data) {
      await this.restore(data);
      this.dirty = true;
    }
  }
  private async redo() {
    const data = this.history.redo();
    if (data) {
      await this.restore(data);
      this.dirty = true;
    }
  }
  private setTool(tool: Tool) {
    this.tool = tool;
    this.canvas.isDrawingMode = tool === "draw";
    this.canvas.selection = tool === "select";
    this.canvas.skipTargetFind = tool !== "select";
    this.canvas.discardActiveObject();
    this.configureBrush();
    for (const [t, b] of this.toolButtons) b.toggleClass("mod-cta", t === tool);
    if (this.status)
      this.status.setText(
        `${tool} · Ctrl+wheel zoom · Space+drag pan · Drag to draw/crop`,
      );
    this.canvas.requestRenderAll();
  }
  private configureBrush() {
    const brush = new PencilBrush(this.canvas);
    brush.color = new Color(this.color).setAlpha(this.opacity).toRgba();
    brush.width = this.lineWidth;
    this.canvas.freeDrawingBrush = brush;
  }
  private applyProperties() {
    this.configureBrush();
    this.plugin.settings.color = this.color;
    void this.plugin.persist();
    for (const obj of this.canvas.getActiveObjects()) {
      // Redaction is always fully opaque, including after selecting and changing properties.
      if (obj.get("data") === "redaction") {
        obj.set({ opacity: 1, fill: "#000000", stroke: "#000000" });
        continue;
      }
      obj.set({ opacity: this.opacity, strokeWidth: this.lineWidth });
      if (obj instanceof Textbox)
        obj.set({
          fill: this.color,
          fontSize: this.fontSize,
          fontWeight: this.bold ? "bold" : "normal",
          textAlign: this.align,
          backgroundColor: this.background ? "#ffffff" : "",
        });
      else if (obj instanceof Group) {
        obj.getObjects().forEach((child) => {
          if (child instanceof Circle) child.set({ fill: this.color });
        });
      } else if (obj instanceof Polygon) {
        const len = Math.max(...obj.points.map((point) => point.x));
        const head = Math.min(this.arrowSize, len / 2),
          half = this.lineWidth / 2;
        obj.set({
          points: [
            { x: 0, y: -half },
            { x: len - head, y: -half },
            { x: len - head, y: -head / 2 },
            { x: len, y: 0 },
            { x: len - head, y: head / 2 },
            { x: len - head, y: half },
            { x: 0, y: half },
          ],
          fill: this.color,
          strokeWidth: 0,
        });
        obj.setDimensions();
        obj.setCoords();
      } else
        obj.set({
          stroke: this.color,
          fill:
            obj instanceof Polygon
              ? this.color
              : this.fill
                ? this.color
                : "transparent",
        });
      if (obj instanceof Rect)
        obj.set({ rx: this.rounded ? 12 : 0, ry: this.rounded ? 12 : 0 });
    }
    this.canvas.requestRenderAll();
    this.snapshot();
  }
  private pointerDown(e: MouseEvent) {
    if (this.busy) return;
    if (this.space) {
      this.pan = { x: e.clientX, y: e.clientY };
      this.canvas.selection = false;
      return;
    }
    if (this.tool === "select" || this.tool === "draw") return;
    this.start = this.canvas.getScenePoint(e);
    if (this.tool === "text") {
      const text = new Textbox("Observation", {
        left: this.start.x,
        top: this.start.y,
        width: 280,
        fontSize: this.fontSize,
        fill: this.color,
        fontWeight: this.bold ? "bold" : "normal",
        textAlign: this.align,
        backgroundColor: this.background ? "#ffffff" : "",
        opacity: this.opacity,
      });
      text.setPositionByOrigin(this.start, "left", "top");
      this.canvas.add(text);
      this.setTool("select");
      this.canvas.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
      this.start = undefined;
      this.snapshot();
    }
    if (this.tool === "number" && this.start) {
      const radius = Math.max(16, this.fontSize * 0.7);
      const number = new Group(
        [
          new Circle({
            radius,
            fill: this.color,
            originX: "center",
            originY: "center",
          }),
          new Textbox(String(this.nextMarker), {
            fontSize: this.fontSize,
            width: radius * 2,
            textAlign: "center",
            fill: "#fff",
            fontWeight: "bold",
            originX: "center",
            originY: "center",
          }),
        ],
        { left: this.start.x, top: this.start.y },
      );
      number.setPositionByOrigin(this.start, "left", "top");
      this.canvas.add(number);
      if (this.plugin.settings.autoMarkers) this.nextMarker++;
      this.start = undefined;
      this.snapshot();
    }
  }
  private pointerMove(e: MouseEvent) {
    if (this.pan) {
      this.canvas.relativePan(
        new Point(e.clientX - this.pan.x, e.clientY - this.pan.y),
      );
      this.pan = { x: e.clientX, y: e.clientY };
      return;
    }
    if (!this.start) return;
    const end = this.canvas.getScenePoint(e);
    if (this.preview) this.canvas.remove(this.preview);
    const x = Math.min(this.start.x, end.x),
      y = Math.min(this.start.y, end.y),
      w = Math.abs(end.x - this.start.x),
      h = Math.abs(end.y - this.start.y);
    const props = {
      left: x,
      top: y,
      width: w,
      height: h,
      fill: this.fill ? this.color : "transparent",
      stroke: this.color,
      strokeWidth: this.lineWidth,
      opacity: this.opacity,
      selectable: false,
      evented: false,
    };
    if (this.tool === "arrow") {
      const dx = end.x - this.start.x,
        dy = end.y - this.start.y,
        len = Math.hypot(dx, dy),
        head = Math.min(this.arrowSize, len / 2),
        half = this.lineWidth / 2;
      this.preview = new Polygon(
        [
          { x: 0, y: -half },
          { x: len - head, y: -half },
          { x: len - head, y: -head / 2 },
          { x: len, y: 0 },
          { x: len - head, y: head / 2 },
          { x: len - head, y: half },
          { x: 0, y: half },
        ],
        {
          left: this.start.x,
          top: this.start.y,
          originX: "center",
          originY: "center",
          angle: (Math.atan2(dy, dx) * 180) / Math.PI,
          fill: this.color,
          opacity: this.opacity,
          selectable: false,
          evented: false,
        },
      );
    } else if (this.tool === "ellipse")
      this.preview = new Ellipse({ ...props, rx: w / 2, ry: h / 2 });
    else {
      this.preview = new Rect({
        ...props,
        rx: this.rounded ? 12 : 0,
        ry: this.rounded ? 12 : 0,
      });
      if (this.tool === "highlight")
        this.preview.set({ fill: this.color, strokeWidth: 0, opacity: 0.3 });
      if (this.tool === "redaction")
        this.preview.set({
          fill: "#000000",
          stroke: "#000000",
          opacity: 1,
          rx: 0,
          ry: 0,
          data: "redaction",
        });
      if (this.tool === "crop")
        this.preview.set({
          fill: "rgba(255,255,255,.15)",
          stroke: "#ffffff",
          strokeDashArray: [8, 4],
        });
    }
    this.preview.setPositionByOrigin(
      this.tool === "arrow" ? this.start : new Point(x, y),
      "left",
      this.tool === "arrow" ? "center" : "top",
    );
    this.canvas.add(this.preview);
    this.canvas.requestRenderAll();
  }
  private pointerUp() {
    if (this.pan) {
      this.pan = undefined;
      this.canvas.selection = this.tool === "select";
      return;
    }
    if (this.preview) {
      if (this.tool === "crop") {
        const r = this.preview.getBoundingRect();
        const base = this.canvas.getObjects()[0];
        const x = Math.max(0, r.left),
          y = Math.max(0, r.top),
          width = Math.min(base.width, r.left + r.width) - x,
          height = Math.min(base.height, r.top + r.height) - y;
        if (width > 1 && height > 1) this.crop = { x, y, width, height };
        this.canvas.remove(this.preview);
        this.fit();
      } else {
        this.preview.set({ selectable: true, evented: true });
      }
      this.preview = undefined;
      this.snapshot();
    }
    this.start = undefined;
  }
  private removeSelected() {
    for (const obj of this.canvas.getActiveObjects())
      if (obj !== this.canvas.getObjects()[0]) this.canvas.remove(obj);
    this.canvas.discardActiveObject();
    this.snapshot();
    this.canvas.requestRenderAll();
  }
  private fit() {
    this.canvas.setDimensions({
      width: Math.max(300, this.viewport.clientWidth),
      height: Math.max(300, this.viewport.clientHeight),
    });
    const scale =
      Math.min(
        this.canvas.width / this.crop.width,
        this.canvas.height / this.crop.height,
      ) * 0.92;
    this.canvas.setViewportTransform([
      scale,
      0,
      0,
      scale,
      (this.canvas.width - this.crop.width * scale) / 2 - this.crop.x * scale,
      (this.canvas.height - this.crop.height * scale) / 2 - this.crop.y * scale,
    ]);
    this.canvas.requestRenderAll();
  }
  private zoom(scale: number) {
    this.canvas.zoomToPoint(
      new Point(this.canvas.width / 2, this.canvas.height / 2),
      Math.max(0.05, Math.min(8, scale)),
    );
  }
  private export() {
    this.canvas.discardActiveObject();
    const transform = [...this.canvas.viewportTransform] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    try {
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      return this.canvas.toDataURL({
        format: "png",
        multiplier: 1,
        left: this.crop.x,
        top: this.crop.y,
        width: Math.round(this.crop.width),
        height: Math.round(this.crop.height),
      });
    } finally {
      this.canvas.setViewportTransform(transform);
      this.canvas.requestRenderAll();
    }
  }
  private async save(mode: "new" | "copy" | "replace", copy = false) {
    if (mode === "replace" && this.file.extension.toLowerCase() !== "png") {
      new Notice(
        "Replace is available for PNG only. Save a new PNG to preserve the original format.",
      );
      return;
    }
    if (
      mode === "replace" &&
      !(await choose(
        this.app,
        "Replace original?",
        `Overwrite ${this.file.path}? Existing references will show the edited image.`,
        [{ label: "Replace original", value: "yes" }],
      ))
    )
      return;
    let name = `${this.file.basename}-annotated.png`;
    if (mode === "copy") {
      const custom = await askText(this.app, "Save copy — file name", name);
      if (!custom) return;
      name = safeName(custom.replace(/\.png$/i, "")) + ".png";
    }
    const folder = this.plugin.settings.annotationFolder
      ? imageFolder(
          this.plugin.settings.annotationFolder,
          this.context?.note.basename ||
            this.htmlTarget?.note.basename ||
            this.file.basename,
          this.file.parent?.path || "",
        )
      : this.file.parent?.path || "";
    await ensureFolder(this.app, folder);
    const path =
      mode === "replace" ? this.file.path : uniquePath(this.app, folder, name);
    const url = this.export();
    const bytes = imageDataBytes(url);
    if (mode === "replace") await this.app.vault.modifyBinary(this.file, bytes);
    else await this.app.vault.createBinary(path, bytes);
    const sidecarPath = path.replace(/\.png$/i, ".qrc.json");
    const sidecar = this.app.vault.getAbstractFileByPath(sidecarPath);
    if (this.plugin.settings.editable) {
      const serialized = JSON.stringify(this.data());
      if (sidecar instanceof TFile)
        await this.app.vault.modify(sidecar, serialized);
      else await this.app.vault.create(sidecarPath, serialized);
    } else if (sidecar instanceof TFile)
      await this.app.fileManager.trashFile(sidecar);
    if (copy) await writeImage(url);
    this.dirty = false;
    new Notice(`Saved ${path}${copy ? " and copied" : ""}`);
    if (path !== this.file.path && this.context) await this.updateEmbed(path);
    if (path !== this.file.path && this.htmlTarget)
      await this.htmlTarget.apply(path);
  }
  private async updateEmbed(path: string) {
    const context = this.context!;
    const action = await choose(this.app, "Update image embed", path, [
      { label: "Replace", value: "replace" },
      { label: "Keep original", value: "keep" },
      { label: "Insert annotated below", value: "below" },
    ]);
    if (!action || action === "keep") return;
    if (
      context.editor.getValue() !== context.before ||
      this.app.workspace.getActiveFile()?.path !== context.note.path
    ) {
      new Notice(
        "The note changed. Saved image is available in the vault; embed was not overwritten.",
      );
      return;
    }
    const size = context.embed.width
      ? `|${context.embed.width}${context.embed.height ? "x" + context.embed.height : ""}`
      : "";
    const embed = `![[${path}${size}]]`;
    context.editor.replaceRange(
      action === "replace" ? embed : context.embed.raw + "\n\n" + embed,
      context.editor.offsetToPos(context.embed.start),
      context.editor.offsetToPos(context.embed.end),
    );
    this.context = undefined;
  }
  private async flatten() {
    if (
      !(await choose(
        this.app,
        "Flatten image",
        "Make annotations permanent in the current editor? Undo remains available until this editor closes.",
        [{ label: "Flatten", value: "yes" }],
      ))
    )
      return;
    const url = this.export();
    const image = await FabricImage.fromURL(url);
    this.canvas.clear();
    image.set({ selectable: false, evented: false });
    image.setPositionByOrigin(new Point(0, 0), "left", "top");
    this.canvas.add(image);
    this.source = url;
    this.crop = { x: 0, y: 0, width: image.width, height: image.height };
    this.snapshot();
    this.fit();
  }
  private key(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (
      target.matches("input,textarea,select") ||
      (this.canvas.getActiveObject() instanceof Textbox &&
        (this.canvas.getActiveObject() as Textbox).isEditing)
    )
      return;
    const mod = e.ctrlKey || e.metaKey;
    if (e.code === "Space") {
      e.preventDefault();
      this.space = true;
      return;
    }
    if (mod) {
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        this.run(() => (e.shiftKey ? this.redo() : this.undo()));
      }
      if (k === "y") {
        e.preventDefault();
        this.run(() => this.redo());
      }
      if (k === "s") {
        e.preventDefault();
        this.run(() => this.save(this.plugin.settings.saveMode));
      }
      if (k === "c" && e.shiftKey) {
        e.preventDefault();
        this.run(() => writeImage(this.export()));
      }
      return;
    }
    const tool = (
      {
        v: "select",
        a: "arrow",
        r: "rectangle",
        e: "ellipse",
        t: "text",
        d: "draw",
        n: "number",
        h: "highlight",
      } as Record<string, Tool>
    )[e.key.toLowerCase()];
    if (tool) {
      e.preventDefault();
      this.setTool(tool);
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.removeSelected();
    }
  }
  private requestClose() {
    if (this.busy) return;
    if (this.loaded && this.dirty) {
      this.run(async () => {
        const answer = await choose(
          this.app,
          "Unsaved annotations",
          "Close without saving these changes?",
          [{ label: "Discard changes", value: "discard" }],
        );
        if (answer) {
          this.dirty = false;
          super.close();
        }
      });
    } else super.close();
  }
  close() {
    this.requestClose();
  }
  onClose() {
    this.abort.abort();
    void this.canvas?.dispose();
    this.contentEl.empty();
  }
}
