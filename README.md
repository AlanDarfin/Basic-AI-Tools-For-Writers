# Basic

**A modular writing workspace for Obsidian.**

**Version:** 12.0.2 · **Requires:** Obsidian 1.11.4+ · **Desktop & Android** · **License:** MIT

[Leia em português](docs/README.pt-BR.md) · [Third-party notices](THIRD_PARTY_NOTICES.md) · [Security](SECURITY.md)

Write, plan, revise and organize books without moving your work to a separate database. The plugin combines a Longform workspace, worldbuilding tools, a configurable homepage, Markdown editors, language assistance and optional AI. Notes, folders, links and properties stay inside your Obsidian vault.



## Features

### Spaces, toolbar and mobile actions

- **Folder-root Spaces:** choosing `Trabalho/Escrita/Fireverse` displays Fireverse as the native Explorer's visual root, with only its descendants. This changes the interface, never vault paths.
- **Hide only in this Space:** hide or unhide notes and folders from their context menu without changing other Spaces. Space collections respect hidden folders and folder renames preserve scope.
- **Independent formatting toolbars:** desktop and mobile have separate button order, groups, styles, sizes and colors. Floating desktop mode appears only while editor text is selected.
- **Desktop Dragger:** handles stay reachable while moving the mouse from a Markdown line to the grip; handles remain disabled on Android.
- **Integrated settings:** existing General, Customization, Organization, Writing, Longform, AI and Review groups contain the newest suite and toolkit controls, without extra top-level groups.
- **Mobile quick-action ribbon:** Basic now has its own searchable-entry-compatible command set and a single **Basic: quick actions** ribbon menu for read-aloud, 65-action formatting palette, clean focus screen, folder focus and integrations. These are independent of the Ultimate Toolkit plugin's own shortcuts.
- **Sidebar fixes:** delayed native **More options** routing prevents nested Android menus from opening during the previous sheet's dismissal. The **Bookmark** action uses an available Bookmarks command when registered, otherwise the original native button; panel pin/close long press remains available.
- **Reorganized settings:** newer features and suites sit alongside related modules in the existing settings navigation.
- **No reset:** previously saved settings, note files, Spaces and layouts are not migrated or deleted.

**Complete feature inventories and limitations:** [Suites & integration guide (English)](docs/SUITES_AND_INTEGRATIONS.en.md) · [Guia PT-BR](docs/SUITES_AND_INTEGRATIONS.pt-BR.md).

### v12 · Unified Toolkit and companion integrations

Basic v12 expands the existing Markdown writing workspace without adding competing AI, TTS, explorer, Longform, or sync engines.

- **Ultimate Toolkit-inspired writing:** searchable palette with 65 formatting, callout and insertion actions; reusable Basic AI/TTS commands; optional contextual read-aloud for selected document text; six local note templates; temporary file-explorer folder focus.
- **Visual Kit-inspired images:** image lightbox, preview-and-confirm width normalization in Markdown, and a local image annotation editor with pen, arrows, rectangles, text and area-cover tools. Annotated output is saved as a **new PNG**; source images remain unchanged. Full HTML editing, rich-copy/paste and binary deduplication remain external.
- **Snailkit-inspired organization:** task Workbench groups tasks by their first tag, filters completed tasks and supports check/uncheck using atomic concurrent-change checks; quick capture, brainstorm and safe extraction of selected prose to a linked note. Search, Spaces and the homepage continue using Basic's existing features.
- **Optional local encrypted notes:** new files in `Basic Secure/` use AES-256-GCM with PBKDF2-SHA256 and a password never persisted by Basic. This is **per-note content encryption**, disabled by default; it does not encrypt folders, hide filenames or supply password recovery.
- **Integration center:** detects Ultimate Toolkit, Visual Kit, Snailkit, dropit, both Syncthing plugins, Obsidian Git and FIT when separately enabled. It exposes supported commands while preserving ownership of external settings and data.
- **Sync center:** select one external provider for **manual** command dispatch and inspect Syncthing conflict copies read-only. No new background sync, Git credentials, remote transport, or automatic conflict resolution is introduced. Disable overlapping auto-sync jobs in original plugins.

