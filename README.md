# Basic AI Tool for Writers

**A modular writing workspace for Obsidian.**

**Version:** 9.2.12 · **Requires:** Obsidian 1.11.4+ · **Desktop & Android** · **License:** MIT

[Leia em português](docs/README.pt-BR.md) · [Third-party notices](THIRD_PARTY_NOTICES.md) · [Security](SECURITY.md)

Write, plan, revise and organize books without moving your work to a separate database. The plugin combines a Longform workspace, worldbuilding tools, a configurable homepage, Markdown editors, language assistance and optional AI. Notes, folders, links and properties stay inside your Obsidian vault.

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

### Native explorer and personalization

- **Iconic-style customization:** choose Lucide icons and colors for files, folders, favorites and the homepage.
- **Favorite notes:** stars in the native Explorer share their state with the homepage favorites widget.
- **Explorer previews:** optional descriptions, excerpts, cover images and first embedded image thumbnails; hide/show previews with a dedicated control.
- **Flexplorer:** pin or hide items, sort folders, define custom ordering and apply glob-based visibility rules without deleting files.
- **Compact UI:** scrollable tab strips, consistent tool menus and configurable modules help on smaller screens.

**Explorer description previews:** folder-note and Markdown-note summaries remain compact, but holding the mouse over a long description for **1.5 seconds** expands it in place. Moving the pointer away collapses it. Keyboard focus also expands long descriptions.

### Audio and accessibility

- **Soundscapes (desktop):** ambient YouTube radio and custom stations play in a **compact, floating in-app mini player** (not a tab). Open it from the homepage or status bar, hide it without disconnecting the guest, or stop to unload it. It prefers Chromium's embedded Webview when available and falls back to a visible YouTube iframe if that is unavailable. The volume sliders on the homepage, status bar and mini player all control radio audio using the embedded player API; the same setting also controls local music. Radio volume is re-applied after the video loads or a station changes. Some videos may reject embedding (YouTube error 153). **My Music** continues to play local vault audio directly, with play/pause and volume controls.
- **Image Captions:** optionally display captions from Markdown image alt text, without rewriting the files.
- **Click Clack (desktop):** optional typing sounds with **13 downloadable sound packs** from the original Click Clack project (Cherry MX, IBM, Olympia, Quill and more). Browse the catalog in Settings to download one pack or all 13, then choose the installed scheme. Downloads are always opt-in; installed sounds work offline.
- **Text-to-speech:** system voices where supported or opt-in online voices, with language, speed, pitch and voice preferences. Online reading sends selected text to the chosen service only when enabled.
- **Keyboard and touch:** most views include buttons, menus and touch-compatible alternatives to dragging.


**Folder Overview (9.2.12):** icon-only entries now support card, nested list, compact, icon grid, table and board views. Sort by name, modification, creation, size or type; filter items and navigate subfolders on mobile with separate expand/open buttons. Optional summaries hide folder-note technical metadata.

**Complete copy-ready examples for every Markdown code block:** [English block guide](docs/BLOCKS.en.md) · [Guia em português](docs/BLOCKS.pt-BR.md).

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
