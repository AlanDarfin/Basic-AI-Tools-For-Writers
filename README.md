# Basic AI Tool for Writers

**A modular writing workspace for Obsidian.**

**Version:** 10.4.10 · **Requires:** Obsidian 1.11.4+ · **Desktop & Android** · **License:** MIT

[Leia em português](docs/README.pt-BR.md) · [Third-party notices](THIRD_PARTY_NOTICES.md) · [Security](SECURITY.md)

Write, plan, revise and organize books without moving your work to a separate database. The plugin combines a Longform workspace, worldbuilding tools, a configurable homepage, Markdown editors, language assistance and optional AI. Notes, folders, links and properties stay inside your Obsidian vault.


## Version 10.4.10 — grouped settings search, Android layout fix

- Rebuilt settings results as native-looking, self-contained rows instead of generic buttons, preventing conflicts with Obsidian themes and CSS snippets on Android.
- Repeated options such as **Subscript** or **Underline** appear once, with separately selectable destinations for **Formatting toolbar** and **Extended Syntax**. Every destination supports tap/click, Enter and Space.
- Removed redundant, conflicting search CSS from previous updates; result panels are compact, scrollable and independent of the internal settings container. Other controls, toolbar customization and alignment syntax are unchanged.

## Version 10.4.9 — compact settings and Markdown justification

- **Settings search results:** full-width, compact rows with small icons and readable section labels rather than narrow centered dark buttons; improved sizing and scrolling on Android.
- **Toolbar controls:** replace the oversized generic mobile dropdown/slider/color-picker rows with consistently spaced controls for Style, Button size, Placement and Colors. Keep all existing settings and functions.
- **Justification:** use the same short Markdown suffix syntax as other alignments: `Paragraph {j}` or `## Heading {j}`. Live Preview, Reading View, toolbar and command palette share the same implementation; no HTML wrapper is inserted. Older `{c}`, `{l}`, `{r}` and legacy notation still work.

## Version 10.4.8 — customizable editing toolbar and precise settings search

- **Editing toolbar:** keep the existing Markdown buttons, with additional indent/outdent, left/center/right and justified alignment, text color and background highlight. The Basic toolbar remains opt-in on mobile and never replaces Obsidian's own toolbar.
- **Customization inspired by Editing Toolbar:** add any command exposed by Obsidian or another installed plugin; customize button names and Lucide icon IDs; build named group submenus; drag or use up/down arrows to reorder buttons. Set Tiny, Compact or Comfortable density, icon labels, size, and color presets.
- **Placement:** top or bottom, plus optional Follow cursor on desktop (falls back to the bottom on mobile).
- **Settings search:** search by individual option instead of only categories. It indexes displayed settings, previously visited tabs, and the built-in formatting actions even before their list is expanded. The Portuguese alias `subescrito` finds `Subscrito`; selecting a result opens its section and highlights the corresponding control.
- **Settings layout:** compact search results, theme-aware input fields and buttons, horizontally scrollable navigation tabs, and reduced visual clutter at mobile widths.

## Version 10.4.7 — compact mobile Explorer and optional ordering controls

- **Compact mobile files:** manual-sorting arrows are no longer rendered across every file or folder row during normal browsing. Folder notes, favorite stars, images, descriptions and custom file icons remain intact.
- **Reorder only when needed:** in Obsidian's native **Sort** menu, select **Reorder items on mobile (Basic)**; alternatively use the command-palette shortcut **Explorer: toggle mobile reorder mode**. This temporary mode shows small overlay arrows without expanding row heights. Toggle it again to return to normal browsing; the mode starts off after each plugin reload.
- **Order preserved:** exiting the mode hides only the controls, never modifies, moves or deletes vault files or stored manual order. CSS stays compatible with Obsidian community lint requirements.

## Version 10.4.6 — compact LanguageTool corrections and stable review scrolling

- **LanguageTool suggestions:** compact, scrollable desktop correction menus, smaller icons, denser replacement rows and a tighter floating review popover, while retaining touch-friendly minimum sizes on mobile.
- **Typewriter and Remember Cursor:** neither feature moves the editor when a LanguageTool popup or correction menu is open, hovered or clicked. Pointer interactions suspend recentering; actual typing, input composition and arrow/navigation keys resume it.
- **Keep your viewport:** applying a correction with the mouse briefly preserves the visible CodeMirror scroll offset, even if the caret remains on a different line. Pending cursor-restoration timers are cancelled without erasing saved bookmarks.
- **Safety and compatibility:** ordinary note edits, keyboard navigation and language-review actions are preserved, with dedicated regression coverage.