**Scope and mobile:** Visual Kit upstream is desktop-only; Basic's original annotation feature works separately but requires Android device testing. Document speech requires selectable text (including PDF text layers when accessible) and a working device voice. Full Ultimate Toolkit protected-folder indexing/bilingual PDF parsing, dropit transport, native Git/Syncthing engines, and complete upstream parity are not claimed.

See [v12 implementation coverage](docs/V12_SCOPE.pt-BR.md) and [release notes](docs/RELEASE_V12.md).

### Sidebars and editor width

- **Sidebar Manager (opt-in):** stable native Android sidebar tab controls with an active-tab indicator retained across panel switches; consolidated action menu with Lucide icons, native sorting menu support and a permanent collapsible Spaces selector just above mobile sidebar tabs (tap to open your Spaces or choose Entire vault). Layout refreshes preserve the top-row buttons so menus do not disappear. Configure mobile/desktop independently; order preferences are shared without moving native panes.
- **Editor Width:** desktop status-bar slider (20–100%), click its percentage to reset the width, and a settings slider available on Android. Supports individual Markdown notes using the `editor-width` YAML property. A note's YAML value takes precedence; moving the slider for that note gives a temporary preview without rewriting Markdown.
- **Compatibility:** sidebars remain opt-in, and native controls return when disabled. When available, the current vault can be accessed from the sidebar menu; otherwise the native vault footer stays visible. Using the original Sidebar Manager simultaneously leaves its sidebar controls in charge.

Example note frontmatter:

```yaml
---
title: Chapter 1
editor-width: 75
---
```



### Mobile panel controls (11.1.1)

In the Basic-managed mobile sidebar, **hold a panel icon for approximately 550 ms** (or use the context menu key) to open **Pin/Unpin panel**, **Close panel** and **Close other unpinned panels**. Pinning keeps the panel ahead of unpinned tabs and excludes it from *Close other unpinned panels*; it does not change native Obsidian drawer pinning. Dragging/scrolling cancels the long-press gesture. Normal tapping still switches views. Nested native sidebar actions are deferred until the first menu closes, avoiding the instant open-close behavior.

These controls never delete vault notes. Under Settings → Sidebars, the gesture can be disabled. See the [11.1.1 implementation notes](docs/V11_1_1_MOBILE_LONGFORM.pt-BR.md) for remaining real-device testing.

### Number Suite and database builder extensions (11.1)

The existing **Number Suite** integration now supports **opt-in visual heading numbers in Live Preview**. They are rendered as CodeMirror line decorations without modifying heading text. Reading View can display separate automatic counters for `Figure:`, `Table:`, `Equation:` and `Code:` caption paragraphs. The **Numbering: heading, caption and footnote outline** command navigates titles, captions and recognized footnote definitions. Enable the switches under the numbering settings; both are disabled by default for compatibility.

The new **Databases: visual view builder** command prepares `basic-suite-db` Markdown blocks through fields instead of requiring hand-written configuration. It supports table, board, gallery, list, calendar, timeline and chart views, along with columns, sort, group, limits and simple filters. Select an entire existing block in the editor before running the command to update it; otherwise a new block is inserted after explicit confirmation. The builder **never creates folders or edits database rows by itself**. It complements the previously added board moves and typed-property editor.

See [v11.1 implementation scope](docs/V11_1_INTEGRATIONS_SCOPE.pt-BR.md) for limitations, including missing complete upstream parity and the need for Android visual testing.

### Continuous writing in Longform (11.1.1)

