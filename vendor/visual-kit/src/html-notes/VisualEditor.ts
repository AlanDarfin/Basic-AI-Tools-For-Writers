import {
  FRAME_POLICY,
  htmlElement,
  sanitizeHtml,
  setSafeHtml,
  inertRoot,
} from "./HtmlDocument";

type Bookmark = {
  start: number[];
  startOffset: number;
  end: number[];
  endOffset: number;
};
type Snapshot = { html: string; selection?: Bookmark };

/** Browser DOM editing preserves arbitrary supported inline markup instead of imposing a lossy editor schema. */
export class VisualEditor {
  frame: HTMLIFrameElement;
  doc?: Document;
  private history: Snapshot[] = [];
  private position = -1;
  private selection?: Range;
  private activeImage?: HTMLImageElement;
  private stopped = false;
  constructor(
    parent: HTMLElement,
    html: string,
    bodyStyle: string,
    readonly: boolean,
    private changed: (html: string) => void,
    private paste: (event: ClipboardEvent | DragEvent) => void,
    private copy: (event: ClipboardEvent) => void,
    private key: (event: KeyboardEvent) => void,
    private warn: (message: string) => void,
  ) {
    this.frame = parent.createEl("iframe", {
      cls: "vk-html-frame",
      attr: {
        title: readonly ? "HTML note preview" : "HTML note visual editor",
        sandbox: "allow-same-origin",
      },
    });
    this.frame.onload = () => {
      if (this.stopped) return;
      const doc = this.frame.contentDocument;
      if (!doc) return;
      this.doc = doc;
      doc.body.replaceChildren(...this.displayRoot(html).childNodes);
      doc.body.setAttribute("style", bodyStyle);
      doc.body.contentEditable = readonly ? "false" : "true";
      doc.body.spellcheck = true;
      this.decorateImages();
      this.record();
      doc.addEventListener("selectionchange", () => {
        const range = doc.getSelection()?.rangeCount
          ? doc.getSelection()!.getRangeAt(0)
          : undefined;
        if (range && doc.body.contains(range.commonAncestorContainer)) {
          this.selection = range.cloneRange();
          if (this.history[this.position])
            this.history[this.position].selection = this.bookmark(range);
        }
      });
      doc.addEventListener("click", (event) => {
        const target = event.target as Element;
        if (target.closest("a")) event.preventDefault();
        this.activeImage =
          target.tagName === "IMG" ? (target as HTMLImageElement) : undefined;
        if (!readonly) this.showResizeHandle();
        if (this.activeImage) {
          const range = doc.createRange();
          range.selectNode(this.activeImage);
          doc.getSelection()?.removeAllRanges();
          doc.getSelection()?.addRange(range);
        }
      });
      doc.addEventListener("submit", (event) => event.preventDefault());
      doc.addEventListener("copy", (event) => this.copy(event));
      doc.addEventListener("cut", (event) => {
        event.preventDefault();
        this.warn(
          "Use Copy as rich HTML, then Delete to remove the selection safely.",
        );
      });
      if (readonly) return;
      doc.addEventListener("input", () => {
        this.decorateImages();
        this.record();
        this.changed(this.html());
      });
      doc.addEventListener("paste", (event) => {
        event.preventDefault();
        this.capture();
        this.paste(event);
      });
      doc.addEventListener("drop", (event) => {
        event.preventDefault();
        this.capture();
        this.paste(event);
      });
      doc.addEventListener("dragover", (event) => event.preventDefault());
      doc.addEventListener("beforeinput", (event) => {
        if (
          event.inputType === "historyUndo" ||
          event.inputType === "historyRedo"
        ) {
          event.preventDefault();
          this.undo(event.inputType === "historyRedo");
        }
      });
      doc.addEventListener("keydown", (event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          ["z", "y"].includes(event.key.toLowerCase())
        ) {
          event.preventDefault();
          this.undo(event.shiftKey || event.key.toLowerCase() === "y");
        }
        this.key(event);
      });
    };
    // No imported markup enters srcdoc. Scripts, navigation, forms and network access remain disabled.
    this.frame.srcdoc = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${FRAME_POLICY}"><style>html{background:white;color:#202124;font:16px Arial,sans-serif}body{margin:20px;min-height:calc(100vh - 40px);overflow-wrap:break-word}body:focus{outline:none}table{border-collapse:collapse}td,th{min-width:24px}img{max-width:100%;cursor:pointer}img:not([src]){display:inline-block;min-width:160px;min-height:36px;border:1px dashed #b23;color:#922}a{cursor:text}.vk-image-resize{position:fixed;width:14px;height:14px;background:#6750d8;border:2px solid white;box-sizing:border-box;border-radius:3px;cursor:nwse-resize;touch-action:none;z-index:10}</style></head><body></body></html>`;
  }
  destroy() {
    this.stopped = true;
    this.resizeListeners?.abort();
    this.frame.onload = null;
    this.frame.remove();
  }
  private canonical(root: HTMLElement): string {
    root.querySelectorAll("img").forEach((img) => {
      const source = img.getAttribute("data-vk-source");
      if (source !== null) img.setAttribute("src", source);
      img.removeAttribute("data-vk-source");
    });
    return root.innerHTML;
  }
  html(): string {
    if (!this.doc) return "";
    const root = inertRoot(this.frame.ownerDocument);
    root.append(root.ownerDocument.importNode(this.doc.body, true));
    return this.canonical(root.firstElementChild as HTMLElement);
  }
  selectedHtml(): string | undefined {
    this.capture();
    const range = this.selection;
    if (!range || range.collapsed || !this.doc) return;
    const root = inertRoot(this.frame.ownerDocument);
    root.append(range.cloneContents());
    // Retain inherited formatting from partially selected inline ancestors.
    let node =
      range.commonAncestorContainer.nodeType === 1
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;
    let wrapper = root;
    while (node && node !== this.doc.body) {
      const outer = root.ownerDocument.importNode(node, false);
      outer.removeAttribute("id");
      outer.append(...wrapper.childNodes);
      wrapper.append(outer);
      node = node.parentElement;
    }
    return this.canonical(root);
  }
  private path(node: Node): number[] {
    const path: number[] = [];
    while (node !== this.doc!.body && node.parentNode) {
      path.unshift(
        Array.from(node.parentNode.childNodes).findIndex(
          (child) => child === node,
        ),
      );
      node = node.parentNode;
    }
    return path;
  }
  private bookmark(range: Range): Bookmark {
    return {
      start: this.path(range.startContainer),
      startOffset: range.startOffset,
      end: this.path(range.endContainer),
      endOffset: range.endOffset,
    };
  }
  private restoreBookmark(bookmark?: Bookmark) {
    if (!bookmark || !this.doc) return;
    const find = (path: number[]) =>
      path.reduce<Node>(
        (node, index) => node.childNodes[index] || node,
        this.doc!.body,
      );
    const range = this.doc.createRange();
    try {
      range.setStart(find(bookmark.start), bookmark.startOffset);
      range.setEnd(find(bookmark.end), bookmark.endOffset);
      this.selection = range;
      this.restore();
    } catch {
      this.selection = undefined;
    }
  }
  capture() {
    const selection = this.doc?.getSelection();
    if (selection?.rangeCount)
      this.selection = selection.getRangeAt(0).cloneRange();
  }
  restore() {
    this.doc?.body.focus();
    if (
      this.selection &&
      this.doc?.body.contains(this.selection.commonAncestorContainer)
    ) {
      const selection = this.doc.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.selection);
    }
  }
  private record() {
    if (!this.doc) return;
    const html = this.html();
    if (this.history[this.position]?.html === html) return;
    this.capture();
    this.history.splice(this.position + 1);
    this.history.push({
      html,
      selection: this.selection ? this.bookmark(this.selection) : undefined,
    });
    if (this.history.length > 100) this.history.shift();
    this.position = this.history.length - 1;
  }
  undo(redo = false) {
    const next = this.position + (redo ? 1 : -1);
    if (!this.doc || !this.history[next]) return;
    this.position = next;
    const snapshot = this.history[next];
    this.doc.body.replaceChildren(
      ...this.displayRoot(snapshot.html).childNodes,
    );
    this.decorateImages();
    this.restoreBookmark(snapshot.selection);
    this.changed(this.html());
  }
  command(command: string, value?: string) {
    if (!this.doc) return;
    this.restore();
    // Chromium editing commands retain native selection behavior; isolated behind this adapter.
    this.doc.execCommand("styleWithCSS", false, "true");
    this.doc.execCommand(command, false, value);
    this.capture();
    this.record();
    this.changed(this.html());
  }
  insertionRange(): Range | undefined {
    this.capture();
    return this.selection?.cloneRange();
  }
  insert(html: string, range?: Range) {
    if (range) this.selection = range.cloneRange();
    const root = this.displayRoot(html);
    if (
      root.lastElementChild?.tagName === "TABLE" &&
      root.lastChild === root.lastElementChild
    ) {
      const paragraph = htmlElement("p", root.ownerDocument);
      paragraph.append(htmlElement("br", root.ownerDocument));
      root.append(paragraph);
    }
    this.command("insertHTML", root.innerHTML);
    this.decorateImages();
  }
  private displayRoot(html: string) {
    const root = inertRoot(this.frame.ownerDocument);
    setSafeHtml(root, sanitizeHtml(html, this.frame.ownerDocument).html);
    for (const img of root.querySelectorAll("img")) this.decorateImage(img);
    return root;
  }
  private decorateImages() {
    if (!this.doc) return;
    for (const img of this.doc.images) {
      if (img.hasAttribute("data-vk-source")) continue;
      this.decorateImage(img);
    }
  }
  private decorateImage(img: HTMLImageElement) {
    img.addEventListener(
      "error",
      () =>
        this.warn(
          "An image could not be displayed. Its source is retained; paste a supported image file or import linked images.",
        ),
      { once: true },
    );
    const source = img.getAttribute("src") || "";
    img.setAttribute("data-vk-source", source);
    if (!/^data:image\/(png|jpeg|gif|webp|bmp|avif);base64,/i.test(source)) {
      const resource = this.resource?.(source);
      if (resource) img.setAttribute("src", resource);
      else {
        img.removeAttribute("src");
        this.warn(
          "Some images are unavailable or remote. Use Import linked images, or paste the image file.",
        );
      }
    }
  }
  private resizeListeners?: AbortController;
  private resizeHandle?: HTMLElement;
  private showResizeHandle() {
    this.resizeListeners?.abort();
    this.resizeHandle?.remove();
    const image = this.selectedImage();
    const doc = this.doc;
    if (!image || !doc) return;
    const handle = htmlElement("span", doc);
    handle.className = "vk-image-resize";
    handle.title = "Drag to resize image";
    this.resizeHandle = handle;
    doc.documentElement.append(handle);
    const position = () => {
      const rect = image.getBoundingClientRect();
      document.body.setCssStyles.call(handle, {
        left: rect.right - 7 + "px",
        top: rect.bottom - 7 + "px",
      });
    };
    position();
    const stop = new AbortController();
    this.resizeListeners = stop;
    doc.addEventListener("scroll", position, { signal: stop.signal });
    doc.defaultView?.addEventListener("resize", position, {
      signal: stop.signal,
    });
    handle.onclick = (event) => event.stopPropagation();
    handle.onpointerdown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      const initial = image.getBoundingClientRect();
      const start = event.clientX;
      const original = image.getAttribute("style");
      let width = initial.width;
      handle.onpointermove = (move) => {
        width = Math.round(
          Math.max(
            24,
            Math.min(
              16384,
              doc.body.clientWidth,
              initial.width + move.clientX - start,
            ),
          ),
        );
        document.body.setCssStyles.call(image, {
          width: width + "px",
          height: "auto",
        });
        position();
      };
      const finish = (commit: boolean) => {
        handle.onpointermove = null;
        if (original === null) image.removeAttribute("style");
        else image.setAttribute("style", original);
        if (commit && width !== initial.width)
          this.mutate(() => {
            image.width = width;
            image.removeAttribute("height");
            document.body.setCssStyles.call(image, {
              width: width + "px",
              height: "auto",
            });
          });
        position();
      };
      handle.onlostpointercapture = () => {
        if (handle.onpointermove) finish(false);
      };
      handle.onpointerup = () => finish(true);
      handle.onpointercancel = () => finish(false);
    };
  }
  resource?: (source: string) => string | undefined;
  selectedImage() {
    return this.activeImage?.isConnected ? this.activeImage : undefined;
  }
  mutate(action: (doc: Document) => void) {
    if (!this.doc) return;
    this.restore();
    action(this.doc);
    this.decorateImages();
    this.record();
    this.changed(this.html());
  }
  selectedCell(): HTMLTableCellElement | null {
    const node = this.selection?.startContainer;
    return (
      node?.nodeType === 1 ? (node as Element) : node?.parentElement
    )?.closest("td,th") as HTMLTableCellElement | null;
  }
}
