# Getting started with Basic

Basic 13.7.0 requires Obsidian 1.11.4 or later. This guide covers installation, choosing features and completing a first writing workflow. For every settings section, see the [feature guide](SUITES_AND_INTEGRATIONS.en.md).

[Português](GETTING_STARTED.pt-BR.md) · [README](../README.md)

## Install on desktop or Android

1. Open the [latest stable GitHub release](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/latest).
2. Download `main.js`, `manifest.json` and `styles.css` from its **Assets** list. All three must come from the same version.
3. Inside your vault, create `.obsidian/plugins/basic-ai-tool-for-writers/` and place the three files directly inside it.
4. In Obsidian, open **Settings → Community plugins**, allow community plugins if needed and enable **Basic**.
5. If Basic does not appear, reload Obsidian and check the folder and filenames.

On Android, use a file manager that can access the vault and show the hidden `.obsidian` folder. The vault location depends on how you created it. Desktop-only features remain subject to their own platform limits.

The folder should look like this:

```text
Your vault/
└── .obsidian/
    └── plugins/
        └── basic-ai-tool-for-writers/
            ├── main.js
            ├── manifest.json
            └── styles.css
```

The GitHub **Source code** archives are repository snapshots, not the three-file plugin package. No extra nested folder should sit between `basic-ai-tool-for-writers/` and the three files.

## Choose a starting point

A fresh installation opens **Quick start** after the workspace is ready:

| Starting point | When to use it |
| --- | --- |
| **Essentials** | Start with everyday writing, language tools and the homepage. |
| **Book writing** | Add projects, chapters, navigation and story-writing tools. |
| **Study** | Start with study, reading, citation and formatting features. |
| **Custom** | Review the current feature selection and choose it yourself. |

A preset fills in the proposed switches. Use **Find a feature…** and adjust any of them before **Apply choices**. This screen does not request credentials, test services, create notes or restructure your vault. **Set up later** closes it so you can continue working.

Upgrading an existing installation does not open this setup automatically or replace its feature choices. To reopen it, run **Quick start: open** from the command palette, or use **General → Get started** in Basic settings. Reopening starts from your current choices.

For day-to-day changes, open **General → Features**. Turning a feature off hides its related entries and actions while retaining its data and settings. Its settings page remains reachable. Some pages also have an individual enable switch; follow any restart instruction shown for advanced compatibility settings. Other plugins' background tasks are independent of these choices.

## Find and favorite settings

Open **Settings → Basic**. Choose a category and a section, or use the search field to find a specific option before opening its page. Search accepts current names, previous names and both supported languages.

Useful starting queries include *cursor position*, *quote*, *PNG*, *numbering*, *encryption*, *calendar feed* and *model*. Select a result to open the relevant section and find its control. Favorite the sections you return to most; up to 12 sections can be saved.

| You want to… | Open this category and section |
| --- | --- |
| Turn features off or on | **General → Features** |
| Tune quote or replacement rules | **Writing & editing → Typing & typography** |
| Change editor hotkeys | **Writing & editing → Editor shortcuts** |
| Arrange the homepage | **Appearance & panes → Homepage** |
| Configure a book | **Books & projects → Book writing** |
| Manage flashcard reviews | **Reading & study → Study & spaced repetition** |
| Configure a provider | **Artificial intelligence → AI connections** |
| Inspect local status | **General → Diagnostics & shortcuts** |

The interface language follows Obsidian's English or Portuguese setting. Other host languages use the English interface. Response languages, translation languages and grammar languages are separate settings.

## Write your first book

1. Enable the project features in **General → Features** if their entry is hidden.
2. Open **Projects** or the **Library**. Create a book, or use **Add book** to include an existing Markdown note.
3. Add chapters and subchapters. Use their list or scene board to arrange them. Your project index keeps the order, and each chapter remains an ordinary Markdown file.
4. Open **Continuous writing**, expand a chapter and write. Choose its save action when ready. If another pane or the original file changed, review the conflicting text before trying again.
5. Open a chapter in a normal Obsidian tab whenever you want to use the full native editor. Continuous writing keeps separate editors for expanded chapters.

For an individual note in the library, a local cover and synopsis can be supplied with properties such as:

```yaml
---
title: My novel
banner: "[[Images/cover.webp]]"
description: A short synopsis.
readingProgress: 25
---
```

Project progress uses chapter information; `readingProgress` is useful for an individual-note book. The library also supports series and shelf presentation.

### Recover chapter writing

Chapter recovery copies are separate from the original notes and version snapshots. Run **Books: recover drafts** to inspect the text and the original-file status. You can save a new Markdown copy or explicitly discard an entry.

