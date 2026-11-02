# Basic AI Tool for Writers

**Version:** 9.0.0 · **Requires:** Obsidian 1.11.4+ · **Desktop and Android** · **License:** MIT

[Leia em português](docs/README.pt-BR.md) · [Release notes](docs/V9_RELEASE.en.md)

A single, compact writing workspace for planning books, organizing a fictional world, editing Markdown, reviewing text and optionally working with AI. Your notes remain ordinary files in your Obsidian vault.

## What's new in v9

- **Configurable formatting toolbar:** 27 Markdown actions, reorderable/optional controls, desktop enabled by default, mobile **disabled by default** and opt-in via settings. The native mobile editing toolbar is not replaced.
- **Make.md-inspired native explorer tools:** customize vault file/folder icons and accent colors from the File Explorer context menu, inspect folders as filterable list/cards, and create/open Markdown folder indices. No extra sidebar.
- **Homepage design:** centered title, icon above it on mobile or alongside it on desktop; broader Lucide options or a vault/HTTPS image; clock above the calendar at all sizes. Search stays at the top.
- **Smart Spaces (opt-in):** save collections of Markdown notes filtered by folder, tag and YAML property, view as cards, list, table or grouped board. Off by default, no additional sidebar.
- **Modular switches:** toolbar, Spaces and native explorer modules can be hidden under Modules; individual controls and behaviors are configurable. Portuguese and English UI.

**9.0.1 preview on a work branch (not released):** [UI, Lucide picker, optional Spaces sidebar and visual password-lock changes](docs/V9_0_1_PREVIEW.pt-BR.md). The lock only controls access within the Basic interface; it **does not encrypt vault files**. Existing v9.0.0 behavior remains the release baseline.

Previous stable version: **8.3.0**.

This is an **independent integration**, not a complete fork of Make.md. Make.md's relational databases, formulas, rollups, full Spaces engine and Flow editor have **not** been ported; the local Smart Spaces are a simplified alternative. See [v9 release notes](docs/V9_RELEASE.en.md) and [the historical compatibility audit](docs/V9_FINAL_AUDIT.md). Back up your vault before updating.

### Calendar v9

The writing calendar now includes a responsive built-in mini-calendar/sidebar, 3-day and 30-day agenda views, timeline slots, categories, local events with locations/details, configurable colors, recurring intervals and end dates. Edit one occurrence or an entire series, and exclude selected dates. It stores ordinary Markdown event notes; it does **not** implement two-way Google Calendar, CalDAV or ICS synchronization.

## Features

| Area | What you can do |
| --- | --- |
| **Longform** | Organize books, chapters, subchapters and scenes; reorder them, use scene cards/list/Kanban, compile manuscripts and manage book series. |
| **Story planning** | Track plotlines, beats, pacing, scene links, goals, writing sessions, tasks and comments. |
| **World compendium** | Keep character, place, item and custom world sheets in Markdown notes with tags, folder-note inheritance, relationships, local images, maps and galleries; Folder Notes with a hidden Explorer file and an open button, plus dynamic folder overviews. |
| **Timeline** | Plan events and milestones, use tracks and branches, and optionally configure a fictional calendar. |
| **AI writing** | Chat with note/selection context, definitions, synonyms, antonyms, translation and editable prompts; choose supported providers and models. AI is optional. |
| **Inline AI** | Optional Inscribe-inspired continuation directly at the cursor; manual trigger, ghost text, Tab to accept, customizable prompt and per-folder profiles. Disabled by default; automatic provider requests are separately opt-in. |
| **Social posts** | Local fictional posts, flame reactions, metrics and nested replies for story documents. |\n| **Media gallery** | Search and filter local images, video, audio and PDFs in an embedded gallery, inspired by Media Gallery View. |\n| **Image captions** | Show short captions from normal Obsidian image alt text, without changing notes. |\n| **Fictional chats** | Markdown conversation bubbles, speaker alignment and optional profile pictures from your vault. |\n| **Writing homepage** | Search, favorite notes, quick drafts, recent files and Longform shortcuts in a configurable local dashboard. |\n| **Review** | Use LanguageTool spelling and grammar suggestions, a local personal dictionary, automatic paragraph checks, contextual correction menus, optional external LanguageTool integration and AI-assisted revision. |
| **Writing tools** | Vault autocomplete, text variants, comparison before replacing text, local note snapshots, Unicode picker and abbreviations. Index management lives in the plugin settings. |
| **Editing** | Keyshots-inspired navigation, Easy Typing, Smart Typography, Typewriter focus, remembered cursor position and note-name templates. |
| **Markdown formatting** | Extended Markdown, Pandoc-style lists and blocks, optional Pandoc export on desktop, plus tabs, avatars and Wiki cards. |
| **Reading aloud** | System voices when available or optional online TTS with user consent. |

