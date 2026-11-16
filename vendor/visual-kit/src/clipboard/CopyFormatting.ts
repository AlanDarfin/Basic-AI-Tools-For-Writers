import type { Settings } from "../settings";

/** Use inline content at the paste caret instead of starting a new styled block. */
export function formatCopy(root: HTMLElement, settings: Settings) {
  if (settings.movidesk) {
    for (const pre of root.querySelectorAll("pre")) {
      const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
      const texts: Text[] = [];
      while (walker.nextNode()) texts.push(walker.currentNode as Text);
      for (const text of texts) {
        const lines = text.data.split("\n");
        const fragment = createFragment();
        lines.forEach((line, index) => {
          if (index) fragment.append(createEl("br"));
          fragment.append(
            line
              .replaceAll(" ", "\u00a0")
              .replaceAll("\t", "\u00a0\u00a0\u00a0\u00a0"),
          );
        });
        text.replaceWith(fragment);
      }
    }
    for (const el of Array.from(
      root.querySelectorAll("p,div,h1,h2,h3,h4,h5,h6,blockquote,pre"),
    ).reverse()) {
      const fragment = createFragment();
      if (
        el.previousSibling &&
        !/^(BR|P|DIV|H[1-6]|BLOCKQUOTE|PRE)$/.test(el.previousSibling.nodeName)
      )
        fragment.append(createEl("br"));
      fragment.append(...Array.from(el.childNodes), createEl("br"));
      el.replaceWith(fragment);
    }
    root
      .querySelectorAll("code,font")
      .forEach((el) => el.replaceWith(...Array.from(el.childNodes)));
  }
  if (!settings.preserveFormatting)
    root
      .querySelectorAll(
        "strong,b,em,i,u,s,del,mark,h1,h2,h3,h4,h5,h6,blockquote,code",
      )
      .forEach((el) => {
        if (/^H[1-6]$/.test(el.tagName) || el.tagName === "BLOCKQUOTE")
          el.append(createEl("br"));
        el.replaceWith(...Array.from(el.childNodes));
      });
  if (
    settings.copyFontFamily ||
    settings.copyFontSize ||
    settings.copyTextColor
  ) {
    const span = createSpan();
    span.setCssStyles({
      fontFamily: settings.copyFontFamily || undefined,
      fontSize: settings.copyFontSize
        ? `${settings.copyFontSize}px`
        : undefined,
      color: settings.copyTextColor || undefined,
    });
    span.append(...Array.from(root.childNodes));
    root.append(span);
  }
}