## Version 10.4.5 — timeline visual presets and complete AI context grouping

- **Context menu:** organize AI tools at menu-display time, after other editors have registered actions, so Translate, Meaning, Synonyms, Antonyms and Rewrite appear under **AI · Tools** instead of duplicating in the root. Lookup/Translation and Writing/Revision have distinct Lucide icons; original actions and other plugins are kept.
- **Timeline:** restore visual distinctions from George-debug's original `line-2` to `line-5` and `body-2` to `body-4` styles (rings, solid dots, dashed rails, diamonds, panel/flag/accent borders), including all eleven upstream `active-color-*` tokens and `spaced-lines` / `hide-titles`.
- **Named themes:** Minimal is now open, unboxed prose; Compact uses dense rows with inline date and title. Cards, Classic and Editorial remain, joined by Poster, Glass and Terminal. The Timeline toolbar offers live theme, line and card selectors without changing the Markdown source.
- **Compatibility:** preserves image events, horizontal/vertical layouts, metadata links, groups, search and old code fences. Includes automated syntax and regression tests.

## Version 10.4.4 — context menus, double-press hotkeys and Homepage navigation

- **Editor context menu:** AI actions are grouped into lookup/translation and writing/revision submenus where Obsidian's menu API supports it; the Basic's extra text-formatting and alignment actions are available inside Obsidian's existing **Format** submenu. Native and third-party actions remain intact if they cannot be safely grouped.
- **Configurable double-press keys:** replace the single Double Shift configuration with a dedicated expandable shortcut manager. Add multiple key-to-command bindings, choose a command from a searchable list, set editing contexts, and remove or disable individual bindings. Existing Double Shift preferences migrate automatically. Letters/digits/Tab/Space cannot trigger while editing text.
- **Homepage:** on desktop, the search field gains focus when the Homepage opens (not on every rerender). Opening a note from search, recent notes or widgets replaces the Homepage in the same tab instead of creating a new tab; mobile does not autofocus.

## Version 10.4.3 — root sorting and a single native control

- **Vault root:** root folder keys `/` and `(empty)` are treated as the same folder. Manual order now renders through the native File Explorer sorting method, rather than conflicting with a second CSS-order pass.
- **Single sorting control:** choose sorting from Obsidian's existing **Change sort order** toolbar button. Its built-in sort options apply globally, while Basic adds Manual sorting, Number in title, YAML property and Folders first. Any option selected there affects **all folders**, including the root.
- **Clean context menus:** remove `Sort this folder`, `Move earlier` and `Move later` from file context menus. Pinning, hiding, icons, previews and other actions are unchanged. Mobile inline reorder controls remain available in manual mode.
- **Spaces shortcuts:** sorting shortcuts in the Spaces sidebar point to the same native Explorer button. Existing per-folder custom orders are preserved and used when the global Manual option is chosen.

## Version 10.4.2 — safer Explorer sorting, mobile Spaces and bookshelf

- **Manual sorting:** moving a note up/down no longer reparents Obsidian's native File Explorer DOM nodes. The plugin applies visual CSS order without renaming, deleting, or moving vault files and restores original styles on unload.
- **Spaces sidebar:** keep the Space tabs visible while scrolling the note list independently, with a count and buttons for new Space, Longform bookshelf and sorting the current folder.
- **Bookshelf:** add interactive sorting and responsive single-column cards for narrower screens; improve reading-status, percentage and shelf controls, with a direct ribbon shortcut.
- **Fictional voice notes:** generate a different waveform-height and animation pattern for each rendered message; no audio is generated or fetched.
- **Shortcuts:** add palette commands for switching Spaces, quick pinning, sorting the current folder, and a compact Basic quick-actions ribbon menu.
- **Personal CSS:** the separate optional `Basic-Compat-Unificado-v2.css` snippet preserves the user's previous styles while adapting subtitle alignment, heading overrides, Spaces and bookshelf.

## Version 10.4.1 — heading alignment and easier controls

