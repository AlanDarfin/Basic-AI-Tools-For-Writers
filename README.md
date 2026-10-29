# Alan's Offline Dictionary — Beta 3 development preview

AI-powered word checker for Obsidian, combining a local Markdown dictionary, AI definitions, translation and contextual synonym suggestions.

## Features
- AI-only online lookup: OpenAI, Gemini, xAI Grok, Anthropic Claude and a custom OpenAI-compatible HTTPS endpoint.
- Independently selectable AI providers for **definitions** and **translations**.
- Define a word, translate a word or meaning, compare original and translated meanings, and request contextual alternatives.
- Save definitions to an existing Markdown dictionary file. Entries already saved are not overwritten.
- Interface follows the Obsidian application language: **Portuguese** for Portuguese locales, **English** for all others.
- Theme-aware, responsive layout designed for desktop and mobile.

## Configuration
In Obsidian, open **Settings → Community plugins → Alan's Offline Dictionary**. Select the dictionary AI provider and translation AI provider; configure the model and API key for each service. For a custom provider, enter the full HTTPS chat-completions endpoint and model ID. Set the desired definition and translation languages independently.

API credentials are stored in the plugin's Obsidian data file without additional encryption. Do not share or sync this file to untrusted devices. Requests send the selected text and, for writing suggestions, the supplied context to the configured AI service. API costs may apply.

## Local Markdown dictionary
The default dictionary is `Dicionario.md`. Entries are grouped under level-one Markdown headings:

```md
# Serendipity

Finding something valuable by chance.
```

## Install manually
Copy `main.js`, `manifest.json` and `styles.css` into `.obsidian/plugins/alans-offline-dictionary/`, then reload the plugin.

## Status and limitations
**Beta 3 development preview; not a published release.** Syntax was checked, but real API responses and Obsidian Desktop/Mobile compatibility have not been fully tested. Back up your vault before trying it. Legacy Yomitan ZIP import and traditional online dictionary providers have been removed from the active UI. The plugin's saved Markdown dictionary remains supported. Language detection still uses the optional Translate plugin integration when available.
