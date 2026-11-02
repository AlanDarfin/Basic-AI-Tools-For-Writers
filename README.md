# Basic AI Tool for Writers

**Version:** 8.0.3 · **Requires:** Obsidian 1.11.4+ · **Desktop and Android** · **License:** MIT

[Leia em português](docs/README.pt-BR.md)

A single, compact writing workspace for planning books, organizing a fictional world, editing Markdown, reviewing text and optionally working with AI. Your notes remain ordinary files in your Obsidian vault.

## Features

| Area | What you can do |
| --- | --- |
| **Longform** | Organize books, chapters, subchapters and scenes; reorder them, use scene cards/list/Kanban, compile manuscripts and manage book series. |
| **Story planning** | Track plotlines, beats, pacing, scene links, goals, writing sessions, tasks and comments. |
| **World compendium** | Keep character, place, item and custom world sheets in Markdown notes with tags, folder-note inheritance, relationships, local images, maps and galleries. |
| **Timeline** | Plan events and milestones, use tracks and branches, and optionally configure a fictional calendar. |
| **AI writing** | Chat with note/selection context, definitions, synonyms, antonyms, translation and editable prompts; choose supported providers and models. AI is optional. |
| **Review** | Use LanguageTool spelling and grammar suggestions, a local personal dictionary, automatic paragraph checks, contextual correction menus, optional external LanguageTool integration and AI-assisted revision. |
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
