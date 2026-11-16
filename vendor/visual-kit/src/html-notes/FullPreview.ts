import createDOMPurify from "dompurify";
import { parseHtml, htmlElement } from "./HtmlDocument";

/** Render document CSS in an opaque, scriptless frame without exposing the host. */
export function fullPreview(
  parent: HTMLElement,
  source: string,
  resource: (path: string) => string | undefined,
) {
  const owner = parent.ownerDocument;
  const purifier = createDOMPurify(owner.defaultView!);
  const cleaned = purifier.sanitize(source, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ["style"],
    FORBID_TAGS: [
      "script",
      "iframe",
      "object",
      "embed",
      "base",
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "meta",
      "link",
    ],
    FORBID_ATTR: ["autofocus"],
  });
  const doc = parseHtml(cleaned, owner);
  for (const anchor of doc.querySelectorAll("a"))
    anchor.removeAttribute("href");
  for (const image of doc.querySelectorAll("img")) {
    const src = image.getAttribute("src") || "";
    image.removeAttribute("srcset");
    const local = resource(src);
    if (local) image.setAttribute("src", local);
  }
  // This policy precedes all user CSS, and cannot be loosened by document content.
  const policy = htmlElement("meta", doc);
  policy.setAttribute("http-equiv", "Content-Security-Policy");
  policy.setAttribute(
    "content",
    "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: app:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'",
  );
  doc.head.prepend(policy);
  const frame = parent.createEl("iframe", {
    cls: "vk-html-frame",
    attr: { title: "Full HTML preview", sandbox: "" },
  });
  frame.srcdoc = `<!doctype html>${doc.documentElement.outerHTML}`;
}
