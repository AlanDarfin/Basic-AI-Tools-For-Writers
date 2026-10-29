# Alan's Offline Dictionary

An offline-first personal dictionary for [Obsidian](https://obsidian.md), with optional online lookup and local import.

## Features

- Search a Markdown dictionary from the Obsidian sidebar.
- Case-insensitive and optionally accent-insensitive search.
- Cached local index, refreshed when the dictionary file changes.
- Flexible Markdown entries using level-one headings.
- Optional online lookup using [Free Dictionary API](https://dictionaryapi.dev/).
- Explicitly save online definitions to your own local Markdown file.
- Command to search selected text in the editor.
- No network request when online fallback is disabled.

## Dictionary format

Set the dictionary file path in plugin settings (default: `Dicionario.md`).

```markdown
# Melancholy

A thoughtful or lingering sadness.

## Synonyms
- wistfulness
- sorrow

---

# Serendipity

Finding something good unexpectedly.
```

Each level-one heading starts a new entry. Separators are optional. Lower-level headings remain inside an entry.

## Online lookup

When a word is missing locally, choose between offline-only, ask-before-searching (default), and automatic online search.

The plugin queries Free Dictionary API only when online lookup is requested or automatic fallback is enabled. The selected language can be changed in settings. Coverage varies by language; not all words or languages are supported.

Online results are **not** saved automatically. Click **Save to local dictionary** to append the definitions to your Markdown file. Existing entries are not overwritten. Check the source's terms and attribution requirements before redistributing imported content.

The **Open source website** action opens the provider's website in your browser. An embedded Obsidian Web Viewer is not implemented yet.

## Installation

This repository currently includes the distributable `main.js` and `manifest.json`. To test manually, place them in `.obsidian/plugins/alans-offline-dictionary/`, enable community plugins, and enable Alan's Offline Dictionary.

**Development status:** 2.0.0-beta.2 experimental prerelease. Test on a backup vault before relying on imported content. A full TypeScript source tree, automated test suite, and release build pipeline are planned.

## Beta 2 additions

- Search provider button remains visible even when a local match exists.
- Language selector and Save button share a compact toolbar.
- Choose Free Dictionary API, Wiktionary, or locally imported Yomitan dictionaries.
- Import Yomitan ZIP files through settings and enable/disable imported dictionaries.
- Yomitan support currently focuses on text-based term banks; audio, media, advanced structured content, and some ZIP compression features may not be supported.
- Import limits are in place. Large dictionaries are stored in plugin settings and may be slow on mobile. Back up your vault before testing.
- This beta has not yet been verified on Obsidian Mobile or Desktop.

## Roadmap

- [x] Offline index and flexible parser
- [x] Online lookup and explicit local import
- [x] Selected-text search
- [x] Initial parser/search tests and CI
- [ ] Modular TypeScript source and reproducible build
- [ ] Multiple dictionary files
- [ ] Search suggestions and fuzzy matching
- [ ] Search history
- [ ] Dedicated integrated Web Viewer (word-specific Wiktionary link currently opens through Obsidian/browser handling)
- [ ] Improved mobile UX

## Credits

Created by Alan with help from ChatGPT.

## Translation (development preview)

The dictionary sidebar now offers **Translate word** and **Translate definitions** actions. The original dictionary entry is preserved; translations appear separately and can be copied.

Supported translation API integrations: DeepL, Google Cloud Translation, Microsoft Azure Translator, and LibreTranslate. Configure the provider, source/target language codes, and your own API credentials under plugin settings. LibreTranslate supports a custom HTTPS server; DeepL supports an endpoint override. Azure subscriptions may require a region-specific endpoint. API provider costs and language support vary.

This feature draws UX inspiration from [Obsidian Translate](https://github.com/Fevol/obsidian-translate) but uses independent implementation. It is an untested development preview, not a published release. API keys are stored in Obsidian plugin settings without encryption; avoid syncing these settings to untrusted devices. Text is sent to the selected provider only when translation is requested.

## Writer tools and FastText detection bridge (development)

The sidebar adds **Detect language**, **Compare meaning**, and **Contextual synonyms**. Compare meaning displays the original definition and translated version side-by-side in sequence without overwriting the source. Contextual synonyms use the currently selected and configured AI dictionary provider and can include an optional sentence to clarify nuance and register.

Language detection can use the public API of the separately installed [Obsidian Translate](https://github.com/Fevol/obsidian-translate) plugin. If Translate is configured to use FastText, this feature benefits from its FastText language detector; **this plugin does not bundle or independently run FastText**. Alternatively, select manual source language in settings. Detecting very short words can be unreliable.

These features are experimental and have not yet been validated on desktop and mobile. The AI writer request sends the word and optional context to the selected AI provider, potentially incurring API costs.
