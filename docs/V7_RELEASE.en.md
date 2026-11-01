# Basic AI Tool for Writers — 7.0.0 stable

**Release version:** 7.0.0, without a v prefix. **Minimum supported app version:** 1.11.4. Desktop and Android. This replaces version 6.0.1 as the latest stable GitHub release.

## Writing, Longform and scene planning

The project manager continues using existing Longform indexes and Markdown scene notes. Projects, drafts, nested chapters, move controls, saved-file-based writing sessions, goals, tasks, comments, and compilation have not been replaced.

- **Writing / World / Project:** three compact groups in the sidebar. Each displays only its related tabs and remains reachable from the native commands.
- **Scenes:** expandable nested chapters, depth rails, drag or touch-to-select movement, and a direct scene inspector.
- **Board:** Cards, List or Kanban by scene status, with filtering by viewpoint (POV), act, story arc, status and search.
- **Structure:** Plotlines, act-by-plotline grid, three-act/five-act/Hero's Journey beat templates, scene intensity/pacing analysis and a new **Connections** view.
- **Connections:** reads existing setup_scenes and payoff_scenes fields to display directed arrows between the original scenes. Missing references, self-references, and unexpected ordering generate warnings. It does not rewrite chapters or invent narrative dependencies.

### Scene properties

The scene sheet can edit optional YAML properties: status, act, sequence, pov, characters, location, sceneDate, plotlines, storyBeat, emotion, intensity (0 to 10), conflict, setup_scenes, payoff_scenes, target_wordcount and summary. Changes use the app's native frontmatter API. Clearing an existing value now removes just that property while preserving manuscript text and unrelated fields.

For example, a scene could contain:

- status: draft
- act: 2
- plotlines: [main, friendship]
- storyBeat: [midpoint]
- intensity: 7
- setup_scenes: ["[[Chapter 3]]"]
- payoff_scenes: ["[[Chapter 8]]"]

All these fields are optional. Existing notes are valid without them.

## World Compendium and Timeline

The Compendium remains a searchable index of Markdown notes, folders, standard tags and inherited Folder Notes tags. Add notes for characters, places, items, factions, cultures, economies, magical systems, events or completely custom categories. Edit user-defined sheet fields, connect wikilinks, and show local image portraits and a Gallery. Maps place clickable links to notes on vault images without changing those images.

Timeline events continue in project preferences or native note properties. Tracks, branches, milestones and a simplified Gantt are retained.

**New: custom fictional calendars.** Choose Gregorian ordering or define a 1–24 month fictional year, with each month named and containing 1–99 days. Events can use numeric years or numeric year-month-day strings; free-text eras remain descriptive and are not automatically sorted. Changing a calendar changes ordering only, never the date values saved in notes. Standard Gregorian sorting now validates leap days and avoids cross-year errors.

**New: series of books.** The Series button at the top of Projects groups Longform indexes, changes their series ordering and opens a selected book. Series are stored in the plugin's settings and do not move or delete original files.

## Writing tools, export and privacy

The existing dictionaries, translator, LanguageTool, AI writing/revision, selective Diff, autocomplete, snapshots, typewriter mode, cursor memory, typography, Markdown extensions, text-to-speech, and profiles remain available.

The existing optional desktop Pandoc integration remains the only conversion engine for EPUB, PDF and DOCX. The editor does not install Pandoc automatically. The AI narrative-memory option stays **off by default** and sends limited previous-chapter context only when the author requests a review through their configured provider. Online services may send selected text as indicated by each feature. Credentials are stored in plugin data.json without extra encryption.

## Installing or upgrading

1. Download the official [7.0.0 ZIP](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/download/7.0.0/Basic-AI-Tool-for-Writers-7.0.0.zip).
2. Back up your vault, the plugin directory and data.json.
3. Update main.js, manifest.json and styles.css in the plugin directory (normally .obsidian/plugins/basic-ai-tool-for-writers/). Do not overwrite data.json.
4. Reload the plugin. Existing Longform indexes, manuscript files and saved projects should remain intact.

## Validation and limits

The stable workflow checks syntax, the bundled source, historical regression tests, new calendar/series/dependency tests, CSS lint, both README languages, the manifest's display-name rules and ZIP integrity before it publishes assets. Automated tests **cannot guarantee** correct behavior in every Android WebView, custom theme, or screen-reader configuration.

The plugin name in the manifest is Basic AI Tool for Writers: the words "Obsidian" and "Plugin" are intentionally absent. The description ends with a period, version and release tag both use 7.0.0, and the plugin ID has not changed.

**Deliberately not claimed:** a full draggable relationship canvas, complex fantasy leap-year algorithms, calendar conversion between systems, full StoryLine-style multi-book story aggregation, or AI semantic proof of plot consistency. Those would require separate design and testing. Reference plugins informed concepts; their source code and stylesheets were not bundled.

A GitHub release does not itself mean acceptance into the Community Plugins directory. Submission/review must be completed separately.

[Português](V7_RELEASE.pt-BR.md) · [RC history](V7_RC1.en.md) · [Third-party notices](../THIRD_PARTY_NOTICES.md).
