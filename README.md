# Basic

**A writing workspace for Obsidian: plan, write, revise and organize your work in Markdown.**

**Version:** 13.7.0 · **Requires:** Obsidian 1.11.4+ · **Platforms:** Desktop and Android · **License:** MIT

[Leia em português](docs/README.pt-BR.md) · [Get started](docs/GETTING_STARTED.en.md) · [Features and integrations](docs/SUITES_AND_INTEGRATIONS.en.md)

Basic brings chapter writing, story planning, editing tools, a configurable homepage and optional AI into your vault. Your notes remain ordinary Markdown files with their folders, links and properties. Choose the features you need and keep the rest out of your menus.

## Install and make it yours

1. Download **`main.js`**, **`manifest.json`** and **`styles.css`** from the [latest stable release](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/latest).
2. Put the three files together in `<your-vault>/.obsidian/plugins/basic-ai-tool-for-writers/`.
3. Open **Obsidian Settings → Community plugins** and enable **Basic**.
4. On a fresh installation, **Quick start** lets you choose **Essentials**, **Book writing**, **Study** or **Custom**, review the feature switches and select **Apply choices**. You can also choose **Set up later**.
5. Open **Settings → Basic → General → Get started** to continue. No AI account is needed for local writing tools.

Quick start changes feature choices after you apply them. It does not request API keys or change your notes. Existing installations keep their choices when updating. Reopen it with **Quick start: open** from the command palette or the button in **Get started**.

For manual updates, replace all three release files together and reload Obsidian. The GitHub source-code ZIP is not the install package. See the [installation and first-use guide](docs/GETTING_STARTED.en.md) for Android, upgrades and troubleshooting.

## What you can do

| Your workflow | Tools in Basic |
| --- | --- |
| **Write a book** | Chapters and subchapters, scene boards, continuous writing, project tasks, local draft recovery and complete Markdown manuscript compilation. |
| **Plan a story** | Characters, places, compendium entries, relationships, timelines, series, goals and editorial notes. |
| **Write and edit notes** | Word suggestions, editor shortcuts, quote pairing, dialogue dashes, literal/regex replacements, snippets, cursor memory and Markdown formatting. |
| **Organize a vault** | Workspaces, virtual collections, a configurable homepage, file previews, calendars, tasks, local database views and image annotation. |
| **Study and read** | Flashcards, spaced repetition, study routines, reading estimates, imported citations and read-aloud controls. |
| **Revise your text** | Local repetition review, a personal spelling dictionary, optional LanguageTool checking, version comparisons and snapshots. |
| **Use AI when useful** | Definitions, translation, conversation, rewriting and editorial feedback, with provider and model choices per function. |

The [feature guide](docs/SUITES_AND_INTEGRATIONS.en.md) lists the current settings sections, available actions, connections and limits.

## Find settings without guessing names

Settings are grouped by the task you want to perform:

| Category | Examples |
| --- | --- |
| **General** | Quick start, Features, Writing profiles, Diagnostics, integrations and compatibility. |
| **Appearance & panes** | Homepage, file explorer, note properties, images, media and widgets. |
| **Writing & editing** | Editor shortcuts, typing, word suggestions, cursor position, templates and quick actions. |
| **Markdown & formatting** | Toolbar, text formatting, lists, numbering, symbols, tables of contents and cleanup. |
| **Organization & focus** | Workspaces, calendar, tasks, databases, focus timer, music and protected notes. |
| **Books & projects** | Book writing, library, chapter navigation, project tasks and worldbuilding. |
| **Review & versions** | Grammar, AI review, selective comparisons, rewrites and version history. |
| **Reading & study** | Citations, reading time, read aloud, accessibility and spaced repetition. |
| **Artificial intelligence** | Dictionary, translation, assistant, connections, models and instructions. |

Use the settings search for an option such as *cursor*, *image*, *encryption* or *heading numbers*, even before visiting its page. Former feature names remain search aliases. Favorite frequently used sections for quicker access.

Under **General → Features**, turn features off or on to choose which entries and actions appear. Their settings remain available, and turning a feature off retains its saved data. Some sections also have their own functional switches. Apply restart instructions when shown under **Compatibility**. External plugins keep their own settings and background schedules.

## Write, recover and export

