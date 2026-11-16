import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import { maskCode, parseImages } from "../sizing/ImageEmbedParser";
import { Settings } from "../settings";
import { writeRich } from "./ClipboardWriter";
import { prepareCopyImage } from "./CopyImage";
import { formatCopy } from "./CopyFormatting";
export async function copyMarkdown(
  app: App,
  markdown: string,
  sourcePath: string,
  settings: Settings,
) {
  const owner = new Component();
  owner.load();
  const root = createDiv();
  try {
    // Replace image syntax before rendering. This also prevents remote-image requests.
    const embeds = parseImages(markdown);
    let prepared = markdown;
    const tokenPrefix = `QRC${crypto.randomUUID().replaceAll("-", "")}`;
    for (let i = embeds.length - 1; i >= 0; i--)
      prepared =
        prepared.slice(0, embeds[i].start) +
        `${tokenPrefix}IMAGE${i}END` +
        prepared.slice(embeds[i].end);
    // Raw HTML is escaped: export must not load remote resources or run active content.
    // Never rewrite examples inside code spans/fences.
    for (const match of Array.from(
      maskCode(prepared).matchAll(/!\[\[([^\]]+)\]\]|<(?=\/?[A-Za-z!])/g),
    ).reverse()) {
      const replacement = match[1] === undefined ? "&lt;" : `[${match[1]}]`;
      prepared =
        prepared.slice(0, match.index) +
        replacement +
        prepared.slice(match.index + match[0].length);
    }
    // Reject unsupported inline/reference image syntax before MarkdownRenderer
    // gets a chance to resolve a remote URL without a filename extension.
    if (/(?:^|[^\\])!\[/m.test(maskCode(prepared)))
      throw new Error(
        "Unsupported image syntax. Use a local image embed with a file extension.",
      );
    await MarkdownRenderer.render(app, prepared, root, sourcePath, owner);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      const regex = new RegExp(`${tokenPrefix}IMAGE(\\d+)END`, "g");
      let offset = 0;
      const fragment = createFragment();
      let changed = false;
      for (const match of node.data.matchAll(regex)) {
        changed = true;
        fragment.append(node.data.slice(offset, match.index));
        const embed = embeds[+match[1]];
        if (/^[a-z][a-z\d+.-]*:/i.test(embed.target))
          throw new Error(
            `External image cannot be embedded locally: ${embed.target}`,
          );
        let target = embed.target;
        try {
          target = decodeURIComponent(target);
        } catch {
          /* Literal percent in filename. */
        }
        const file = app.metadataCache.getFirstLinkpathDest(target, sourcePath);
        if (!(file instanceof TFile))
          throw new Error(`Image not found: ${embed.target}`);
        const img = createEl("img");
        img.alt =
          embed.label.replace(/(?:^|\|)\d+(?:x\d+)?$/, "") || file.basename;
        const width = settings.normalizeCopy
          ? settings.width
          : settings.preserveResize
            ? embed.width
            : undefined;
        const height =
          settings.preserveResize &&
          embed.height &&
          (!settings.normalizeCopy || settings.preserveHeight)
            ? embed.height
            : undefined;
        try {
          const preparedImage = await prepareCopyImage(
            await app.vault.readBinary(file),
            file.extension,
            width,
            height,
            settings.movidesk,
          );
          img.src = preparedImage.source;
          img.width = preparedImage.width;
          img.height = preparedImage.height;
          img.setCssStyles({
            width: `${img.width}px`,
            height: settings.movidesk ? "auto" : `${img.height}px`,
          });
        } catch (error) {
          throw new Error(
            `Cannot copy ${file.path}: ${String(error)}. Clipboard unchanged.`,
          );
        }
        img.setCssStyles({ maxWidth: "100%" });
        fragment.append(img);
        offset = match.index + match[0].length;
      }
      if (changed) {
        fragment.append(node.data.slice(offset));
        node.replaceWith(fragment);
      }
    }
    root
      .querySelectorAll("script,style,iframe,object,embed,button,svg")
      .forEach((el) => el.remove());
    root
      .querySelectorAll("input")
      .forEach((el) =>
        el.replaceWith(document.createTextNode(el.checked ? "☑ " : "☐ ")),
      );
    for (const el of Array.from(root.querySelectorAll("*"))) {
      for (const attr of Array.from(el.attributes))
        if (
          ![
            "href",
            "src",
            "alt",
            "width",
            "height",
            "colspan",
            "rowspan",
            "start",
            "style",
          ].includes(attr.name) ||
          /^on/i.test(attr.name)
        )
          el.removeAttribute(attr.name);
      if (
        el.instanceOf(HTMLAnchorElement) &&
        !/^(https?:|mailto:|#)/i.test(el.getAttribute("href") || "")
      )
        el.removeAttribute("href");
      if (!el.instanceOf(HTMLImageElement)) el.removeAttribute("style");
    }
    if (settings.movidesk) {
      // Leave typography unset so the destination editor can apply its macro style.
      root
        .querySelectorAll("table")
        .forEach((el) => el.setCssStyles({ borderCollapse: "collapse" }));
      root.querySelectorAll<HTMLElement>("td,th").forEach((el) =>
        el.setCssStyles({
          border: "1px solid #bbb",
          padding: "6px",
          textAlign: "left",
        }),
      );
      root.querySelectorAll("pre").forEach((el) =>
        el.setCssStyles({
          whiteSpace: "pre-wrap",
          background: "#f3f3f3",
          padding: "10px",
        }),
      );
    }
    formatCopy(root, settings);
    const plain = root.cloneNode(true) as HTMLElement;
    plain
      .querySelectorAll("img")
      .forEach((img) =>
        img.replaceWith(document.createTextNode(`[${img.alt || "Image"}]`)),
      );
    plain
      .querySelectorAll("p,div,li,tr,h1,h2,h3,h4,pre,blockquote,br")
      .forEach((el) => el.append("\n"));
    const html = root.innerHTML;
    if (html.length > 32 * 1024 * 1024)
      throw new Error(
        "Copy exceeds 32 MB. Copy fewer images or enable image-size normalization. Clipboard unchanged.",
      );
    await writeRich(html, plain.textContent || "");
  } finally {
    owner.unload();
    root.remove();
  }
}
