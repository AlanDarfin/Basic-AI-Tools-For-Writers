import createDOMPurify from "dompurify";

const tags =
  "p div span br b strong i em u s strike del h1 h2 h3 h4 h5 h6 ul ol li a hr table caption colgroup col thead tbody tfoot tr td th img blockquote pre code sub sup font section article header footer main aside nav figure figcaption details summary mark small abbr cite q time address dl dt dd kbd samp var wbr ins ruby rt rp bdi bdo".split(
    " ",
  );
const attributes =
  "style href src alt title width height colspan rowspan align valign border cellpadding cellspacing start reversed type color face size dir lang open datetime cite scope headers".split(
    " ",
  );
const styles = new Set(
  "color background-color font-family font-size font-weight font-style text-decoration text-decoration-line text-align vertical-align line-height letter-spacing white-space word-break overflow-wrap margin margin-top margin-right margin-bottom margin-left padding padding-top padding-right padding-bottom padding-left border border-top border-right border-bottom border-left border-width border-style border-color border-collapse border-spacing width height min-width max-width min-height max-height list-style-type display flex flex-direction flex-wrap flex-flow flex-grow flex-shrink flex-basis align-items align-content align-self justify-content justify-items justify-self gap row-gap column-gap grid grid-template-columns grid-template-rows grid-auto-flow grid-auto-columns grid-auto-rows grid-column grid-row order border-radius box-shadow opacity text-shadow text-indent text-transform word-spacing font-variant font-variant-ligatures font-variant-caps text-decoration-thickness text-decoration-style text-decoration-color text-underline-offset overflow overflow-x overflow-y box-sizing object-fit object-position aspect-ratio columns column-count column-width column-rule break-inside widows orphans -webkit-text-stroke-width float clear".split(
    " ",
  ),
);
const hasControls = (value: string) =>
  Array.from(value).some(
    (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
  );

export function htmlElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  owner: Document = document,
): HTMLElementTagNameMap[K] {
  // The sandbox document has standard DOM prototypes, not Obsidian's createEl helpers.
  // Create an empty host element, then adopt it before setting attributes or content.
  return owner.adoptNode(createEl(tag));
}
/** An inactive owner document prevents even detached img elements from fetching resources. */
export function inertRoot(owner: Document = document): HTMLDivElement {
  return htmlElement("div", owner.implementation.createHTMLDocument(""));
}
const purification = {
  ALLOWED_TAGS: tags,
  ALLOWED_ATTR: attributes,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
};
/** Sanitize at every DOM boundary, including history restoration and clipboard selections. */
export function setSafeHtml(root: HTMLElement, html: string) {
  const purifier = createDOMPurify(
    root.ownerDocument.defaultView || document.defaultView!,
  );
  root.replaceChildren(
    purifier.sanitize(html, { ...purification, RETURN_DOM_FRAGMENT: true }),
  );
}
export const MAX_HTML = 32 * 1024 * 1024;
export const FRAME_POLICY =
  "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: app:; connect-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

export function parseHtml(
  source: string,
  owner: Document = document,
): Document {
  if (source.length > MAX_HTML)
    throw new Error(
      "HTML note exceeds the 32 MB limit. Open it in an external editor.",
    );
  const parser = owner.defaultView?.DOMParser;
  if (!parser) throw new Error("HTML parser is unavailable.");
  return new parser().parseFromString(source, "text/html");
}