Open **Longform → Writing → Continuous writing** to work through chapters in the same native Projects view. The separate Longform Studio homepage widget has been removed. Continuous writing offers a chapter-ordered workspace for books in the existing Longform library. Expand chapters to edit their original Markdown files without merging or relocating them. Saves are explicit, create a local snapshot when enabled, and reject concurrent changes instead of overwriting another editor. Scenes can be opened in a regular Obsidian tab.

- **Editorial review:** read-only line comparisons against existing Basic snapshots, plus local comments attached to chapter paths.
- **Universal search:** query file names, properties and note contents within a selected book, Space or bounded vault scan. Results include excerpts and open the source note.
- **Manuscript assembly:** review a compiled Markdown preview before explicitly creating a new file under `Basic Exports/`. Existing chapters are untouched. Use the separate Pandoc export features for supported desktop publishing formats.
- **Compatibility center:** inspect local module states, integration failures and overlapping third-party plugins without sending vault content over the network.
- **Integration:** the new Continuous writing tab is part of the standard Longform interface; the Bookshelf shortcut opens that same project tab. The Homepage keeps its Books widget, without a duplicate Studio widget.
- **Markdown databases:** move Notion-style board cards between existing columns using drag-and-drop or a mobile-friendly dropdown, with conflict checks and snapshots; use **Databases: edit typed property** for text, numbers, dates, checkboxes and tags.

The v11 implementations extend previous modules rather than replicating entire upstream plugins. Current limits and remaining roadmap are documented in [v11 scope](docs/V11_SCOPE.pt-BR.md). Importantly, editing in the Studio uses separate chapter textareas, not a single synchronized CodeMirror buffer. No PDF/EPUB/DOCX rendering or cloud sync is introduced by the Studio.

### Books, chapters and story planning

The library combines Longform projects and individual Markdown notes. Use **Add book** to search and select a note. A book cover is read from the `banner` frontmatter property, with `cover` and `image` fallbacks. `description` and `copyright` are shown on the library card. Chapter completion determines Longform reading progress automatically; single-note books can use `readingProgress` metadata. For example:

```yaml
---
title: My novel
banner: https://example.org/cover.jpg
description: A short synopsis.
copyright: © 2026 Author. All rights reserved.
readingProgress: 25
---
```



- **Longform projects:** create books with chapters, nested subchapters, notes, covers, descriptions and project metadata. Reorder scenes by dragging or with accessible commands.
- **Scene views:** plan with lists, cards and Kanban-style boards. Organize story beats, scene links, writing tasks, goals and comments.
- **Book navigation:** move between previous/next chapters and subchapters with the BookNav block, manual note chains or automatically rendered navigation through Virtual Content.
- **Project utilities:** story structure, scene templates, metadata, series organization, writing sessions, manuscript assembly and export options.

### Worldbuilding and connected notes

- **Compendium:** maintain characters, places, items and custom entities as ordinary Markdown files with relationships, tags, local images and custom fields.
- **Timelines:** link events, milestones, narrative tracks and alternate branches; configure a fictional calendar when needed.
- **Folder Notes:** open folder-associated notes from the native File Explorer, and show dynamic folder overviews with configurable cards and links.
- **Smart Spaces:** build virtual collections of vault content from folders, tags and properties, displayed as lists, boards or tables.
- **Virtual Content:** inject matching Markdown templates into note headers, footers, reading sections or a sidebar without editing the underlying files. Rules can match folders, tags and frontmatter.

### Customizable writing homepage

The homepage provides a compact dashboard with configurable title, icon, theme accents and fuzzy vault search. It can open when a new empty tab appears (the `homeOnNewTab` preference), with an option to disable this behavior. Desktop web links can use Obsidian's native **Web Viewer**; mobile links use the system browser.

Available widgets include a **clock and calendar**, **Soundscapes radio** (desktop), **continue writing**, **recent notes**, **favorites**, **quick drafts**, **vault summary**, **weekly activity**, **random note**, **tags**, **word goal**, **vault photo gallery**, **quotes** and **today's overview**.

