# Basic AI Tool for Writers

A bilingual, AI-powered writing companion for [Obsidian](https://obsidian.md), available on desktop and mobile.

## Features

- **Definitions**, **synonyms**, and **antonyms**, with context-sensitive suggestions and Markdown-rendered results.
- **Translation** with independent AI provider, source language (or automatic detection), and target language.
- **Writing assistant** with custom prompts, selected-text context, copy and optional insert into the editor.
- Editor context menu actions for translating, defining, rewriting and finding alternatives.
- **Editable prompts** for definitions, synonyms, antonyms, translation and writing.
- Automatic storage of new definitions in an existing local Markdown dictionary, without displaying duplicate results.
- **Portuguese UI** when Obsidian uses Portuguese, **English** otherwise.
- Settings tabs: **General**, **Providers**, **Models**, **Assistant**, **Prompts**.
- Model catalog and API connection checks.

## Supported AI providers

OpenAI, Gemini, Grok (xAI), Claude (Anthropic), Groq Cloud, OpenRouter, Ollama, and custom OpenAI-compatible HTTPS endpoints.

Use separate providers for dictionary queries and translation. Providers require your own credentials, except a typical local Ollama installation. API requests may incur provider charges. Ollama on mobile must use a trusted server reachable from your phone; localhost on a phone is not your computer.

## Installation

Download `main.js`, `manifest.json` and `styles.css` from the latest GitHub Release and place them in:

```text
<Vault>/.obsidian/plugins/basic-ai-tool-for-writers/
```

Reload Obsidian and enable **Basic AI Tool for Writers** in Community Plugins. When migrating from an older installation, copy your existing `data.json` into this folder before enabling the plugin to preserve your settings.

## Configuration

Open plugin settings to choose the definition and translation engines, set your model IDs and API keys, and customize prompts. In the sidebar, the translation area has its own provider selector and language pair. Leaving the source language on automatic allows the AI to infer it when you click Translate.

The plugin stores API keys in its Obsidian data file **without additional encryption**. Do not publish or sync your configuration to untrusted devices. Text submitted to a provider is sent to that provider for processing.

## Local dictionary

By default, the optional local dictionary is `Dicionario.md`. New definitions are saved automatically when that file exists. Existing entries are not overwritten.

## Version

**1.2.0 — stable release.** Built for writers who want word definitions, contextual alternatives, translation and AI-assisted drafting in one place.

## Links

- [GitHub repository](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers)
- [Releases](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases)
- [Report an issue](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues)

## Credits

Developed by Alan Darfin. Translation workflow ideas were inspired by the [Obsidian Translate](https://github.com/Fevol/obsidian-translate) plugin; implementation is independent.

## 1.1.0 — sidebar chat redesign
The plugin sidebar now has **Definitions**, **Translation**, and **Chat** tabs. The Chat tab replaces the former mobile popup with a conversation view, Markdown-formatted AI messages, a text composer, Send button, and a Clear button. The conversation is held in memory for the current view/session; it is not permanently stored.

Commands and editor context-menu actions for selected text now switch to Chat and automatically submit a request with that selection. The former popup prompt command was removed. Use **Open writing chat** or **Generate text in chat** for freeform requests.

The AI uses recent conversation text for context. Review generated writing before inserting it into a document. This version has been syntax-checked but requires testing on Obsidian Mobile.

## 1.2.0 — configurable writing assistant
The **Assistant** settings tab provides a separate AI provider, optional model override, temperature slider (0–2), toggle to omit the temperature parameter, and an editable system prompt. The `{language}` placeholder uses the configured definition language.

These settings apply to the Chat writing assistant only; dictionary and translation engines retain their independent provider and model selections. Some provider models may reject temperature or have a narrower supported range; disable temperature if a request returns an unsupported-parameter error.

## 1.3.0 — Markdown files

**Translate file:** In the Translation tab, click **Translate file** to pick a Markdown note from the Obsidian vault. The plugin translates the filename and Markdown content, processes longer notes in chunks, and saves a **new** Markdown note in the same folder. If the translated filename already exists, a numbered suffix is added. The original is never overwritten. Translation requests are sent to the configured AI translation provider and may incur usage costs. Formatting is preserved on a best-effort basis; review long documents, YAML frontmatter, internal links and code blocks.

**Attach Markdown to chat:** In the Chat tab, click **Attach Markdown** to select up to three vault notes. Attached files appear as removable chips. The full text of each note is included as context in the next chat request, up to **25,000 characters total**. Attachments are cleared after a successful response. The files are not modified. File contents are sent to the selected assistant AI provider; avoid attaching private notes unless you trust that provider.

Only `.md` files from the Obsidian vault are supported. No PDFs, images or arbitrary local filesystem files.

## 1.4.0 — Non-destructive writing review

The new **Review** sidebar tab offers three modes:

- **Grammar (LanguageTool):** Review a Markdown note with LanguageTool. Each finding is displayed separately with the detected rule, explanation, replacement options, and **Accept**, **Ignore**, and **Why? / Alternatives** actions. Accept changes only that finding, and refuses to apply if the note has changed since the analysis.
- **Style and flow (AI):** Ask the configured AI model for feedback about clarity, rhythm, repetition, voice and dialogue. The feedback is displayed in the sidebar; the note remains unchanged.
- **Beta reader (AI):** Request editorial feedback about narrative pacing, characterization, dialogue, coherence and emotional impact, without replacing the document. Discuss feedback in the Chat tab.

**Review settings** include the LanguageTool language, HTTPS API endpoint, optional API key, and an editable editorial profile. The default public LanguageTool endpoint has request and text limits; longer notes may need a self-hosted or paid endpoint. AI review currently analyzes up to 14,000 characters per request; grammar review accepts up to 18,000 characters. These limits avoid silently claiming to review content that cannot fit in a single request.

**Privacy:** Grammar text is sent to the configured LanguageTool service. AI review text and explanation requests are sent to the selected AI provider. No external Grammarly integration is included.

**Limitations:** This release shows findings in the sidebar rather than adding inline CodeMirror underlines. DeepL Write is not integrated yet. Review on Obsidian Desktop and Mobile before relying on the results for important documents.

## 1.4.1 — CodeMirror review and mobile layout

LanguageTool grammar findings now appear as temporary **CodeMirror 6 wavy underlines** in the open Markdown editor, in addition to review cards in the side panel. The Markdown file is not changed until a specific suggestion is accepted. Ignoring a suggestion removes its underline. Editing the document clears stale marks; rerun review to refresh them.

The grammar checker skips the initial YAML frontmatter block (`---` metadata) while preserving original text offsets for accurate suggestions. The sidebar now scrolls independently and the review actions wrap into accessible rows on narrow Android screens.

Only the **currently open editor** for the selected note can display inline marks. AI style and beta-reader feedback remain non-destructive sidebar reports. Markdown metadata is excluded from LanguageTool checks, not from AI editorial context. Review this release on your device before relying on it for critical editing.

## 1.4.2 — Mobile review layout and Markdown noise reduction

Fixes review cards collapsing into thin rows in Obsidian Mobile: cards now keep their natural height and the review pane scrolls vertically. Context and explanations are expandable per finding, with the replacement selector and actions always accessible. The editor's CodeMirror marks remain non-destructive.

The LanguageTool request now masks YAML frontmatter, fenced code, embedded images, wiki links and Markdown syntax while preserving character offsets. Whitespace-only and selected formatting-only matches are filtered to reduce false positives caused by Markdown indentation, paragraph breaks and formatting. Genuine spacing issues may be filtered as a trade-off. The original note remains unchanged until the user accepts a suggestion.

## 1.5.0 — Reviewer configuration and Obsidian commands

Settings are grouped by workflow: **General**, **Dictionary**, **Translation**, **Chat**, **Review**, **AI Reviewers**, **APIs**, **Models**, and **Prompts**. The settings tabs are horizontally scrollable on mobile and the last selected tab stays open during the current settings session.

**Review**: LanguageTool language, review mode, open the selected note in an editor for CodeMirror highlights, ignore whitespace warnings, comma-separated rule IDs to ignore, HTTPS LanguageTool endpoint and optional API key.

**AI Reviewers**: optional independent AI provider and model (otherwise inherits Chat), character budget (1,000–28,000), editorial profile, and three editable prompts for **style review**, **beta reading**, and **grammar explanations**. Empty prompt fields use built-in defaults. These options do not automatically change the Markdown file.

**New command palette actions**: open definitions, open translation, open writing review, review active note grammar, review active note style, beta read active note, review a chosen vault Markdown file, translate a vault Markdown file, and attach a Markdown file to chat. The ribbon icon tooltip and the primary open command now use **Basic AI Tool for Writers**.

**Privacy:** Review and attachment content is sent to your selected external providers. Keep API keys private. The public LanguageTool API has usage limits.

## 1.5.1 — Review paragraph context and jump to error

LanguageTool suggestion cards now display the **paragraph containing the finding**, rather than an arbitrary 65-character excerpt on either side. Paragraphs are determined by blank lines in the original Markdown. Each card includes a **Go to error** action, which opens or focuses the appropriate Markdown editor, selects the matched text, and scrolls it into view without changing the note. Accept and Ignore remain separate actions.