export function safeLink(value: string): boolean {
  return /^(https?:|mailto:|#)/i.test(value.trim()) && !hasControls(value);
}

export function safeImage(value: string): boolean {
  return (
    !value ||
    /^data:image\/(png|jpeg|gif|webp|bmp|avif);base64,[a-z0-9+/=\s]+$/i.test(
      value,
    ) ||
    (/^https?:\/\//i.test(value) && !hasControls(value)) ||
    (!/^[a-z][a-z\d+.-]*:|^[\\/]/i.test(value) && !hasControls(value))
  );
}

export interface SafeHtml {
  html: string;
  bodyStyle: string;
  issues: string[];
}

/** Locate real body tokens without matching comments, quoted attributes or title/script text. */
function bodyBounds(source: string): { start: number; end: number } | null {
  let cursor = 0,
    start = -1,
    end = -1;
  while (cursor < source.length) {
    const next = source.indexOf("<", cursor);
    if (next < 0) break;
    if (source.startsWith("<!--", next)) {
      const close = source.indexOf("-->", next + 4);
      if (close < 0) return null;
      cursor = close + 3;
      continue;
    }
    const token = /^<\s*(\/?)\s*([a-z][a-z\d:-]*)\b/i.exec(source.slice(next));
    if (!token) {
      cursor = next + 1;
      continue;
    }
    let position = next + token[0].length,
      quote = "";
    for (; position < source.length; position++) {
      const char = source[position];
      if (quote) {
        if (char === quote) quote = "";
      } else if (char === '"' || char === "'") quote = char;
      else if (char === ">") break;
    }
    if (position === source.length) return null;
    cursor = position + 1;
    const name = token[2].toLowerCase(),
      closing = !!token[1];
    if (name === "body") {
      if (closing) {
        if (start < 0 || end >= 0) return null;
        end = next;
      } else {
        if (start >= 0) return null;
        start = cursor;
      }
    }
    if (
      !closing &&
      [
        "script",
        "style",
        "title",
        "textarea",
        "xmp",
        "iframe",
        "noembed",
        "noframes",
      ].includes(name)
    ) {
      const close = new RegExp(`</${name}\\s*>`, "gi");
      close.lastIndex = cursor;
      const match = close.exec(source);
      if (!match) return null;
      cursor = match.index + match[0].length;
    }
  }
  return start >= 0 && end >= start ? { start, end } : null;
}

/** Detached DOMPurify output only. CSS is separately allowlisted; never trust it as application CSS. */
export function sanitizeHtml(
  source: string,
  owner: Document = document,
  clipboard = false,
): SafeHtml {
  const parsed = parseHtml(source, owner);
  const issues = new Set<string>();
  if (clipboard)
    for (const table of parsed.body.querySelectorAll("table")) {
      if (table.classList.contains("fr-dashed-borders")) {
        for (const cell of table.querySelectorAll<HTMLTableCellElement>(
          "td,th",
        ))
          if (!cell.style.border)
            owner.body.setCssStyles.call(cell, { border: "1px dashed #999" });
      }
      if (table.classList.contains("fr-alternate-rows")) {
        for (const [index, row] of Array.from(table.rows).entries())
          if (index % 2 && !row.style.backgroundColor)
            owner.body.setCssStyles.call(row, { backgroundColor: "#f5f5f5" });
      }
      if (!table.style.borderCollapse)
        owner.body.setCssStyles.call(table, { borderCollapse: "collapse" });
      for (const el of [table, ...table.querySelectorAll("*")]) {
        const classes = [...el.classList].filter(
          (name) => !name.startsWith("fr-"),
        );
        if (classes.length) el.setAttribute("class", classes.join(" "));
        else el.removeAttribute("class");
      }
    }
  if (/<(?:html|head|body)\b/i.test(source)) {
    const bounds = bodyBounds(source);
    if (!bounds)
      issues.add(
        "A complete document needs unambiguous explicit body tags for visual editing.",
      );
    else if (
      parseHtml(
        source.slice(bounds.start, bounds.end),
        owner,
      ).body.innerHTML.trim() !== parsed.body.innerHTML.trim()
    )
      issues.add(
        "HTML repair changed document boundaries. Use Source mode to retain the complete document.",
      );
  }
  if (parsed.head.querySelector("style,link,script,base,meta[http-equiv]"))
    issues.add(
      "Document stylesheets or active head content require Source mode.",
    );
  for (const node of parsed.body.querySelectorAll("*")) {
    if (!tags.includes(node.tagName.toLowerCase()))
      issues.add(`Unsupported element: ${node.tagName.toLowerCase()}`);
    for (const attr of Array.from(node.attributes))
      if (!attributes.includes(attr.name))
        issues.add(`Unsupported attribute: ${attr.name}`);
  }
  const cleanStyles = (el: HTMLElement): string => {
    const raw = el.getAttribute("style") || "";
    for (const declaration of raw.split(";")) {
      const colon = declaration.indexOf(":");
      if (
        colon > 0 &&
        !styles.has(declaration.slice(0, colon).trim().toLowerCase())
      )
        issues.add("Unsupported CSS declaration.");
    }
    if (/url\s*\(|expression\s*\(|@|\\|var\s*\(|[<>]/i.test(raw))
      issues.add("Unsafe or unsupported CSS value.");
    for (const property of Array.from(el.style)) {
      const value = el.style.getPropertyValue(property);
      if (
        !styles.has(property) ||
        /url\s*\(|expression\s*\(|@|\\|var\s*\(|[<>]/i.test(value) ||
        (property === "display" &&
          !/^(block|inline|inline-block|table|table-row|table-cell|list-item|flex|inline-flex|grid|inline-grid|flow-root|contents|none)$/.test(
            value,
          ))
      ) {
        issues.add(`Unsupported CSS: ${property}`);
        el.style.removeProperty(property);
      }
    }
    return el.getAttribute("style") || "";
  };
  for (const attr of Array.from(parsed.body.attributes))
    if (attr.name !== "style")
      issues.add(`Unsupported body attribute: ${attr.name}`);
  const bodyStyle = cleanStyles(parsed.body);
  const purifier = createDOMPurify(owner.defaultView!);
  const html = purifier.sanitize(parsed.body.innerHTML, {
    ...purification,
    RETURN_DOM_FRAGMENT: true,
  });
  if (
    purifier.removed.some(
      (entry) => "attribute" in entry || entry.element.nodeName !== "BODY",
    )
  )
    issues.add(
      "Unsafe or unsupported markup was excluded from rendering; original source is preserved.",
    );
  const root = inertRoot(owner);
  root.append(html);
  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    cleanStyles(el);
    if (el.hasAttribute("href") && !safeLink(el.getAttribute("href")!)) {
      el.removeAttribute("href");
      issues.add("Unsafe or nonportable link URL.");
    }
    if (el.hasAttribute("src") && !safeImage(el.getAttribute("src")!)) {
      el.removeAttribute("src");
      issues.add("Unsafe or nonportable image URL.");
    }
  }
  return { html: root.innerHTML, bodyStyle, issues: [...issues] };
}

/** Retain the original head, doctype and wrapper verbatim when changing the body. */
export function replaceBody(source: string, body: string): string {
  const bounds = bodyBounds(source);
  if (bounds)
    return source.slice(0, bounds.start) + body + source.slice(bounds.end);
  if (/<(?:html|head|body)\b/i.test(source))
    throw new Error(
      "This document has no explicit body. Edit its source to prevent wrapper loss.",
    );
  return body;
}

export class HtmlDocument {
  source: string;
  safe: SafeHtml;
  constructor(
    source: string,
    private owner: Document = document,
  ) {
    this.source = source;
    this.safe = this.renderable(source);
  }
  private renderable(source: string): SafeHtml {
    return source.length > MAX_HTML
      ? {
          html: "",
          bodyStyle: "",
          issues: [
            "HTML exceeds the 32 MB rendering limit. Source remains available and unchanged.",
          ],
        }
      : sanitizeHtml(source, this.owner);
  }
  setSource(source: string) {
    this.source = source;
    this.safe = this.renderable(source);
  }
  editBody(body: string) {
    if (this.safe.issues.length)
      throw new Error(
        "Use Source mode for this document. Its unsupported content is preserved.",
      );
    const safe = sanitizeHtml(body, this.owner);
    if (safe.issues.length)
      throw new Error(
        "The visual edit contains unsupported content. Original source was retained.",
      );
    this.setSource(replaceBody(this.source, safe.html));
  }
}

export function newDocument(): string {
  return '<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HTML note</title></head>\n<body><p><br></p></body>\n</html>\n';
}

export function plainText(html: string, owner: Document = document): string {
  const root = inertRoot(owner);
  setSafeHtml(root, sanitizeHtml(html, owner).html);
  root
    .querySelectorAll("img")
    .forEach((el) => el.replaceWith(`[${el.alt || "Image"}]`));
  root
    .querySelectorAll("p,div,li,tr,h1,h2,h3,h4,h5,h6,pre,blockquote,br,hr")
    .forEach((el) => el.append("\n"));
  root.querySelectorAll("td,th").forEach((el) => el.append("\t"));
  return root.textContent || "";
}
