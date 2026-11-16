import type { TFile } from "obsidian";
import { writeRich } from "../clipboard/ClipboardWriter";
import { prepareCopyImage } from "../clipboard/CopyImage";
import { formatCopy } from "../clipboard/CopyFormatting";
import type VisualKit from "../main";
import { HtmlAssets } from "./Assets";
import {
  MAX_HTML,
  plainText,
  sanitizeHtml,
  htmlElement,
  setSafeHtml,
  inertRoot,
} from "./HtmlDocument";

export async function exportHtml(
  plugin: VisualKit,
  note: TFile,
  html: string,
  bodyStyle = "",
) {
  const safe = sanitizeHtml(html);
  if (safe.issues.length)
    throw new Error(
      "This selection contains unsupported HTML. Review the note in Source mode before copying.",
    );
  const root = inertRoot();
  setSafeHtml(root, safe.html);
  const assets = new HtmlAssets(plugin);
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length > 100)
    throw new Error("Copy at most 100 images at a time.");
  let total = 0;
  for (const img of images) {
    const source = img.getAttribute("src") || "";
    try {
      const { bytes, extension } = await assets.bytes(source, note);
      total += bytes.byteLength;
      if (total > MAX_HTML) throw new Error("Image batch exceeds 32 MB.");
      const dimension = (value: string | null) =>
        value && /^\d+(?:px)?$/.test(value) ? parseInt(value) : undefined;
      const prepared = await prepareCopyImage(
        bytes,
        extension,
        dimension(img.style.width) ?? dimension(img.getAttribute("width")),
        dimension(img.style.height) ?? dimension(img.getAttribute("height")),
        plugin.settings.htmlClipboardCompatibility,
      );
      img.src = prepared.source;
      img.width = prepared.width;
      img.height = prepared.height;
    } catch (error) {
      throw new Error(
        `Cannot copy ${img.alt || source}: ${String(error)} Clipboard unchanged.`,
      );
    }
  }
  if (plugin.settings.htmlClipboardCompatibility)
    formatCopy(root, { ...plugin.settings, preserveFormatting: true });
  // A body style needs an inline fragment wrapper, not a full HTML document.
  const htmlOutput = bodyStyle
    ? (() => {
        const wrapper = htmlElement("div", root.ownerDocument);
        wrapper.setAttribute("style", bodyStyle);
        wrapper.append(...root.childNodes);
        return wrapper.outerHTML;
      })()
    : root.innerHTML;
  if (htmlOutput.length > MAX_HTML)
    throw new Error("Copy exceeds 32 MB. Clipboard unchanged.");
  return {
    html: htmlOutput,
    text: plainText(htmlOutput),
    image:
      images.length === 1 &&
      !plainText(htmlOutput)
        .replace(/\[.*?\]/g, "")
        .trim()
        ? images[0].src
        : undefined,
  };
}

export async function copyHtml(
  plugin: VisualKit,
  note: TFile,
  html: string,
  bodyStyle = "",
) {
  const result = await exportHtml(plugin, note, html, bodyStyle);
  await writeRich(result.html, result.text, result.image);
}