Matching recovery drafts can return to continuous writing after a restart. When the original has changed, the draft stays separate for review. Saving a chapter remains explicit. Turning off new recovery copies preserves copies already available. Temporary session drafts have a different lifecycle: save them to a note if you want to keep them after closing the application.

Recovery stores local plaintext in Basic's plugin data. Keep a separate vault backup and protect plugin data when sharing or synchronizing it.

### Compile the manuscript

Run **Books: compile Markdown manuscript** and choose the book. Select the text source:

- **Saved files** uses the versions written to disk.
- **Current writing** includes compatible chapter drafts and text from open editors. Conflicting versions or missing chapters require review.

The preview keeps the text chosen when it was prepared. Refresh it to include later edits. Compilation includes all chapters in the selected draft, even if the continuous-writing editor displays fewer chapters. Confirm to create a new complete Markdown file under `Basic Exports/`; existing chapters remain in place.

DOCX, EPUB, HTML and PDF export are separate optional desktop actions under **Markdown & formatting → Advanced lists & blocks**. They require an installed Pandoc executable; PDF may need another rendering engine such as LaTeX. Pandoc can access resources referenced by the document. Review export settings and [security details](../SECURITY.md) before using it.

## Add AI when you need it

1. Open **Artificial intelligence → AI connections** and select your provider.
2. Enter its key and endpoint where required. Ollama uses the server you configure; most hosted providers need an account and API access.
3. Choose a model under **AI models**. Fetching a catalog or running a connection check contacts the selected service when you request it.
4. Assign the connection to the dictionary, translation, assistant or reviewers. These can use different providers and models.
5. Try a short text. Review the result before accepting an edit or saving a definition.

You can use the saved Markdown dictionary without an AI key. Typing in **Definitions** performs local lookup; **Define word** or Enter requests an online result. The dictionary file is created when you save the first definition.

For translation, choose the source/target languages and use the explicit translation action. Translating a file saves a separate Markdown copy beside it. The assistant can use reference attachments; their text is part of the material sent to the configured provider. If a send fails, its draft remains available for retrying.

LanguageTool grammar checking has its own endpoint and language choices under **Review & versions → Grammar checking**. Automatic checking sends text after a typing pause while the review pane is active when enabled. Inline AI also needs explicit configuration before it can send text while you write. Keep either feature disabled when you do not want those requests.

## Try a local study note

Enable the study feature and create a Markdown note like this:

```markdown
#flashcards

What carries the protagonist's goal?::The scene conflict.
Before the reveal:::After the reveal
```

Open the study workspace to review the cards. `::` creates a forward card and `:::` creates cards in both directions. Study settings include scheduling choices; the feature guide explains the current scope and TSV interchange.

## Update, disable or remove

To update manually, replace `main.js`, `manifest.json` and `styles.css` with the same release version, then reload Obsidian. Check the installed version in **General → Diagnostics & shortcuts**. A commit on GitHub does not update files already installed in your vault.

To reduce the interface, use **General → Features** rather than deleting plugin data. To stop Basic entirely, disable it in **Community plugins**. Back up Basic's plugin folder before uninstalling if you need its preferences, chapter recovery, saved study progress or other plugin data. Ordinary Markdown notes stay in the vault; custom blocks need Basic enabled to render their enhanced view.

## If something is missing or fails

| Symptom | Check |
| --- | --- |
| Basic is absent from Community plugins | Confirm the three filenames and the exact install directory, then reload. |
| A panel or action is hidden | Check **General → Features**, its section's own switch and platform requirements. Settings remain accessible. |
| An advanced feature still uses its old state | Read **General → Compatibility** and restart when requested. |
| AI fails | Check the selected provider, model access, endpoint and account limits. Run a connection check on demand; avoid sharing keys in reports. |
| Grammar checking sends text unexpectedly | Check the automatic-check toggle and endpoint in **Grammar checking**. |
| A chapter refuses to save or compile | Inspect other open editors, recovery drafts and the original note; keep a separate copy of conflicting writing. |
| Voice or radio is unavailable | Check the device/browser, network, service and feature's platform limits. Available OS voices can differ by device. |
| A third-party sync command is missing | Install and enable that integration separately; its settings and credentials remain in the external plugin. |

For a reproducible problem, open an [issue](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues) with Basic/Obsidian versions, device and steps. Do not include keys or private text. More detail: [features and integrations](SUITES_AND_INTEGRATIONS.en.md), [blocks](BLOCKS.en.md), [security](../SECURITY.md) and [third-party credits](../THIRD_PARTY_NOTICES.md).