- **Space-efficient layout:** a responsive, height-aware masonry grid places small widgets beside taller ones instead of leaving large gaps.
- **Widget sizes:** choose **Compact**, **Normal** or **Wide** from each widget's options. A wide widget spans both columns on desktop; mobile uses a single column.
- **Reordering:** drag the handle on desktop (Dragger is fully disabled on Android); on touch devices, select a handle and then another widget heading. The widget menu also has earlier/later commands.
- **Personal settings:** add, hide and rearrange widgets; order, sizes, hidden items and quick drafts are saved locally.

### Editing, Markdown formatting and navigation

- **Keyshots-style editing:** keyboard navigation and editing actions.
- **Easy Typing & Smart Typography:** automatic writing assistance for spacing, symbols and typographic details.
- **Typewriter mode:** focus and active-line highlighting.
- **Remember Cursor:** preserve and restore the editing position.
- **Variants & Snapshots:** compare alternate wording before replacing text, and keep local note snapshots.
- **Autocomplete:** suggestions from vault words and complements; manual indexing controls in settings.
- **Templates by note name:** apply matching Markdown templates on creation or rename, with configurable rules.
- **Unicode search, abbreviations and Instant TOC:** insert symbols, expand shortcuts and navigate headings.
- **Extended Syntax and Pandoc options:** additional Markdown constructs, smart insertion and optional desktop export.

### Language review and optional AI

- **LanguageTool:** spelling and grammar suggestions, paragraph checking, contextual fixes, an editable personal dictionary and an optional integration with the standalone LanguageTool plugin.
- **Review modes:** review wording, grammar, style and entire passages, with optional AI explanations and suggested revisions.
- **Dictionary & translation:** definitions, synonyms, antonyms, contextual explanations and translation of selections or Markdown notes. Translation engines and automatic source-language detection are configurable.
- **Assistant:** chat with optional note or selection context, attachments, editable task prompts and model settings.
- **Inline AI (Inscribe-inspired):** optional completion at the cursor, preview before accepting, customizable prompts and per-folder profiles.
- **Providers:** support for configured OpenAI, Gemini, Groq, Claude, Ollama, OpenRouter and compatible custom endpoints. API keys are supplied by the user; basic writing features do not require one.

The interface follows Obsidian's **Portuguese or English** language setting (English fallback). Internet access, AI calls and external services depend on the enabled feature and its configuration.

### Calendar, study and sessions

- **Writing calendar (Full Calendar-inspired):** create and edit events, navigate dates, use a dedicated view or sidebar and manage compatible Markdown-based schedules.
- **Spaced repetition:** study decks and review scheduling built around local vault notes, including `#flashcards`-style study content.
- **Temporary sessions:** create in-memory writing drafts, then explicitly save them as Markdown notes when needed. Unsaved session drafts do not survive closing Obsidian.
- **Tasks and goals:** project tasks, progress indicators and writing metrics.


**Flow panel example** (each line references an existing Markdown note in your vault):

```flow
layout: cards
[[Chapter 1]]
[[Chapter 2]]
```

### Academic workspace, advanced databases and document numbering

- **Academic center (Unique Suite-inspired):** capture class notes, open daily journal notes, write dated reminders and maintain a Markdown timetable. Access it through **Study: open academic center** in the command palette. Folder names are configurable, and nothing is created until you choose an action. Use the existing Basic calendar and optional iCalendar subscriptions rather than introducing a duplicate sync engine.
- **Advanced databases (Notion Suite-inspired):** use the local Markdown database engine with table, board, list, gallery, calendar, timeline and bar-chart views. Rows remain normal notes; view filters, safe formulas, basic relations and rollups reuse existing Basic functions. The **Create note** control writes a file only when clicked. The dedicated `basic-suite-db` block avoids conflicts with the standalone `notion-db` renderer.
- **Document numbering (Number Suite-inspired):** optional virtual H1–H6 heading numbers in **Reading View**, a navigable outline, and preview-before-apply commands for writing or removing recognized stored numbers. Each write requires confirmation and an exact stale-content check. Plain caption paragraphs beginning with `Figure:`, `Table:`, `Equation:` or `Code:` can receive visual styling; full caption/reference numbering and Live Preview decorations are not yet included.

