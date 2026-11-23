import { htmlToMarkdown, requestUrl, sanitizeHTMLToDom } from "obsidian";
import { imageDataBytes } from "../clipboard/ImageData";

export interface PasteImage {
  name: string;
  load: () => Promise<File>;
}
export interface HtmlImagePaste {
  images: PasteImage[];
  render: (embeds: string[]) => string;
}

/** Keep clipboard resources inert until the download preference is checked. */
export function htmlImagePaste(
  html: string,
  files: File[],
  allowRemote = false,
): HtmlImagePaste | undefined {
  if (!html || !/<img\b/i.test(html)) return;
  // Obsidian's sanitizer can load images while constructing detached markup.
  // A template keeps the original URLs inert before replacing the images.
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  fragment
    .querySelectorAll(
      "script,style,iframe,object,embed,link,meta,base,video,audio,source,track,svg,math,template,noscript",
    )
    .forEach((el) => el.remove());
  const nodes = Array.from(fragment.querySelectorAll("img"));
  if (!nodes.length) return;
  if (nodes.length > 100) throw new Error("Paste at most 100 images at a time.");
  const prefix = `VK${crypto.randomUUID().replaceAll("-", "")}IMAGE`;
  const images = nodes.map((img, index): PasteImage => {
    const source = img.getAttribute("src") || "";
    const name = img.getAttribute("alt") || `Image ${index + 1}`;
    // Associate clipboard files only when the mapping is unambiguous.
    const attached = files.length === nodes.length ? files[index] : undefined;
    img.replaceWith(`${prefix}${index}END`);
    return {
      name,
      load: async () => {
        if (attached) return attached;
        let bytes: ArrayBuffer;
        if (source.startsWith("data:")) bytes = imageDataBytes(source);
        else {
          if (!allowRemote) throw new Error("Remote images are blocked in Basic settings.");
          const url = new URL(source);
          if (url.protocol !== "https:" && url.protocol !== "http:")
            throw new Error(
              "Image is not available outside the source app. Copy it as an image or paste saved image files.",
            );
          if (url.username || url.password)
            throw new Error(
              "Image URLs with embedded credentials are not supported.",
            );
          const response = await requestUrl({ url: url.href, throw: false });
          if (response.status < 200 || response.status >= 300)
            throw new Error(
              "Image download failed. Gmail images may require access in your browser; copy the image itself or save and paste the file.",
            );
          bytes = response.arrayBuffer;
        }
        if (bytes.byteLength > 25 * 1024 * 1024)
          throw new Error("Image exceeds the 25 MB paste limit.");
        return new File([bytes], name);
      },
    };
  });
  for (const element of fragment.querySelectorAll(
    "[src],[srcset],[poster],[background]",
  )) {
    for (const attribute of ["src", "srcset", "poster", "background"])
      element.removeAttribute(attribute);
  }
  const markdown = htmlToMarkdown(sanitizeHTMLToDom(template.innerHTML));
  return {
    images,
    render: (embeds) => {
      let result = markdown;
      images.forEach((_, index) => {
        result = result.replaceAll(
          `${prefix}${index}END`,
          () =>
            embeds[index] ||
            "[Image not imported — copy the image itself or paste the saved file]",
        );
      });
      return result;
    },
  };
}