The **Writing / World / Project** navigation and independent module toggles keep narrow sidebars usable. Changes to scene and world metadata use Obsidian notes and properties rather than duplicating the story database.

## Using Markdown formatting

Enable **Settings → Basic AI Tool for Writers → Modules → Extended Syntax** and its **Tabs, avatar and Wiki cards** option. Write the examples in a Markdown note; view the rendered results in Reading View or supported Markdown preview.

### Inline formatting

| Write | Result |
| --- | --- |
| `++underlined++` | Underlined text |
| `||hidden information||` | Click/tap-to-reveal spoiler |
| `^superscript^` and `~subscript~` | Raised/lowered text |
| `=={yellow}important==` | Highlight using a theme color |
| `!!{important}text!!` | Span with the scoped class `writer-v5-class-important` |

Only supported color names are styled by default (for example `yellow`, `blue`, `green`, `red`, `purple` or `accent`). Extended features can be switched off individually.

### Tabs inside a note

Use a fenced `writer-tabs` block. Begin each tab with `=== Title`; each tab body supports Markdown. There can be up to 12 tabs.

~~~~markdown
~~~writer-tabs
=== Synopsis
A short overview of the story.

=== Characters
- [[Character One]]
- [[Character Two]]

=== Notes
**Themes:** memory and choice.
~~~
~~~~

Tabs are horizontally scrollable and keyboard accessible. Switching tabs does not alter the underlying note.

### Character avatar card

Use an image stored inside your vault, referenced as an Obsidian link.

~~~~markdown
~~~writer-avatar
name: Maria
role: Protagonist
image: [[Images/maria.webp]]
---
A character with **her own motivations** and backstory.
~~~
~~~~

If the image cannot be found, the card shows a letter placeholder. External image URLs are intentionally not loaded by this block.

### Wiki-style entry

Use `writer-wiki` to make a compact infobox with properties and Markdown below the separator.

~~~~markdown
~~~writer-wiki
title: Ashen Harbor
type: Location
image: [[Images/harbor.webp]]
region: Northern coast
population: 1200
---
A port city known for its archives.

Related entry: [[Character One]].
~~~
~~~~

These are **presentation blocks**, not a separate Wiki database. You can still use normal Markdown notes, links, tags and frontmatter for worldbuilding.

### Folder Notes and dynamic overview

Folder Notes appear as a book icon at the far edge of the folder row in the native file explorer. The matching note file is hidden from that explorer tree (not deleted); toggle this feature in **Settings → Compendium / Folder Notes**. Clicking the folder caret still expands its children.

Add a live overview to any Markdown note with a fenced `writer-folder-overview` block. It lists notes and subfolders as cards or as a list. Use the command **Folder: insert overview**.

~~~~markdown
~~~writer-folder-overview
style: cards
subfolders: true
depth: 2
limit: 48
~~~
~~~~

Supported settings: `style: cards|list`, `folder: path/to/folder` (optional), `subfolders: true|false`, `depth: 0..3`, `noteOnly: true|false` and `briefMax: 32..220`. Existing notes remain editable. The legacy `ccard` syntax is not replaced.

### Inline writing completion

Enable **Settings → Extended Syntax → Inline AI**. Run the command **Inline AI: suggest continuation**; the suggestion appears faintly at your cursor. Press **Tab** to insert it or **Esc** to dismiss it. Turn on *Automatic suggestions* only if you want text context to be sent to your configured provider while typing. You can change the prompt, delay and per-folder rules (`Books/|creative`, `Research/|formal`, `Private/|off`). The feature uses your writing-assistant provider and model, and does not install or copy Inscribe.

### Interactive tabs and character cards

Use `layout: side` or `layout: right` **before the first tab** to position the tab strip vertically. Leave it out for horizontal tabs. Click/tap the rendered content to edit the Markdown, then select **Save** (or Ctrl+Enter). **Cancel** keeps the original text. The **+** button creates another tab (up to 12).

~~~~markdown
~~~writer-tabs
layout: side
=== Synopsis
First chapter summary.

=== Characters
- [[Maria]]
- [[João]]
~~~
~~~~

Avatars can use `layout: left` or `layout: right` to place a larger portrait beside the description. Click the description to edit without having to locate the block in source mode:

~~~~markdown
~~~writer-avatar
name: Maria
role: Protagonist
image: [[Images/maria.webp]]
layout: right
---
**Description:** A determined explorer from the north.
~~~
~~~~

Edits modify only the identified fenced block in the note. If its contents changed elsewhere, the plugin refuses the save instead of overwriting newer changes. Clicking Markdown links still opens those links.

### Fictional social posts and Reddit-style replies

The `writer-post` block is a story prop, **not a connection to a real social network**. Counts are text you author; the flame represents likes. Each `=== reply` begins a response, with `depth: 1..5` to control the threaded indentation.

