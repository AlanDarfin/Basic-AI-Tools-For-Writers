# Basic AI Tool for Writers — 7.0.0-beta.1

**Prerelease only. The stable version is 6.0.1.** This beta preserves existing Markdown files and Longform scene order. The Timeline and folder metadata integrations were designed independently from the supplied reference plugins; their bundled code and CSS were not incorporated.

## Included in beta.1

### World Compendium (formerly Notes)
- Search notes by **title, folder path and any Obsidian tag**, with unrestricted categories such as `#character`, `#item`, `#place`, `#personagem` or `#world/era`. These are only examples, not a fixed set.
- Uses Obsidian's inline/YAML tags and the metadata cache. Select a category to filter; add tags to existing notes using the Obsidian frontmatter API.
- Folder structure remains available under **Manage folder structure**; the original create/rename/move/trash note actions are preserved.
- Characters, places and items can be created with small starter files, using tags rather than a mandatory folder structure. Compendium cards show graph links to other indexed notes.
- Tags on a conventional Folder Note also apply as **inherited search categories** for the files in that folder. This does not alter child Markdown.
- A new **Folder note** action appears for folders in the Compendium; the native Obsidian folder context menu also supports create/open. The normal File Explorer can show an adjacent opener button for recognized folder notes. It doesn't replace Obsidian's folder collapsing. If Lost Paul's Folder Notes plugin is enabled, the extra button is withheld to avoid duplicates.
- Recognizes `Folder/Folder.md` and `Folder.md`; no automatic renames, moves, or note creation take place.

### Timeline
- A new **Timeline** tab provides a readable chronological vertical layout. Add/edit/delete events with a title, time/era, category, description and optional linked Markdown note.
- Supports numeric fictional years (including negative values), ISO dates such as `2042-03-15`, and textual eras. Textual eras retain the entered order after sortable dates.
- Existing notes can join the Timeline without conversion by using:

```yaml
---
tags:
  - local
timeline:
  date: 2042-03-15
  title: Founding of the city
  category: World history
  description: First settlement established
---
```

- Project-authored events are stored inside Basic AI's per-project settings; no automatic edits to existing notes.

### Other v7 foundations
- **Continuity tab** flags unresolved Markdown links and differing dates for identically named timeline events. It is a structural check, not a semantic proofreader.
- **Writer focus mode** has a native command for reducing visual distractions without removing the editor.
- **Narrative memory for AI review**, explicitly opt-in, can send short excerpts of previous Longform chapters to the existing configured AI provider. It excludes the current chapter and later chapters, and remains off by default.
- Existing **Pandoc export** for DOCX, EPUB, PDF and HTML remains available on desktop, requiring the user's Pandoc installation. Book-wide one-click editorial export has not yet been added.
- Keeps the v6 stable compact look, bilingual UI text and native commands.

## Install and feedback

Download `main.js`, `styles.css`, and `manifest.json` from this beta, or extract the ZIP into `.obsidian/plugins/basic-ai-tool-for-writers/`, then reload the plugin. Back up the vault and plugin data before testing. Obsidian 1.11.4+; desktop and Android.

Please test custom tags, Folder Notes alongside other community plugins, metadata refresh after edits, very large Compendiums and timeline date ordering.

## Planned for subsequent v7 betas

A truly collapsible and drag-reorderable Longform hierarchy, richer character relationships and semantic continuity comparisons, longer project memory with privacy controls, book-wide publishing/export workflows, and persistent customizable authoring layouts. These are **not claimed to be complete in beta.1**.
