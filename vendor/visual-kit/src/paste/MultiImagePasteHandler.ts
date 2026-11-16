import { Editor, Notice, TFile } from "obsidian";
import type VisualKit from "../main";
import { readImage } from "./ClipboardImageReader";
import { imageFolder, imageName } from "./ImageNamingService";
import { ensureFolder, uniquePath } from "./ImageFileWriter";
import { imageHash } from "../duplicates/ImageHasher";
import { choose } from "../ui";
import { parseImages } from "../sizing/ImageEmbedParser";
import type { PasteImage } from "./HtmlImagePaste";
export class MultiImagePasteHandler {
  private queue: Promise<void> = Promise.resolve();
  constructor(private plugin: VisualKit) {}
  paste(
    files: (File | PasteImage)[],
    editor: Editor,
    note: TFile,
    render?: (embeds: string[]) => string,
  ) {
    // Capture note and range immediately, never insert into a newly activated note.
    const before = editor.getValue(),
      from = editor.getCursor("from"),
      to = editor.getCursor("to");
    this.queue = this.queue
      .then(async () => {
        const { app, settings, index } = this.plugin;
        const embeds: string[] = [];
        const ordered: string[] = Array.from(
          { length: files.length },
          () => "",
        );
        const failures: string[] = [];
        let totalBytes = 0;
        let cancelled = 0;
        const folder = imageFolder(
          settings.folder,
          note.basename,
          note.parent?.path || "",
        );
        const referenced = parseImages(before)
          .map(
            (e) =>
              app.metadataCache.getFirstLinkpathDest(e.target, note.path)?.path,
          )
          .filter((p): p is string => !!p);
        const notice = new Notice(`Saving images: 0/${files.length}`, 0);
        try {
          await ensureFolder(app, folder);
          for (let i = 0; i < files.length; i++) {
            try {
              const input = files[i];
              const payload = "load" in input ? await input.load() : input;
              if (payload.size > 25 * 1024 * 1024) throw new Error("Image exceeds 25 MB.");
              totalBytes += payload.size;
              if (totalBytes > 32 * 1024 * 1024) throw new Error("Image batch exceeds 32 MB.");
              const item = await readImage(payload);
              let existing: TFile | undefined;
              if (settings.duplicates && settings.duplicateAction !== "save") {
                const matches = await index.find(
                  await imageHash(item.bytes),
                  folder,
                  note.path,
                  referenced,
                );
                if (matches.length) {
                  if (settings.duplicateAction === "ask") {
                    const choice = await choose(
                      app,
                      "Duplicate image detected",
                      item.name,
                      [
                        ...matches.map((f) => ({
                          label: `Reuse ${f.path}`,
                          value: f.path,
                        })),
                        { label: "Save duplicate", value: "__save__" },
                      ],
                    );
                    if (choice === null) {
                      cancelled++;
                      continue;
                    }
                    if (choice !== "__save__")
                      existing = matches.find((f) => f.path === choice);
                  } else {
                    existing = matches[0];
                    new Notice(
                      `Duplicate image detected: reusing ${existing.path}`,
                    );
                  }
                }
              }
              const file =
                existing ??
                (await app.vault.createBinary(
                  uniquePath(
                    app,
                    folder,
                    imageName(
                      settings.naming,
                      note.basename,
                      i + 1,
                      item.extension,
                    ),
                  ),
                  item.bytes,
                ));
              if (settings.duplicates) await index.update(file);
              const embed = `![[${file.path}${settings.pasteWidth ? "|" + settings.width : ""}]]`;
              embeds.push(embed);
              ordered[i] = embed;
            } catch (error) {
              failures.push(
                `${files[i].name || `Image ${i + 1}`}: ${String(error)}`,
              );
            }
            notice.setMessage(`Saving images: ${i + 1}/${files.length}`);
          }
          if (embeds.length || render) {
            const inserted = render
              ? render(ordered)
              : embeds.join(settings.blankLines ? "\n\n" : "\n");
            if (
              editor.getValue() === before &&
              app.workspace.getActiveFile()?.path === note.path
            )
              editor.replaceRange(inserted, from, to);
            else {
              // Preserve intervening edits instead of replacing a stale selection.
              await app.vault.process(
                note,
                (current) => `${current}\n\n${inserted}\n`,
              );
              new Notice(
                "Note changed during paste. Images appended to the original note.",
              );
            }
          }
          await this.plugin.persist();
          new Notice(
            `${embeds.length} images pasted successfully. ${failures.length} failed. ${cancelled} cancelled.${failures.length ? "\n" + failures.join("\n") : ""}`,
            failures.length ? 12000 : 5000,
          );
        } finally {
          notice.hide();
        }
      })
      .catch((error) => {
        new Notice(`Paste failed: ${String(error)}`, 10000);
      });
  }
}