- Align **headings (H1–H6) and paragraphs** while preserving native Markdown. Use a short end-of-line suffix: `# Chapter {c}`, `## Subtitle {r}` or `Text {l}`. Suffixes are hidden in Reading View, and outside the active Live Preview line when enabled.
- Use Left, Center, Right or the new **Cycle line or heading alignment** command. Assign them to desktop hotkeys or add them to the Obsidian mobile toolbar; they operate on the current line and preserve heading markers.
- Legacy `::c: text` and `::c[text]` remain supported. Commands can convert old notation into the short suffix without losing Markdown headings.
- Explicitly aligned headings override blanket heading-centering CSS snippets while unmarked headings retain your usual style.

## Version 10.4.0 — native Explorer sorting, Spaces and audio polish

- **Explorer:** custom folder order is now applied through a guarded native sorting adapter when supported; a DOM fallback remains for other versions. Global hiding also covers folder descendants and is synchronized on native explorer renders.
- **Manual sorting:** drag notes/folders into position inside a custom-sorted folder without requiring Alt by default; an optional Alt modifier and a drop indicator are available. Existing mobile arrow controls remain available.
- **Spaces:** selecting a Space activates its independent state, curated collections can sort by inclusion order, and the manager searches up to 5,000 results with pagination. Add the current note from the note context menu.
- **Fictional chat:** center the play/pause icon inside voice-note circles.
- **Enhancement Suite:** choose the thickness and accent/hex color of the existing Reading View progress line.

## Version 10.3.0 — Explorer, Spaces and alignment fixes

- **Alignment:** use `::l: text`, `::c: text` or `::r: text` on their own line; no square brackets required. Old bracket syntax is still recognized for compatibility.
- **Explorer:** better sized desktop toolbar; remove redundant preview-expansion and icon-grid name hover labels.
- **Spaces:** access the manager via a mobile ribbon button; remove per-Space file hiding while preserving global explorer hiding.
- **Sorting:** dedicated manual folder sorting, reset and drag toggle commands; the existing custom sort uses Alt + drag on desktop.
- **Reading:** optional progress line in the Reading View when the Enhancement Suite is enabled.

## Version 10.0.0 — consolidation, not a rewrite

- **Fictional chat audio:** if a written transcription is present, it appears immediately below the animation, with no show/hide button. This is not speech recognition.
- **Longform bookshelf:** a visual library of existing Longform book indices and covers, a compact **Books** homepage widget, and a Markdown bookshelf block. Chapter counts are not reading progress.
- **Spaces:** optionally save and restore pane layouts per Space; automatic saving and restoration are separate and off by default. Existing filters, icons, sorting, independent widgets and dock remain intact.
- **Gallery:** adds **Documents** to existing image, video, audio and PDF types. DOCX/EPUB open using the app's native handler, not as editable rich-text files.
- **Text editor:** explicit Save, conflict detection and 512 KiB limit for supported source and plain-text formats; binary files are not edited.
- **Writing utilities:** opt-in Double Shift to launch the command palette; table-row sorting, JSON selection formatting and callout insertion.
- **Settings:** groups are now General, Customization, Workflow, AI & Dictionary, Longform, Writing & Markdown, and Review & Reading.

See the [v10 feature-by-feature audit](docs/V10_REVIEW.en.md), [current/legacy block guide](docs/BLOCKS.en.md) and [Portuguese documentation](docs/README.pt-BR.md). These are independent integrations inspired by other plugins, not claims of full upstream equivalence.


## Mobile Spaces, properties, chat and images · 10.2.0

**Spaces:** responsive mobile note cards, left-aligned names, truncated paths, view switches and pagination instead of an overflowing two-column grid.

**Pretty Properties:** native row actions (⋯) hide a property in one note or all notes, assign a per-property icon and reveal hidden fields without deleting YAML data.

**Fictional chat:** compact WhatsApp-style author-written voice transcripts, independent speaker bubble colors and transparent conversation background. It does not record or transcribe real audio.

**File previews:** banner/cover/thumbnail properties, local embeds and explicitly linked HTTPS images (remote loading can be disabled for privacy).

**Image search:** Wikimedia Commons without a key; optional direct Pexels, Pixabay and Unsplash APIs with the user's own keys, no third-party search proxy. Save photos into the vault or insert a URL, including into frontmatter.

