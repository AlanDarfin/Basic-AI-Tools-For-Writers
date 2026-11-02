# Basic AI Tool for Writers

**Version:** 8.2.0 · **Requires:** Obsidian 1.11.4+ · **Desktop and Android** · **License:** MIT

[Leia em português](docs/README.pt-BR.md)

A single, compact writing workspace for planning books, organizing a fictional world, editing Markdown, reviewing text and optionally working with AI. Your notes remain ordinary files in your Obsidian vault.

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

### Fictional chats with optional portraits

Use `writer-chat` for scene conversations, phone messages or fictional transcripts. Only messages with an `avatar:` field display a profile image; otherwise the bubble is aligned without an empty circle. Local image paths resolve through your vault.

~~~~markdown
~~~writer-chat
title: Harbor conversation
=== Maria
side: left
avatar: [[Images/maria.webp]]
time: 18:30
---
Did you find the letter?

=== João
side: right
time: 18:32
---
Yes, it was **inside the old book**.

=== Maria
side: left
time: 18:33
---
Then meet me by the lighthouse.
~~~
~~~~

Message fields include `side: left|right|center`, `time`, `avatar: [[local.png]]`, and `mine: true` to align right. Each message body supports Markdown. The block works independently of the Chat View plugin and does not send messages to any external chat service.

### Writing homepage (inspired by Harbor Tab and Genkan)

Open **Basic AI: Home — open writing dashboard** in the command palette (or **Open homepage now** in **Settings → General**). It combines instant vault search, recent notes, favorites, quick navigation to your Longform project, the story board, review tools, simple vault stats and three quick-draft slots. The cards can be reordered with their arrow controls. Use the search star to add a note to your favorites or the command **Home: toggle current note favorite**.

Quick drafts are stored in the plugin settings, locally, and can be exported to fresh `Quick Notes/*.md` files without overwriting existing notes. They are not AI chats and never send their content to any provider. **Open writing homepage on startup is disabled by default**, so this doesn't take over Obsidian's new tabs or conflict with Harbor Tab, Genkan or other homepage plugins.

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