Open **Projects** or the **Library** to create a book or add an existing note. Chapters remain separate Markdown files. Use **+ Divider** in the Longform Scenes tab to insert an optional-titled story arc line, reorder it by drag or touch, or edit/remove it from the context menu. Dividers are visual-only, stored per draft in Basic settings, and never create notes or join the compiled manuscript. Continuous writing uses an editor for each expanded chapter; saves are explicit and check for concurrent changes.

Chapter drafts have local recovery copies. Use **Books: recover drafts** to inspect them, save a separate Markdown copy or discard an entry. A changed original is kept separate for review. Recovery copies and version snapshots serve different purposes; neither replaces an independent backup. Temporary session drafts stay in memory until you save them.

To assemble a manuscript, choose **Books: compile Markdown manuscript**, select saved files or current writing, review the preview and create a new file under `Basic Exports/`. Compilation includes all chapters in the selected draft, beyond the chapter-editor display limit. Missing chapters or conflicting versions block export. Refresh the preview to include later changes.

Optional desktop export to DOCX, EPUB, HTML or PDF uses a separately installed **Pandoc** executable; PDF may also require a compatible rendering engine. See the [first-use guide](docs/GETTING_STARTED.en.md#write-your-first-book).

## Optional AI and online services

Configure a connection under **Artificial intelligence → AI connections**, then choose the model and the functions that use it. Basic supports OpenAI, Gemini, Grok, Claude, Ollama, OpenRouter, Groq Cloud and compatible custom endpoints. Availability, model access and billing belong to the selected provider. Keys and connection checks are managed in settings; checks run on demand.

Typing in the dictionary searches saved Markdown entries. **Define word** or Enter requests an online definition; **Save definition** stores the result. Translation uses its own provider and languages, and translating a file creates a separate Markdown copy. The assistant keeps a failed message draft for retrying. Review suggestions change a note when you accept them.

Automatic grammar checks and inline AI can transmit text while you write when those features are enabled. Review their controls before turning them on. See [connections and data use](docs/SUITES_AND_INTEGRATIONS.en.md#connections-and-data-use) for LanguageTool, speech, radio, citations, browsing and synchronization.

## Data and privacy

- Notes, projects and local editing use your vault. Plugin preferences and API keys are stored in Basic's local settings; API keys are not held in an encrypted credential vault.
- Recovery copies, snapshots and exported copies may contain plaintext from your notes. Protect the vault, plugin data and backups according to your needs.
- Protected notes encrypt the content of newly created files with AES-256-GCM. Filenames remain visible and lost passwords cannot be recovered. Interface locks and folder focus provide visual privacy, not file encryption.
- External AI, remote grammar checking, online speech, radio and remote images use network services. Browser/OS speech voices are not guaranteed to work offline.
- Optional synchronization dispatches commands to separately installed plugins. Choosing a provider in Basic does not stop another plugin's automatic synchronization.

Read the [security and data-handling details](SECURITY.md) before using external services or encrypted notes.

## Platforms, help and documentation

Basic supports desktop Obsidian and Android. Keyboard presets, web radio, typing sound packs, desktop widget resizing and Pandoc export have platform-specific requirements. Voice availability depends on the device, browser and service. Responsive desktop screenshots do not establish physical Android compatibility for every feature; device testing remains necessary.

- [Installation and first steps](docs/GETTING_STARTED.en.md)
- [Feature, settings and integration guide](docs/SUITES_AND_INTEGRATIONS.en.md)
- [Markdown block examples](docs/BLOCKS.en.md): tabs, worldbuilding cards, fictional chat, media, columns, timelines and chapter navigation. Existing `writer-tabs`, `writer-avatar`, `writer-wiki`, `writer-post`, `writer-chat`, `writer-media-gallery` and `writer-folder-overview` aliases remain supported.
- [Release history](CHANGELOG.md) and [older documentation](docs/README_HISTORY.md). Older guides can use previous labels; use the current settings guide for navigation.
- [Report an issue](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues): include Basic/Obsidian versions, platform and reproduction steps. Keep API keys and private manuscripts out of reports.
- [Contributing](CONTRIBUTING.md) · [Third-party notices and credits](THIRD_PARTY_NOTICES.md) · [MIT license](LICENSE.md)