Database example:

~~~basic-suite-db
folder: Databases/Tasks
view: gallery
columns: file, status, due
cover: banner
group: status
sort: modified
order: desc
~~~

Change `view` to `table`, `board`, `list`, `calendar`, `timeline` or `chart`; the toolbar can also switch views temporarily. The Flow `/` menu offers a database-view starter.

Timetable example, reading your local `Estudos/Horário.md`:

~~~basic-timetable
file: Estudos/Horário.md
title: My classes
~~~

A note can opt out of virtual heading numbering with `basic-numbering: false` in Properties. Turning on virtual numbering does not edit Markdown. Writing heading numbers can change section-link targets, so test it with a sample note first.

The [suite feature scope](docs/V10_11_SUITES_SCOPE.pt-BR.md) distinguishes implemented workflows from capabilities that still belong to the standalone upstream plugins.

### Native explorer and personalization

- **Iconic-style customization:** choose Lucide icons and colors for files, folders, favorites and the homepage.
- **Favorite notes:** stars in the native Explorer share their state with the homepage favorites widget.
- **Explorer previews:** optional descriptions, excerpts, cover images and first embedded image thumbnails; hide/show previews with a dedicated control.
- **Flexplorer:** pin or hide items, sort folders, define custom ordering and apply glob-based visibility rules without deleting files.
- **Compact UI:** scrollable tab strips, consistent tool menus and configurable modules help on smaller screens.

**Explorer previews:** Folder Notes show only the configured YAML description property, never the note body. The line-count limit applies only to regular Markdown notes. Long previews expand after 1.5 seconds of hover or a configurable Android long press. Hover expansion, regular-note excerpts and Folder Note descriptions can each be switched off.

### Audio and accessibility