~~~~markdown
~~~writer-post
author: Maria
handle: @maria
avatar: [[Images/maria.webp]]
date: 2h ago
likes: 42
views: 1200
---
A mysterious letter arrived at the harbor today.

=== reply
author: João
handle: @joao
depth: 1
likes: 8
---
Did it have the old seal?

=== reply
author: Maria
depth: 2
likes: 3
---
Yes. **The same one**.
~~~
~~~~

The displayed comment count on the main post defaults to the number of authored replies. Override it with `comments:` for storytelling.

### Media Gallery — local vault files

Inspired by [Media Gallery View](https://github.com/RobertoJarquinRR/Media-Gallery-view), `writer-media-gallery` creates a local media browser inside a Markdown note. It filters images, videos, audio and PDF files, supports search, several layouts and a preview for images/audio/video. PDFs open in Obsidian.

~~~~markdown
~~~writer-media-gallery
path: Book/Images
type: all
layout: grid
sort: name-asc
subfolders: true
limit: 90
~~~
~~~~

`path` is optional and defaults to the note's folder; `type` accepts `all`, `image`, `video`, `audio` or `pdf`; `layout` accepts `grid`, `masonry` (lightweight responsive grid) or `ratio`. No external image hosting or generated PDF/audio thumbnails are required. For existing notes, use the command **Gallery: insert media block**. This is a focused, original integration rather than a complete copy of the separate plugin.

### Image captions (inspired by Image Captions)

Add a short description by using ordinary Obsidian Markdown: `![[Images/harbor.webp|The harbor at dawn]]` or `![The harbor at dawn](Images/harbor.webp)`. The description appears below the image in supported Reading View rendering. `![[Images/harbor.webp|%]]` uses the image filename as its caption.

Captions use the existing Markdown alt text, never change the original note and are capped at 180 characters by default (configurable in **Settings → General**). When the separate **Image Captions** plugin is enabled, Basic AI skips its own captions to avoid duplication. For more advanced alignment and Live Preview features, use that dedicated plugin.

### Fictional chats — fast character messages

The `writer-chat` block now supports short lines: **<** places a message on the left, **>** on the right, and **|** separates the fields. These formats are accepted:

- `< Avatar | Name | Message | Time` (explicit local portrait)
- `< | Name | Message | Time` (no portrait)
- `< | Message | Time` when a speaker is set for that side in the opening directives.

Define speaker defaults **at the beginning of the block**: `[Maria=blue, João=red]` assigns colors, `[Maria=Imagens/maria.webp]` assigns a local avatar, and `[Left=Maria, right=João]` supplies the names when omitted.

~~~~markdown
~~~writer-chat
title: Harbor messages
[Maria=blue, João=red]
[Maria=Images/maria.webp]
[Left=Maria, right=João]

< | Did you get the map? ![[Images/map.png|240]] | 18:30
> | **Yes!** I found it under the table. | 18:31
< Images/other.png | Maria | Look at this second photo. | 18:32
> | João | I'll be there in five minutes. | 18:34
~~~
~~~~

An explicit avatar on a message overrides a speaker's default photo. Without either, **no empty avatar placeholder appears**. Allowed colors: red, orange, yellow, green, blue, purple, pink, cyan, gray and accent (also grey). They follow Obsidian's theme variables rather than inserting arbitrary CSS.

The message body is rendered with Obsidian's Markdown renderer, including vault images, links, **bold**, *italic*, lists and the Basic AI extended syntax (such as `++underline++`, `=={blue}highlights==` and `||spoilers||`) when those modules are enabled. A `|` inside `![[image.png|240]]`, Markdown links or inline code does not split the message; escape a literal pipe as `\|` when necessary. Additional lines after a message belong to the same bubble until the next left/right message starts.

The original format with `=== Maria`, `side: left`, properties and `---` is still supported for existing notes. All messages are fictional, stored in Markdown, and no external chat request is made.

### Calendar and event planning (inspired by Full Calendar Remastered)

Use **Calendar: open agenda** or the **Calendar** shortcut on the writing homepage. Clicking a date in the small homepage calendar opens that day in the full calendar. The standalone local calendar provides **month, week and day views**, next/previous/today navigation, creation, editing and explicit two-step deletion, event time ranges, categories and **daily, weekly, monthly and yearly** recurrence.

Events are **actual Markdown notes** inside `Writing Calendar/` (created only when you save an event). The plugin stores a minimal, editable YAML frontmatter with `writerCalendar: true`, `title`, `startDate`, `startTime`, `endTime`, `repeat` and `category`; the note body remains editable in Obsidian.

~~~~markdown
---
writerCalendar: true
title: "Writing session"
startDate: "2026-11-05"
startTime: "15:00"
endTime: "16:00"
repeat: "weekly"
category: "Writing"
---

Plan chapter six and review character notes.
~~~~

This is an **independent local calendar inspired by [Full Calendar Remastered](https://github.com/obsidian-full-calendar-remastered/plugin-full-calendar)**, not the original FullCalendar UI or its GPL dependencies. It does **not** import Google Calendar, CalDAV or remote ICS events; install the dedicated plugin for those advanced synchronized sources. Your own calendar notes stay within the vault.

### Personalized Study and spaced repetition

Open **Study: review flashcards** from the command palette or choose **Study** on the homepage. The Study area finds notes marked with `#flashcards` or the tag configured in **Settings → General → Study** and groups cards by source folder. It recognizes `Question::Answer`, reversible `Question:::Answer`, simple `==cloze==` in tagged notes, and `{{c1::cloze}}` deletions.

~~~~markdown
#flashcards

What is the capital of Brazil?::Brasília
Red:::Vermelho
The Brazilian language is ==Portuguese==.
A historical city is {{c1::Ouro Preto}}.
~~~~

The review workflow shows the front first, then the answer. Choose **Again (10 min)**, **Hard**, **Good** or **Easy** to schedule another review using a lightweight SM-2-style model. Configure the tag, maximum cards per session and new cards per session. Progress is saved **locally in plugin settings**, not appended to your source notes, and is separate from the data of [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition).

This is a focused native Study area rather than a full reimplementation of all Spaced Repetition features (including its complex cloze customizations and advanced note-review modes). If you already use that plugin, the two schedulers remain separate; duplicate review tracking is not synchronized.

### Fuzzy homepage search

The search field at the top of the homepage now uses **fuzzy ranking**: accent-insensitive matching, filename prefixes, words, paths and headings, one-character typos and short subsequences. Exact and prefix matches rank above looser matches. Results remain local to the vault; no network queries are involved. Searching for a web address still uses the existing browser behavior.

### Writing homepage — clock, calendar and a top search

Open **Home: open writing dashboard** from the command palette, or create a new empty Obsidian tab. **New empty tabs open the writing homepage by default**. Disable this behavior in **Settings → Basic AI Tool for Writers → General → Open homepage in every new empty tab** (the stored option is `homeOnNewTab`). Existing notes, restored views and side panels are never replaced. You can separately choose whether to open the homepage on application startup.

At the top, a **personalized title and icon** appear above the action shortcuts. Choose the name and one of the built-in Lucide icons in **General**. The main vault search always stays beside the **live local clock and monthly calendar**, above all reorderable cards. The calendar supports previous/next month and a Today button; it displays your device's local date and time, without an external service.

**Harbor-style web links:** type a website or a full `https://` URL into the search field and choose **Open website** (or press Enter). On **desktop**, if Obsidian's built-in **Web Viewer** core plugin is enabled, the site opens in a native Web Viewer tab. On **Android/iOS**, the URL opens through the system browser. With Web Viewer disabled on desktop, it also uses the external browser. Only HTTP(S) addresses are accepted; the homepage does not make background network requests. Avoid opening sensitive/login websites in Obsidian's Web Viewer, as Obsidian recommends a dedicated browser for those. 

Other homepage cards: recent notes, favorites, Longform project shortcuts, story board, review tools, vault stats and three quick-draft slots. Reorder the cards using their arrows. Mark favorites using the search star or **Home: toggle current note favorite**. Quick drafts stay in local settings and export to fresh `Quick Notes/*.md` files without overwriting existing notes. They are not sent to AI providers.

### Other writing syntax

A fenced div uses an opening `::: class-name` line and a closing `:::` line. Pandoc-style formatting includes alphabetic/Roman-numbered lists, definition lists, numbered examples and custom labels; use the **Pandoc Syntax** module to enable those features. The retired editing toolbar is not part of the plugin.

## Getting started

1. Download `main.js`, `manifest.json` and `styles.css` from the **same release**. Keep the three files together in `.obsidian/plugins/basic-ai-tool-for-writers/`.
2. Enable **Basic AI Tool for Writers** in Obsidian's community plugins settings.
3. Open a sidebar from the command palette and enable only the modules you need in plugin settings.
4. Create a Longform project or open an existing one to use chapters, compendium and story planning.

For desktop Pandoc export, install Pandoc separately and enable the integration. On Android, desktop-only export is not available.

## Privacy and configuration

Core story planning, most editing tools, local snapshots and local formatting work without an AI account. AI, translation, online TTS and grammar providers may receive text you explicitly submit or configure for automatic checks. Review provider settings before enabling them. Back up your vault and the plugin's `data.json` before major upgrades.

Documentation: [Security and privacy](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Third-party acknowledgements](THIRD_PARTY_NOTICES.md).
