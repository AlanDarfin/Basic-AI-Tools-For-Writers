# Basic AI Tool for Writers

## Writing Suite 3.1.0-beta.2 — Uniform menus and selectors

This update fixes vertically clipped dropdown text in narrow Obsidian panels, including the LanguageTool review mode, translation language selectors, project selectors and plugin settings. A shared control style uses a consistent 42px height, zero vertical padding on native selectors, coherent typography, sufficient space for dropdown indicators and keyboard-visible focus. Settings rows also respond to the width of the panel rather than only the whole screen.

Automated regression tests cover control styling across the plugin. This is a beta pending visual checks with installed Obsidian desktop/mobile themes.

## Writing Suite 3.1.0-beta.1 — Unicode UI, tabs and online TTS

This preview improves the Unicode picker with readable character cards, category filters, relevance ranking and inline favorites. The main sidebar, writing tools, Longform and Settings now use horizontally scrollable tab rows instead of clipping or wrapping tabs. The writing-tools Extras panel separates Unicode, speech and project shortcuts.

**Text-to-speech:** choose **System / offline** or opt in to **Microsoft Edge neural / online** speech, which works without an installed Linux speech engine. Online synthesis sends the selected text or note to Microsoft only after enabling **Allow online text processing**; it needs internet access and uses an undocumented, potentially unreliable service. Pause, resume and stop are supported for both engines. See [Writing Suite](docs/WRITING_SUITE.md).

This is a beta because remote speech compatibility needs practical testing in Obsidian Desktop and Mobile.

## Writing Suite — 3.0.0

The stable [Writing Suite](docs/WRITING_SUITE.md) brings abbreviations, another-name subtitles, per-note view modes, a Longform **Tasks** tab, instant tables of contents, offline Unicode search, rule-based templates by note name (prefix, contains, suffix and optional rename handling) and multilingual system text-to-speech to Basic AI Tool for Writers. These are configurable modules with commands and writing-sidebar controls. No AI provider is used for speech synthesis.


## V3 — autocomplete, variantes e versões

A versão estável **3.0.0** integra três módulos ao Obsidian:

- **Sugestões:** autocomplete local do arquivo, cofre, dicionários e links;
- **Variantes:** alternativas inline de escrita, revisão → variante e geração com IA;
- **Versões:** snapshots locais nomeados, diferenças, restauração segura e anexos opcionais.

Os módulos têm **configurações próprias, comandos na paleta e uma nova barra lateral**. A atualização preserva as configurações antigas e gera backup de `data.json` antes de migrar.
**Correções de revisão:** o LanguageTool ignora delimitadores Markdown como `_itálico_` sem perder a posição dos erros; o cartão de revisão foi adaptado à tela e ao teclado do Android; controles de cenas agora ficam em linha, com setas e menu contextual `⋯`. Testes de regressão foram adicionados.

Para instruções, limitações e segurança, consulte [Guia da v3](docs/V3.md). A suíte automatizada foi executada, mas diferenças de tema e de interface entre Obsidian Desktop e Android ainda exigem validação no aplicativo.


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

## 1.6.0 — Floating grammar review card and plain Markdown context

LanguageTool findings still appear in the Review sidebar, but tapping or clicking a highlighted finding in an open CodeMirror editor can now show a **floating suggestion card** near the cursor. It provides the same replacement, Accept, Ignore, explanation and navigation actions as the sidebar. The card is scrollable and has a close button. Disable it under **Settings → Review → Show floating suggestion near error**.

Paragraph context is displayed as plain text rather than rendered Markdown, stripping common emphasis, links, images and heading/list syntax. Source Markdown is not changed by these display-only transformations. The popup is available for grammar findings, not AI editorial reports. Mobile popup placement and touch behavior still require device testing.

## 1.7.0 — Writing Projects (initial preview)

New command-palette entries: **Abrir projetos de escrita** and **Abrir notas do projeto**. A dedicated project sidebar recognizes existing Longform index notes via the `longform` YAML frontmatter and displays **Cenas**, **Projeto**, **Compilar**, and **Notas** tabs.

- **Cenas:** read-only listing of scene hierarchy found in Longform frontmatter; tap a scene to open it.
- **Projeto:** title, index location, scene count and shortcut to the original index.
- **Compilar:** basic, non-destructive Markdown export concatenating resolvable scenes in index order. It does not implement Longform custom workflows yet.
- **Notas:** project-local `_Notas/` directory with named subfolders and Markdown notes. Notes are not included in the compiled manuscript.
- **Compatibility:** this preview reads existing Longform project metadata; it does not rewrite the index or migrate drafts. Keep Longform installed until full feature parity is validated.

