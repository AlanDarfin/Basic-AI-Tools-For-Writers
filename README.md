# Basic AI Tool for Writers

A bilingual, AI-powered writing companion for [Obsidian](https://obsidian.md), available on desktop and mobile.

> Formerly **Alan's Offline Dictionary**. The plugin ID remains `alans-offline-dictionary` so existing installations and settings are preserved.

## Features

- **Definitions**, **synonyms**, and **antonyms**, with context-sensitive suggestions and Markdown-rendered results.
- **Translation** with independent AI provider, source language (or automatic detection), and target language.
- **Writing assistant** with custom prompts, selected-text context, copy and optional insert into the editor.
- Editor context menu actions for translating, defining, rewriting and finding alternatives.
- **Editable prompts** for definitions, synonyms, antonyms, translation and writing.
- Automatic storage of new definitions in an existing local Markdown dictionary, without displaying duplicate results.
- **Portuguese UI** when Obsidian uses Portuguese, **English** otherwise.
- Settings tabs: **General**, **Providers**, **Models**, **Prompts**.
- Model catalog and API connection checks.

## Supported AI providers

OpenAI, Gemini, Grok (xAI), Claude (Anthropic), Groq Cloud, OpenRouter, Ollama, and custom OpenAI-compatible HTTPS endpoints.

Use separate providers for dictionary queries and translation. Providers require your own credentials, except a typical local Ollama installation. API requests may incur provider charges. Ollama on mobile must use a trusted server reachable from your phone; localhost on a phone is not your computer.

## Installation

Download `main.js`, `manifest.json` and `styles.css` from the latest GitHub Release and place them in:

```text
<Vault>/.obsidian/plugins/alans-offline-dictionary/
```

Reload Obsidian and enable **Basic AI Tool for Writers** in Community Plugins. **Do not change the plugin folder ID** when upgrading.

## Configuration

Open plugin settings to choose the definition and translation engines, set your model IDs and API keys, and customize prompts. In the sidebar, the translation area has its own provider selector and language pair. Leaving the source language on automatic allows the AI to infer it when you click Translate.

The plugin stores API keys in its Obsidian data file **without additional encryption**. Do not publish or sync your configuration to untrusted devices. Text submitted to a provider is sent to that provider for processing.

## Local dictionary

By default, the optional local dictionary is `Dicionario.md`. New definitions are saved automatically when that file exists. Existing entries are not overwritten.

## Version

**1.0.0 — first stable release.** Built for writers who want word definitions, contextual alternatives, translation and AI-assisted drafting in one place.

## Links

- [GitHub repository](https://github.com/AlanDarfin/Alan-s-Offline-Dictionary)
- [Releases](https://github.com/AlanDarfin/Alan-s-Offline-Dictionary/releases)
- [Report an issue](https://github.com/AlanDarfin/Alan-s-Offline-Dictionary/issues)

## Credits

Developed by Alan Darfin. Translation workflow ideas were inspired by the [Obsidian Translate](https://github.com/Fevol/obsidian-translate) plugin; implementation is independent.

## 1.1.0 — sidebar chat redesign
The plugin sidebar now has **Definitions**, **Translation**, and **Chat** tabs. The Chat tab replaces the former mobile popup with a conversation view, Markdown-formatted AI messages, a text composer, Send button, and a Clear button. The conversation is held in memory for the current view/session; it is not permanently stored.

Commands and editor context-menu actions for selected text now switch to Chat and automatically submit a request with that selection. The former **Custom AI prompt** command was removed. Use **Open writing chat** or **Generate text in chat** for freeform requests.

The AI uses recent conversation text for context. Review generated writing before inserting it into a document. This version has been syntax-checked but requires testing on Obsidian Mobile.
