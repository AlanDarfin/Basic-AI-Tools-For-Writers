# Basic

**A writing workspace for Obsidian: plan, write, revise and organize your work in Markdown.**

**Version:** 13.15.0 · **Requires:** Obsidian 1.11.4+ · **Platforms:** Desktop and Android · **License:** MIT

[Leia em português](docs/README.pt-BR.md) · [Get started](docs/GETTING_STARTED.en.md) · [Feature guide](docs/SUITES_AND_INTEGRATIONS.en.md)

Basic brings chapter writing, story planning, editing tools, a configurable homepage and optional AI into your vault. Your notes remain ordinary Markdown files with their folders, links and properties. Choose the features you need and keep the rest out of your menus.

Task scans exclude checkboxes inside note properties, comments and code fences, and show how much of the vault was examined. Pending speech reads are cancelled when you stop, disable speech or change the note or provider. The homepage title and logo have more prominence while retaining their narrow-pane layout.

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
| **Write and edit notes** | Word suggestions, editor shortcuts, quote pairing, en/em dashes (`--` → `–`, `---` → `—`), immediate or Space-triggered literal/regex replacements, Backspace restoration, snippets, cursor memory and Markdown formatting. |
| **Organize a vault** | Workspaces, virtual collections, a configurable homepage, file previews, calendars, tasks, local database views and image annotation. |
| **Study and read** | Flashcards, spaced repetition, study routines, reading estimates, imported citations and read-aloud controls. |
| **Revise your text** | Local rhythm and repetition review, a personal spelling dictionary, optional LanguageTool checking, version comparisons and snapshots. |
| **Use AI when useful** | Definitions, translation, conversation, rewriting and editorial feedback, with provider and model choices per function. |

The [feature guide](docs/SUITES_AND_INTEGRATIONS.en.md) lists the current settings sections, available actions, connections and limits.

## Find settings without guessing names

Settings are grouped by the task you want to perform:

| Category | Examples |
| --- | --- |
| **General** | Quick start, Features, Writing profiles, Diagnostics and compatibility. |
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

Open **Projects** or the **Library** to create a book or add an existing note. Chapters remain separate Markdown files. The **Add story arc divider** icon in Longform's Scenes toolbar inserts a visual line, with an optional caption and drag/touch reordering. Dividers stay in Basic settings per draft and do not enter notes or compiled manuscripts. Continuous writing uses an editor for each expanded chapter; saves are explicit and check for concurrent changes.

Use the icon tabs under **Writing**, **World**, or **Project** to open a section. On narrow screens, swipe the tab strip sideways to see the remaining sections.

On phones, **Basic settings → General → Get started → Mobile status bar** controls the row below navigation. It uses available native status items or Basic indicators such as word count, editor mode, reading time and Pomodoro. The row hides while the on-screen keyboard is open.

In **Projects → Writing → Structure → Story plan**, develop a premise into a paragraph, a synopsis and a treatment. Mark stages ready when you choose and review later stages when an earlier one changes. In **Threads**, link a setup, reinforcements and a payoff to existing scenes. **Check** flags missing scenes and out-of-order or unfinished threads in the active draft. **Export plan** creates a separate Markdown note without changing the manuscript.

Open **Projects → Project → Review**, use the review button in **Scenes**, or run **Longform: open review queue** to work through comments in the active draft. Filter by chapter, search comment text or quotations, and switch between open and resolved items. Use **Comment on selection** from the editor to attach a passage, or **Comment on chapter** for a note without a quote. **Go to passage** selects the original text if it can be identified. Resolving or reopening a comment does not edit the manuscript.

Chapter drafts have local recovery copies. Use **Books: recover drafts** to inspect them, save a separate Markdown copy or discard an entry. A changed original is kept separate for review. Recovery copies and version snapshots serve different purposes; neither replaces an independent backup. Temporary session drafts stay in memory until you save them.

To assemble a manuscript, choose **Books: compile Markdown manuscript**, select saved files or current writing, review the preview and create a new file under `Basic Exports/`. Compilation includes all chapters in the selected draft, beyond the chapter-editor display limit. Missing chapters or conflicting versions block export. Refresh the preview to include later changes.

