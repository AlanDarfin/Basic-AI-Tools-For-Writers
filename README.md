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

**Development status:** Experimental. Test on a backup vault before relying on imported content. A full TypeScript source tree, automated test suite, and release build pipeline are planned.

## Roadmap

- [x] Offline index and flexible parser
- [x] Online lookup and explicit local import
- [x] Selected-text search
- [ ] Automated parser/search tests and CI
- [ ] Modular TypeScript source and reproducible build
- [ ] Multiple dictionary files
- [ ] Search suggestions and fuzzy matching
- [ ] Search history
- [ ] Integrated Web Viewer, where supported
- [ ] Improved mobile UX

## Credits

Created by Alan with help from ChatGPT.