**Known limitations:** This is a foundation, **not** a complete fork. Drag-to-reorder, creating scenes and drafts, custom compilation workflows, goal tracking, and full Longform project-import edge cases are still to be implemented and tested. The standalone `projects.js` file is source/reference; the code is inlined in `main.js` for Obsidian Mobile.

## 1.8.0 — Project editing

The **Projetos de escrita** panel now supports creating Markdown scenes, adding nested subchapters, moving scenes up/down in their lists, and removing scenes from the index without deleting files. The **Projeto** tab can edit project title and scene folder and save a word-count goal. **Rascunhos** are alternate scene-order structures stored in the Basic AI plugin settings, leaving the original Longform index intact. **Compilar** offers YAML stripping, wikilink conversion, separators, and named workflow presets, exporting to a new Markdown note. **Notas** continues to support nested folders and Markdown notes.

**Compatibility and limitations:** Longform index metadata is recognized and the primary scene tree can be edited through Obsidian's frontmatter processor. The imported Longform project is not automatically migrated; there is no full bidirectional synchronization of Longform-specific drafts, custom workflow steps, template expansion, drag-and-drop or every Longform metadata variant. Always back up your vault before editing existing Longform projects. No device-level Obsidian Mobile integration tests have been performed.

## 2.0.0 — Writing project workspace

The plugin now includes a dedicated project sidebar with **Cenas, Projeto, Compilar, Notas**. Open it from the ribbon or the command palette. Existing Longform projects with 'longform' YAML frontmatter are discovered automatically, including multi-scene and single-scene projects.

**Cenas:** Correctly parses and writes native Longform nested scene arrays, not unsupported scene objects. Create scenes, nested subchapters, rename, remove from the index without deleting Markdown, reorder with desktop drag-and-drop or mobile-friendly ↑ ↓ ← → controls, and create scenes using a configured scene template. Alternate local scene orders are supported, as are linked Longform drafts (new draft creates a separate index and copies scene files).

**Projeto:** Edit project title and scene folder; project word counts and goals, daily goal and a saved-file-based writing-session counter. Diagnostics list missing and unindexed scenes; adopting unindexed scenes requires confirmation.

**Compilar:** Built-in steps: strip-frontmatter, remove-links, remove-comments, remove-strikethroughs, prepend-title (including hierarchical numbering), concatenate-text, add-frontmatter, and write-to-note. Reorder/add/remove/configure steps, save named presets, import workflows from the installed Longform plugin or pasted data.json. **Prévia** does not write files. Compiling refuses unsafe output paths and never overwrites the index, original scenes or an existing manuscript; it creates a uniquely named output. Imported third-party JavaScript workflow steps remain visible as metadata, but are **not executed**.

**Notas:** A separate _Notas directory per project, nested named folders, quick notes, search, rename, move between note folders, send to Obsidian Trash with confirmation, and review a note using the existing Basic AI tools. Notes are not compiled.

**Safety and migration:** Back up your vault before updating. An index backup is created on first edit per session under _Backups as a .txt snapshot (to avoid registering a duplicate Longform project). Existing 1.8.x compilation presets are migrated to the step-based configuration on use. Do not edit the same index simultaneously with both Longform and Basic AI until compatibility has been confirmed.

**Limitations:** This is not a promise of 100% Longform parity. User-script execution, some advanced third-party workflow steps and edge-case templates are not supported. Writing sessions use saved-file deltas rather than tracking every keystroke; Some advanced Longform workflows and Android runtime edge cases still require validation.

**Commands:** Abrir projetos de escrita; Criar projeto de escrita; Criar cena no projeto; Abrir notas do projeto; Criar nota rápida do projeto; Abrir compilação do projeto; Iniciar sessão de escrita; Encerrar sessão de escrita.

**Maintenance:** The project manager source is projects.js. It is inlined into main.js for normal Obsidian installation using the command: node scripts/sync-projects.js. Run node scripts/sync-projects.js --check and node tests/projects.test.js before releasing.

Inspired by the open-source [Longform project](https://github.com/kevboh/longform), using a separately implemented, compatible data model.

**Beta 3 (PC e Android):** o revisor usa menus nativos do Obsidian para mostrar explicações, substituições, variantes e ações de ignorar regras, seguindo a experiência do LanguageTool. Os resultados no painel são compactos e têm botões para as duas primeiras sugestões; abas e rolagem foram corrigidas para painéis estreitos no desktop. Os sublinhados distinguem ortografia, gramática e estilo. A implementação foi inspirada no LanguageTool v1.5.2 fornecido para comparação, sem incorporar o código distribuído dele.

