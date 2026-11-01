# Basic AI Tool for Writers — 7.0.0-beta.2

**Experimental prerelease.** Stable release: **6.0.1**. This is a substantial expansion of the existing v7 beta.1, designed around the Storyteller Suite's *feature ideas*, as well as the attached Make-a-Wiki, Avatar and Tabbed examples. No reference plugin's JavaScript or stylesheet is bundled. The Basic AI plugin remains independent and stores author-owned data in ordinary Obsidian Markdown and its existing project settings.

## What has changed

### One Compendium, now with editable sheets

- Existing notes remain in the same **Compendium** with native Obsidian tags and Folder Notes; there is no new entity database or second Compendium.
- Create Markdown entries for **characters, places, items, groups/factions, cultures, economies, magic systems, events, references** and your own user-defined templates.
- Each entry can have frontmatter fields and a compact **Sheet** modal. Fields are edited via Obsidian's `processFrontMatter` API, preserving the prose and unrelated properties.
- **Custom sheet templates** let you define your own name, tag and field keys in **Settings → Longform → Compendium & worldbuilding**. They are used for new records; deleting a template never deletes existing notes.
- **Relationships** use Obsidian wikilinks stored in the note's `relationships` property, alongside backlinks/forward links from the metadata cache. The Compendium shows one consolidated **Connections** section.
- **Portraits and cover images** resolve to files inside your vault using the native Obsidian resource path. No remote avatar provider is required; link an image through `avatar`, `cover`, `portrait`, or `image`. The Gallery reuses these images without copying them.

Example:
```yaml
---
tags: [personagem, casa/sol]
worldType: character
summary: Keeper of the library
avatar: "[[Images/portrait.png]]"
role: Archivist
relationships:
  - "[[Fortress]]"
---
```

### Longform scene board and navigation

- New **Board** tab presents the **same chapters and scenes** from Longform with status, POV, location, in-story date and summary.
- Editing a scene sheet changes that scene's own Markdown properties. Renaming, manuscript ordering and nested dragging still happen in **Scenes**, to avoid duplicate controls.
- The existing scene tree can now **collapse/expand branches**. Expand all / Collapse all are available, while the v6.0.1 vertical hierarchy rails remain intact.
- **Analytics** summarizes scene counts by status, point of view and location, without duplicating the existing project writing-progress panel.

### Timeline — upgrade, not replacement

- The existing Timeline now supports **tracks**, **branches**, **milestones**, optional end dates, note links and event search.
- View it as a chronology, grouped tracks, milestone-only list or a **simple Gantt visualization**.
- Timeline events remain in the existing `v7Timeline` project settings or in note frontmatter: there is no second timeline store. All beta.1 events still load.
- For a note-based event, optional properties can be nested under `timeline`:

```yaml
timeline:
  date: 1012
  endDate: 1015
  title: Reconstruction
  track: Northern Kingdom
  branch: main
  milestone: false
```

- Dates that are fictional textual eras remain descriptive; Gantt bars only appear where numeric dates or years can be ordered. This does **not** implement Storyteller's advanced calendar rules or dependency arrows.

### World maps, Gallery and session journal

- **Maps** use local images already in the vault. Choose an image, select an existing Compendium note, then tap its position to place a clickable marker. No external maps, tiles, or Leaflet resources are loaded. Map/marker coordinates are stored in the project's Basic AI settings, not burned into the image.
- **Gallery** displays the vault images already linked to Compendium entries. No second media library.
- **Sessions** offers simple Markdown session journals for fictional campaign play or writing-planning meetings. It does not replace the existing Tasks system or introduce a separate game mechanics engine.
- **Relationships** tab lists links between existing entries with direct navigation. It is an accessible relationship explorer, not yet a draggable network diagram.

### Publishing / AI workflow

- The existing desktop **Pandoc exporter** remains the sole DOCX/EPUB/PDF conversion engine. If it is enabled, the **Compile** tab now offers **Compile and export**, opening the generated manuscript in the existing Pandoc dialog.
- AI narrative memory from beta.1 remains **optional and off by default**, sends previous Longform chapter excerpts only when AI review is requested, and does not silently upload the Compendium.

## Compatibility and limits

- Desktop and Android, Obsidian 1.11.4+. The project uses native theme variables, flexible sidebar layouts, and ordinary Markdown properties.
- Related plugins can remain installed. These features implement their own view, not the reference plugins' runtime.
- User-customized fields are strings or comma-separated link lists. The beta does not yet support a full schema builder, live graphical relationship editing, a full branching Gantt engine, custom calendar mathematics, all Storyteller RPG rules, or semantic contradiction proofing.
- Existing work stays intact; do not skip a vault/plugin-data backup before installing a prerelease.
- Automated regressions and CSS lint run before publication. **Real-device testing on Android/custom themes remains necessary.**

## Installation

Extract `Basic-AI-Tool-for-Writers-7.0.0-beta.2.zip` or replace `main.js`, `manifest.json`, and `styles.css` inside `.obsidian/plugins/basic-ai-tool-for-writers/`, then reload Obsidian. This tag deliberately omits the `v` prefix.

Português: [V7_BETA2.pt-BR.md](V7_BETA2.pt-BR.md).
