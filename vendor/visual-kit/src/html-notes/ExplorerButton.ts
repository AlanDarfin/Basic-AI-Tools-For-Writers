import { setIcon, setTooltip } from "obsidian";
import type VisualKit from "../main";

/** Keep the shortcut beside Obsidian's New note action in each file explorer. */
export function registerHtmlNoteButton(plugin: VisualKit, create: () => void) {
  const buttons = new Map<HTMLElement, HTMLElement>();
  let unloaded = false;
  const sync = () => {
    if (unloaded) return;
    const headers = new Set<HTMLElement>();
    for (const leaf of plugin.app.workspace.getLeavesOfType("file-explorer")) {
      const header = leaf.view.containerEl.querySelector<HTMLElement>(
        ".nav-buttons-container",
      );
      if (!header) continue;
      headers.add(header);
      if (buttons.get(header)?.parentElement === header) continue;
      buttons.get(header)?.remove();
      const button = header.createDiv({
        cls: "nav-action-button clickable-icon vk-add-html-note",
        attr: { role: "button", tabindex: "0" },
      });
      setIcon(button, "file-code");
      setTooltip(button, "Add HTML note", { placement: "bottom" });
      const newNote =
        header.querySelector('[data-action="new-note"]') ??
        header.querySelector(".nav-action-button:not(.vk-add-html-note)");
      newNote?.after(button);
      button.onclick = () => create();
      button.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          create();
        }
      };
      buttons.set(header, button);
    }
    for (const [header, button] of buttons) {
      if (!headers.has(header)) {
        button.remove();
        buttons.delete(header);
      }
    }
  };
  plugin.register(() => {
    unloaded = true;
    for (const button of buttons.values()) button.remove();
    buttons.clear();
  });
  plugin.app.workspace.onLayoutReady(sync);
  plugin.registerEvent(plugin.app.workspace.on("layout-change", sync));
}