- **Soundscapes (desktop):** ambient YouTube radio and custom stations **start in the background** when Play is pressed, without showing a popup or opening a tab. The compact floating video player opens **only** when the Show mini player button or command is used. It can be hidden without stopping playback, or stopped to unload it. The Homepage widget remains visible in both playing and stopped states; on mobile it stays in the dashboard and shows a compatibility notice instead of disappearing. It prefers Chromium's embedded Webview when available and falls back to a visible YouTube iframe if that is unavailable. The volume sliders on the homepage, status bar and mini player all control radio audio using the embedded player API; the same setting also controls local music. Radio volume is re-applied after the video loads or a station changes. Some videos may reject embedding (YouTube error 153). **My Music** continues to play local vault audio directly, with play/pause and volume controls.
- **Inline title icon alignment:** explorer and YAML icons now follow the title's first text line rather than using an absolute offset that placed them above text on Android. Icons inherit title color. Also fixes icon cleanup on plugin reload and prevents duplicate decorations from the two sources.
- **Previews:** the preview toggle matches the other toolbar icons' neutral color. Folder Note descriptions show at most three lines with a literal `...` **only when more text is hidden**; hold to expand. Regular notes retain their configurable line limit.
- **Pomodoro:** a local timer inspired by [Pomodoro Timer](https://github.com/eatgrass/obsidian-pomodoro-timer) with configurable focus/short/long breaks, interactive sidebar (desktop and Android), daily count, command-palette shortcuts, and a **desktop-only** status bar. See **Writing & Markdown → Pomodoro · Focus** for duration, notification, sound, auto-advance and visibility settings. Optional daily logging appends only to an existing `YYYY-MM-DD.md` file without creating or deleting notes. Advanced task tracking from the original plugin is not yet implemented.
- **Explorer previews and icons:** Folder Note descriptions, opening Markdown excerpts, compact right-side images, and delayed hover or Android long-press expansion with a configurable duration. Inline-title decorations are aligned and non-editable; mobile explorer action icons are larger.
- **Independent Spaces:** collections by folder, tag or property with separate hidden/pinned paths, per-folder sorting, list/cards/board/table views and homepage widget configuration (visibility, sizes, ordering). The Space bar switches, creates, renames, configures, changes icons/colors, reorders and removes collections without deleting notes. The explorer also has a dedicated Manage Spaces action. Under **Customization → Local collections**, the dock, icon and sidebar are separately toggleable.
- **Flexplorer + Custom Sorting:** folder-specific and per-Space name/date/number/metadata/manual ordering, folders-first and wildcard names (`*`, `?`). Folder Note keys include `basic_sort`, `basic_sort_field`, `basic_sort_order`, `basic_folders_first`. With YAML sorting enabled, Basic also recognizes **a subset** of `sorting-spec` (alphabetical, numeric, metadata, folders-first and manual patterns); advanced Custom Sorting grammar is not implemented. Desktop Alt+drag and mobile arrows reorder in custom mode. Sorting, pinning and hiding can be disabled separately.
- **Pretty Properties:** covers, banners, icons, hidden fields, custom property/tag colors, dates, due highlighting, progress and safe templates, with independent switches for visual modules.
- **Flow:** `/` menu, editable embedded notes with concurrent-edit protection, and a Markdown-native Flow composer. `flow` code blocks provide cards/list/board layouts, add/remove links, drag or mobile buttons to reorder, and save only the fenced block list. Linked note contents are not deleted. Flow, previews and arranging are separately configurable.
- **Looking toward v10:** settings architecture, navigation, search, bilingual controls, independent module toggles and migration. See the [v10 settings plan](docs/V10_SETTINGS_PLAN.md).
- **Image Captions:** optionally display captions from Markdown image alt text, without rewriting the files.
- **Click Clack (desktop):** optional typing sounds with **13 downloadable sound packs** from the original Click Clack project (Cherry MX, IBM, Olympia, Quill and more). Browse the catalog in Settings to download one pack or all 13, then choose the installed scheme. Downloads are always opt-in; installed sounds work offline.
- **Text-to-speech:** system voices where supported or opt-in online voices, with language, speed, pitch and voice preferences. Online reading sends selected text to the chosen service only when enabled.
- **Keyboard and touch:** most views include buttons, menus and touch-compatible alternatives to dragging.


**Folder Overview (9.2.14):** icon-only entries now support card, nested list, compact, icon grid, table and board views. Sort by name, modification, creation, size or type; filter items and navigate subfolders on mobile with separate expand/open buttons. Optional summaries hide folder-note technical metadata.

**Complete copy-ready examples for every Markdown code block:** [English block guide](docs/BLOCKS.en.md) · [Guia em português](docs/BLOCKS.pt-BR.md).


### Timeline blocks and properties behavior

- **Properties filter:** the optional search field is now inside Obsidian's native collapsible properties list; collapsing Properties hides the filter in Live Preview and Reading mode, and refreshes preserve its current search query.
- **Markdown timelines:** support the original `timeline` (`+` triplets) and `timeline-labeled` (`date/title/content`) syntax as well as expanded `layout: horizontal|vertical`, themes (`classic`, `cards`, `minimal`, `compact`, `editorial`), accent colors, local vault photos, Lucide icons, links, event groups, orientation switching and filtering.
- **Longform stays independent:** the project timeline, events, branches, Gantt view and fictional calendar remain intact. The block is controlled separately under Settings → Modules → Markdown timelines.
- **Examples:** [English](docs/BLOCKS.en.md) · [Português](docs/BLOCKS.pt-BR.md). No network calls or third-party runtime are necessary for these blocks.

## Markdown renderers

The plugin also recognizes independent Markdown code blocks. The preferred short names are shown below; legacy aliases such as `writer-tabs`, `writer-wiki`, `writer-avatar`, `writer-post`, `writer-chat`, `writer-folder-overview` and `writer-media-gallery` remain accepted for compatibility.

| Code block | Purpose |
| --- | --- |
| `tabs` | Scrollable tabbed Markdown sections |
| `avatar` / `wiki` | Character cards and worldbuilding infoboxes |
| `post` / `chat` | Fictional social posts, threaded replies and conversation bubbles |
| `media-gallery` | Local vault media gallery |
| `folder-overview` | Dynamic listing of folder content |
| `columns` | Multi-column reading layout |
| `progressbar` | Manual or date-driven progress bars |
| `widgets` | Clock, quote, countdown and counter |
| `meta-field` | Controlled editing or display of a YAML property |
| `insta-toc` / `longform-nav` | Table of contents and chapter navigation |
| `timeline` / `timeline-labeled` | Narrative timelines with original syntax, themed cards, photos and vertical/horizontal layouts |

For example, add an interactive character card or a note with multiple sections:

~~~~markdown
~~~wiki
title: The Northern Archive
type: Location
image: [[Images/archive.webp]]
region: Highlands
---
An old library with a long history.
~~~

~~~tabs
=== Synopsis
A summary of the scene.

=== Notes
- [[Character One]]
- [[Character Two]]
~~~
~~~~

**9.5.1 · Fictional chat dividers and group photo:** in `chat` blocks, use a standalone `---` between messages for a simple divider or `--- Two hours later ---` for a labeled separator. Set `group-image: [[Images/group.webp]]` next to `title:` to show a local group portrait in the conversation header. Per-speaker avatars and fake audio are unchanged. See [full examples](docs/BLOCKS.en.md).

**10.0.0 · Fictional voice note transcripts:** optional manually supplied text in `[audio:0:15:I'll be there soon.]`, `[voice:0:15:...]` or `[áudio:0:15:...]` appears behind a **View transcript** toggle, without audio playback or microphone access. Silent voice notes without transcriptions continue to work. The transcript is plain text and remains inside the fictional message. See the [block guide](docs/BLOCKS.en.md).

**Fictional chat syntax:** add a `chat` block with `[Left=Maria, right=João]` to set the speakers. For color and avatar shorthand, use `[Maria=blue]`. Tab sections can use headings such as `=== Maria`. These formats only render local story content; they are not messaging services.

Markdown renderers are presentation and editing helpers, not substitutes for independent services or plugins. Availability varies with the corresponding module toggle and view mode.

## Setup and installation

1. Install **Obsidian 1.11.4 or later**.
2. Download the most recent [GitHub Release](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases). Use the release's `main.js`, `manifest.json` and `styles.css`, not only the source code archive.
3. Put those files in `.obsidian/plugins/basic-ai-tool-for-writers/` inside your vault.
4. Enable **Basic** under **Settings → Community plugins**.
5. Open its settings to choose which modules, providers, integrations and homepage widgets are enabled.

**Updating:** your installed copy does not update merely because a commit was pushed to `main`. An updater needs a published versioned Release containing the three plugin files. If installing manually, replace the files together and reload Obsidian.

## Data and privacy

Local writing, projects, metadata, favorites, study information and most dashboard features work with vault files or plugin settings. External AI, online translation, remote LanguageTool, YouTube radio and online TTS require network connections when used. Do not enable services that transmit note content unless you are comfortable with their provider's data handling. Session drafts that are not saved to a file are temporary.

For open-source licensing and integration details, see [Third-party notices](THIRD_PARTY_NOTICES.md), [Contributing](CONTRIBUTING.md) and [Security](SECURITY.md).

Fictional chat blocks also support simulated voice notes (`[audio:0:15]`), multiline Markdown and opt-in visual presets (see [block examples](docs/BLOCKS.en.md)).
