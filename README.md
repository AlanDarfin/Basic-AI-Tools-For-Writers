# Basic AI Tool for Writers

**A customizable writing workspace for [Obsidian](https://obsidian.md)** — dictionaries, translation, AI-assisted writing, LanguageTool, Longform-style projects, snapshots and everyday authoring tools in one plugin.

**Latest stable:** [4.3.1](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/tag/4.3.1) · **Obsidian:** 1.11.4+ · **Platforms:** desktop and mobile · **License:** MIT

**Languages:** English (this README) · [Português (Brasil)](docs/README.pt-BR.md)

> **Updated in v4.1:** complete English localization across built-in writing panels, Longform and history dialogs, with automated bilingual regression checks.

> **New in v4:** hide individual features from menus without deleting their data, organize long manuscripts, review AI changes before applying them, use Obsidian's own native formatting controls, and run LanguageTool checks after a typing pause.

**4.1.1 maintenance:** Addresses Obsidian 1.11.4 CSS lint warnings, keeps compact mobile settings without `:has()` selectors, and cleans up the stylesheet cascade. Existing notes and settings are unchanged.

**4.2.0 introduced:** Typewriter mode now highlights the actual CodeMirror cursor line on mobile and desktop, including when Obsidian does not apply its native active-line class. The new built-in cursor memory saves each note's cursor position, optional selection and scroll offset, with local persistence and per-feature settings. No separate plugin is required.

**New in 4.3.0:** The experimental Editing Toolbar, its floating desktop/mobile UI, the six extra Markdown-formatting commands and associated settings have been removed. Use Obsidian's built-in formatting commands and native mobile toolbar instead. **Independent AI writing actions remain available** through the plugin's commands and panels; typewriter line highlighting and cursor memory remain unchanged.

**4.3.1 fix:** The typewriter-mode active-line accent no longer overlaps the first character. The highlight now uses a separate marker and consistent text spacing across lines on desktop and mobile. No other writing features have changed.

## Contents

- [What it does](#what-it-does)
- [Customizable modules](#customizable-modules)
- [Longform writing projects](#longform-writing-projects)
- [AI, dictionaries and translation](#ai-dictionaries-and-translation)
- [Review and writing tools](#review-and-writing-tools)
- [Text-to-speech](#text-to-speech)
- [Installation and upgrade](#installation-and-upgrade)
- [Configuration and privacy](#configuration-and-privacy)
- [Language support](#language-support)
- [Development and documentation](#development-and-documentation)

## What it does

| Area | Capabilities |
| --- | --- |
| **Dictionary** | Local Markdown dictionary, configurable online lookup, Yomitan dictionary import, definitions, contextual synonyms and antonyms, Markdown-rendered results and optional saving of new entries. |
| **Translation** | AI-assisted translation with source/target selectors, optional source-language detection, independent provider settings and editable prompts. |
| **Writing assistant** | Sidebar chat, selected-text context, customizable writing prompts and model/provider choices. |
| **Revision** | LanguageTool grammar/spelling suggestions, Markdown-aware offsets and review markers; AI style review; selective Diff before changing text. |
| **Longform projects** | Projects, nested chapters/scenes, drag-and-drop ordering, touch-friendly movement, drafts, project notes, tasks, writing goals, sessions and compilation workflows. |
| **Autocomplete and variants** | Local suggestions from files and dictionaries; multiple inline alternatives; AI-assisted rewriting and comparison. |
| **Snapshots** | Separate local version history, manual and optional automatic snapshots, line-based comparison, restore safeguards and optional attachment capture. |
| **Writing utilities** | Note mentions, chapter comments, abbreviations, Unicode picker, note-name templates, instant table of contents, alternative note subtitles, view preferences and typewriter focus mode, and per-note cursor/selection/scroll memory. |
| **Read aloud** | Browser/system speech when available, or optional online neural TTS with explicit consent. |
| **Customization and diagnostics** | 18 individually visible module categories, compact/mobile-friendly settings and local diagnostics. |

## Customizable modules

Open **Settings → Basic AI Tool for Writers → Modules** and disable anything you do not need. The related tabs, menu entries and shortcuts are hidden, leaving more room for the tools you use. **Disabling visibility does not delete notes, project data, prompts, comments or saved history**; re-enable the module whenever you want.

The available categories are:

| Module | What you can hide |
| --- | --- |
| Dictionary & definitions | Dictionary and lexical lookup |
| Translator | Translation sidebar and translation actions |
| Writing assistant | Chat and assistant shortcuts |
| Review & LanguageTool | Grammar and AI review interface |
| Longform & projects | Project workspace and shortcuts |
| Writing tools | Supplementary writing sidebar |
| Autocomplete | Local completion and indexing controls |
| Writing variants | Alternative wordings and variants |
| Diff & profiles | Selective AI revision and writing profiles |
| Version history | Snapshot access shortcuts, **not** existing safety backups |
| Text to speech | Read-aloud controls |
| Unicode | Unicode character picker |
| Templates & table of contents | Template and TOC authoring tools |
| Mentions | Note mention suggestions |
| Comments | Comments tab in the project workspace |
| AI writing actions | Contextual rewriting actions |
| Typewriter | Typewriter/focus mode |

Hiding a module is an interface preference, not a destructive uninstall. Existing Obsidian commands/hotkeys are kept compatible, while hidden functions are guarded where applicable.

## Longform writing projects

The independently implemented project manager is inspired by [Longform](https://github.com/kevboh/longform) and supports compatible project-index concepts; it is **not a complete replacement for every upstream Longform workflow**.

- **Chapters and scenes:** nested hierarchy, visual indentation, project/draft selection, file creation, moving by drag-and-drop on desktop or touch selection on mobile, plus up/down buttons. Chapter reordering preserves the sidebar scroll position.
- **Project management:** scene folders, word counts, daily/project goals, saved-file-based writing-session tracking, missing-scene warnings and safe handling of unindexed scenes.
- **Notes and tasks:** project note folders, quick notes, search, task tracking and comments attached to selected passages (locate, resolve/reopen and delete).
- **Compilation:** editable workflow steps, named presets, preview without writing files and safe Markdown output using a new file name. Supported built-in operations include frontmatter cleanup, link/comment removal, titles/numbering and concatenation.
- **Safety:** backups of project indexes, path validation, no automatic overwrite of existing manuscripts and **no execution of imported third-party JavaScript workflow steps**.

Only the selected project tab is rendered when possible, reducing unnecessary work in books with many chapters.

## AI, dictionaries and translation

### Supported AI providers

**OpenAI, Gemini, Grok (xAI), Claude (Anthropic), Groq Cloud, OpenRouter, Ollama**, and **custom OpenAI-compatible endpoints**.

Choose models and providers separately where supported (for example, dictionary, translation and writing assistant). Configure API keys and optional system prompts in the plugin settings. Remote providers may charge for requests. A local Ollama installation requires a reachable endpoint; a phone's `localhost` is not your desktop PC.

### Dictionary and synonyms

Look up terms in a local Markdown dictionary (default file: `Dicionario.md`), use configured online sources, import compatible Yomitan dictionaries and request definitions, synonyms or antonyms. Generated entries are rendered as Markdown and can be stored locally without overwriting existing entries.

### Translation

Select a target language and optionally a source language. Leaving the source on **Automatic** lets the configured AI provider infer it when you press **Translate**. Translation prompts are editable, and the translator can be hidden entirely in **Modules** if you do not use it.

### AI writing actions

Commands cover improving style, shortening or expanding passages, simplifying, adjusting tone, dialogue polish, grammar correction, critique and alternative approaches. The selective revision flow lets you compare the proposal with the original and choose what to accept, while retaining Markdown-aware safeguards.

## Review and writing tools

- **LanguageTool:** grammar and spelling suggestions in the review panel, optional ignored rules, Markdown syntax masking and markers aligned with the original text.
- **Automatic rechecking:** while the Review tab is open in grammar mode, checks run after a typing pause (3.5 seconds by default, configurable from 2–15 seconds), with rate limiting and safeguards against stale responses. Large notes are reviewed in a bounded window near the cursor; the panel indicates partial coverage.
- **Writing variants:** create and cycle through inline alternatives, generate new variants with AI and optionally snapshot before replacing original text.
- **Local autocomplete:** index the current note, vault notes, custom dictionaries and internal links, with exclusions, limits and optional ranking of frequently used choices.
- **Version history:** snapshots stored separately under `.basic-ai-history/`, optional automatic saving, Diff and safe restoration. Existing history from unrelated snapshot plugins is not modified.
- **Native formatting:** use Obsidian's built-in Markdown editor actions and mobile toolbar. Basic AI still provides separate **AI writing commands** for selected passages, without adding a competing formatting toolbar or Markdown-formatting commands.
- **Other tools:** note mentions, Unicode favorites and search, text abbreviations, property-driven alternate titles/view modes, templates by note name, instant TOC and typewriter mode.

## Typewriter and cursor memory (4.2)

**Typewriter:** Turn on Typewriter mode from the Integrated Tools settings or the command palette. The active line receives a theme-aware highlight even on mobile. Enable **Dim unfocused lines** if you want all other lines subdued.

**Remember cursor position:** In **Settings → Basic AI Tool for Writers → Cursor position**, toggle cursor memory, restore selection, and restore scroll independently. Bookmarks are saved locally with the plugin settings, limited to 500 notes by default (configurable up to 2,000). Reopening a Markdown note restores the stored position where possible; heading links are not overridden. You can forget the current note position using a command, or clear all saved bookmarks in Settings. This is an independent implementation inspired by [Remember cursor position](https://github.com/dy-sh/obsidian-remember-cursor-position), not copied code and no external plugin dependency.

## Text-to-speech

Choose **System / offline** speech when the Obsidian WebView exposes Web Speech voices, or explicitly enable **online neural speech** if you want that service. Available voice selection, language, rate and read-selection options depend on the engine.

**Android limitation:** a phone can have system TTS installed while Obsidian's WebView exposes no native speech voices. The plugin cannot guarantee native Android TTS access. Online synthesis sends the text to a third-party service **only when explicitly allowed**, needs connectivity and can become unavailable.

## Installation and upgrade

1. Download the latest [4.3.1 ZIP release](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/download/4.3.1/Basic-AI-Tool-for-Writers-4.3.1.zip).
2. Extract **`main.js`**, **`manifest.json`** and **`styles.css`** to:

   ```text
   <your vault>/.obsidian/plugins/basic-ai-tool-for-writers/
   ```

3. Enable **Basic AI Tool for Writers** in **Obsidian → Settings → Community plugins**, or reload it after an update.
4. Open **Settings → Basic AI Tool for Writers** to configure providers and show/hide modules.

**Updating from v2/v3/beta/RC:** back up your vault and plugin directory first. Replace the three distribution files, **never delete or overwrite `data.json`** (it holds settings and API credentials). If needed, restore your backed-up settings and previous release files to roll back.

This repository provides manual installation files; this README does not claim the plugin is available in Obsidian's community plugin directory.

## Configuration and privacy

- **Settings → Modules:** hide unused features. Your saved data remains intact.
- **Settings → Diagnostics:** inspect the plugin version, platform, Markdown file count, active modules, LanguageTool state, configured provider count, snapshot status and Web Speech API availability. Diagnostics do **not** send network requests or display full credentials.
- **AI providers:** cloud-based AI operations send selected text to the configured provider. You are responsible for any API costs or applicable terms.
- **LanguageTool:** when enabled, review and automatic checks send the analyzed text to the configured LanguageTool endpoint **while Review is open**.
- **Online TTS:** transmits text only with explicit opt-in.
- **Stored credentials:** API keys are saved in Obsidian's `data.json` **without additional encryption**. Avoid publishing or syncing this file to untrusted devices.
- **File safety:** review and restoration functions provide previews or backups where available. Keep regular vault backups, especially before upgrading or compiling large projects.

## Language support

The English interface has been reviewed for v4.1.0. The built-in interface supports **English** and **Portuguese (Brazil)**, following the Obsidian interface language. The **v4.1.0 localization pass** covers Longform project controls, compilation workflows, scene actions, variant dialogs, snapshot/version history, autocomplete settings, selective Diff and user-facing error messages. English is the fallback for other locales.

Existing Markdown files, project titles, custom workflow names and the historical `Padrão` / `Principal` storage identifiers remain unchanged for compatibility, while built-in labels are translated for display. The text translation feature independently supports multiple input and output languages through your configured AI model.

**What's new in v4.1:** the missing English labels and messages were translated without altering saved project identifiers, while automatic localization regression tests were added.

## Development and documentation

The Obsidian installation bundle is `main.js`; it includes the independently maintained source from `src/v3/`, `src/v4/` and the project manager in `projects.js`.

```sh
npm run build     # regenerate the bundled project and v3/v4 modules
npm run check     # source synchronization, syntax and regression tests
```

Documentation:
- [v4.1.0 stable release and migration guide](docs/V4_RELEASE.md)
- [Writing Suite — utilities, TTS, templates and Unicode](docs/WRITING_SUITE.md)
- [v3 autocomplete, variants and snapshots](docs/V3.md)
- [v4 release candidate checklist](docs/V4_RC1_CHECKLIST.md)
- [Historical README and earlier versions](docs/README_HISTORY.md)
- [Third-party notices and inspiration](THIRD_PARTY_NOTICES.md)

For questions or bug reports: [GitHub Issues](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues) · [Releases](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases) · [Repository](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers).

---

**Author:** Alan Darfin. Independently implemented features are inspired by community plugins such as Longform, Various Complements, VariantEditor and Note Snapshots; see [third-party notices](THIRD_PARTY_NOTICES.md) for attribution and compatibility limitations. Licensed under the repository's [MIT license](LICENSE.md).