Optional desktop export to DOCX, EPUB, HTML or PDF uses a separately installed **Pandoc** executable; PDF may also require a compatible rendering engine. See the [first-use guide](docs/GETTING_STARTED.en.md#write-your-first-book).

## Format text without HTML

The Basic toolbar uses Markdown and Basic's own formatting syntax. Select text and use Underline, Superscript, Subscript or Spoiler to insert `++text++`, `^2^`, `~2~` or `||text||`. Text color and Background color use the exact colors saved in the desktop or mobile toolbar profile, for example `!!{color-cf517f}text!!` and `=={hex-ffd66a}text==`. Keep the matching options enabled under **Text formatting** to render them in Reading view and Live Preview.

## Review prose rhythm

Run **Writing: rhythm and repetition** on a selection or the current note. It shows sentence-length distribution, long sentences and paragraphs, and repeated words. Select a result to jump to its place in the editor. It skips frontmatter, headings, code fences and comments. Use the counts as reading cues rather than rules. No edits or network calls are made.

## Find saved websites

In the **Web bookmarks** homepage widget, search by name, URL or group, or select a group from the filter. The search covers all saved websites, including those outside the initial 12-link view, and does not contact the web.

## Reschedule a task

Open **Tasks: open dashboard** and use the calendar icon beside a task. Pick a date or choose **Today**, **Tomorrow**, **In 7 days** or **No due date**, then save. The dashboard updates its filters and changes only the due-date marker in the original Markdown note.

## Supported plugins

Basic's own tools work without these plugins. Its task dashboard now filters **Today**, **Overdue**, **Next seven days** and **Undated** tasks and can add a task to a chosen Markdown note with a preview. Native speech can read **from the cursor**, and folder focus is available from the file explorer with an inline **Show all** action. These features retain their normal on/off switches.

When another plugin is installed and enabled, Basic provides the support below. Support does not install the plugin, copy its settings into Basic or replace its engine.

| Plugin | Support provided by Basic |
| --- | --- |
| **Ultimate Toolkit** | Mobile floating-control coordination, explorer icon priority and an optional, explicitly selected speech provider using Toolkit's own player. Online Toolkit speech requires separate permission. |
| **Snailkit** | Coordinated mobile rail, popups and task controls; a Basic writing tab through its public Tasks API; native task previews/actions when available. Basic tasks also work on their own. |
| **LanguageTool** | Correct editor targeting, selected native preferences, native suggestion actions and narrow-screen tooltip styling. Basic's built-in grammar client remains independent. |
| **Visual Kit** | Native image annotation, clipboard/image actions and HTML panels, retaining its settings/index persistence. Desktop only. |
| **dropit** | Explicit native receive/send commands and desktop processing actions. Pairing and transfer rules remain in dropit. |
| **Syncthing Integration** | Its native conflict, diff and configuration dialogs. This companion is not a synchronization engine. |
| **Syncthing Manager** | Its native panel, cached status and explicit scan/diagnostic actions. Server configuration and schedules remain native. |
| **Obsidian Git** | Native source-control/history views and commands checked against the running backend. Mobile availability depends on Git's own initialized backend. |
| **FIT** | Explicit sync/status commands when the installed release exposes them. No invented panel or automatic synchronization. |

There is no dedicated **Integrations** settings page. Keep each plugin's full configuration in that plugin. Basic's speech provider stays under **Read aloud**, duplicate icon priority under **File explorer**, and floating-control layout under **Files & tools**. Existing command IDs and saved preferences are retained. Legacy panel commands remain available for existing setups.

See the [plugin support guide](docs/guides/companion-compatibility.md) for behavior, data use and platform limits. Compatibility layout temporarily hides secondary controls when there is no safe room and restores them when the obstruction closes; it does not change notes or external plugin settings.

## Basic Tools · translation and assistant

Use the **Translation** tab for selected text, pasted text or a separate translated Markdown copy. Choose DeepL, Google Translate (Cloud), Microsoft Translator, LibreTranslate, or one of the existing AI providers. Configure dedicated translators under **Settings → Basic → Artificial intelligence → Translation**. DeepL and Google Cloud use their official API keys. Microsoft also uses a resource region when required. LibreTranslate uses your instance URL and an optional key. Auto detection is available, and explicit source and target languages can be swapped. The installed languages for LibreTranslate depend on the instance.

In **Chat**, the current provider and model are visible. **Rewrite**, **Summarize** and **Brainstorm** prepare editable instructions without sending them automatically. **Stop response** ignores the pending answer locally and preserves your draft if the input is empty. The provider may still finish a request already sent.

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