**Text alignment:** line-anchored non-codeblock syntax ::l[text], ::c[text], ::r[text], preserving Markdown bold/italics without conflicts with pipes or link slashes.

[10.2 detailed guide](docs/V10_2_MEDIA_AND_EDITOR.en.md) · [Markdown syntax](docs/BLOCKS.en.md)

## Expanded writing workflows · 10.1.0

This update extends the existing v10 foundation **without rewriting projects, migrating notes destructively or removing legacy syntax**. Settings and features are bilingual (PT/EN), and optional actions remain opt-in where they change many files or rearrange the workspace.

- **Longform:** less disruptive chapter-panel scroll and focus, desktop drag handle and a touch-hold-to-select destination workflow on mobile.
- **Bookshelf:** local reading progress (0–100%), planned/reading/paused/finished statuses, shelf/genre labels, favorites, filtering, series/progress ordering and pagination. Progress is a manual book record, not inferred from chapter count.
- **Spaces/Workspace:** per-Space versioned layout checkpoints with restore, JSON export/import, bounded history and preservation of the previous layout before overwrites. Layout switching may reorder tabs; confirm before restoring.
- **Flow/Explorer:** graph layout and note dependencies using \`after:[[Note]]\`, cycle-bounded depth, and expanded sorting-spec patterns/numeric and property descending options.
- **Media Gallery:** incremental pages, multi-selection, copying vault links, lightweight document excerpts, video metadata previews, and native PDF/document opening. Full PDF page rasterization and office document editing are not included.
- **Files/Enhancement Suite:** extended source file extensions, editing status (line/column), Tab indentation, YAML validation, filtered Markdown table preview, guarded CSV export, footnotes and opt-in batch frontmatter edits backed by Snapshots.
- **DoubleShift:** choose same/left/right/either Shift, trigger context and modal exclusions; feature stays disabled until enabled.
- **Timelines:** eras, dependencies, dependency ordering and paginated event rendering.
- **LanguageTool:** book-local accepted words, optional additions from suggestion menus, and clamped popup position; other projects retain their own dictionaries.
- **Homepage:** named widget layout presets, keyboard arrows on widget handles and explicit Books widget metadata.
- **Calendar:** offline import and export of local \`.ics\` files with confirmation and duplicate detection. **No live Google Calendar synchronization.**
- **Study and Pomodoro:** configurable repetition intervals, review forecast and remembered deck; focus history, weekly chart, task counts and CSV report.
- **Cursor and audio:** mobile cursor restoration retries that stop upon interaction; chunked native TTS and optional Soundscapes audio focus. Native TTS availability still depends on the WebView.
- **Markdown:** extended source editing and editorial commands, keeping existing Pandoc, Keyshots, variants, typewriter and syntax tools.

See the [complete v10.1 feature/compatibility review](docs/V10_1_ALL_FOLLOWUPS.en.md) and [current and legacy blocks](docs/BLOCKS.en.md). Most new actions are available in their existing settings tabs and via the command palette.

## Features

### Books, chapters and story planning

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
- **Reordering:** drag the handle on desktop; on touch devices, select a handle and then another widget heading. The widget menu also has earlier/later commands.
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
4. Enable **Basic AI Tool for Writers** under **Settings → Community plugins**.
5. Open its settings to choose which modules, providers, integrations and homepage widgets are enabled.

**Updating:** your installed copy does not update merely because a commit was pushed to `main`. An updater needs a published versioned Release containing the three plugin files. If installing manually, replace the files together and reload Obsidian.

## Data and privacy

Local writing, projects, metadata, favorites, study information and most dashboard features work with vault files or plugin settings. External AI, online translation, remote LanguageTool, YouTube radio and online TTS require network connections when used. Do not enable services that transmit note content unless you are comfortable with their provider's data handling. Session drafts that are not saved to a file are temporary.

For open-source licensing and integration details, see [Third-party notices](THIRD_PARTY_NOTICES.md), [Contributing](CONTRIBUTING.md) and [Security](SECURITY.md).

Fictional chat blocks also support simulated voice notes (`[audio:0:15]`), multiline Markdown and opt-in visual presets (see [block examples](docs/BLOCKS.en.md)).
