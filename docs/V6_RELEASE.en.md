# Basic AI Tool for Writers 6.0.0 — Stable Release

## Unified writing workspace

Version 6 introduces a **consistent, flat and compact interface** across plugin settings, dictionary, translation, chat, writing tools, Longform projects, review, markdown options, modals and mobile forms. Tab bars scroll horizontally; controls remain legible at narrow widths. Existing modules and data are preserved.

### Longform navigation rebuilt

Chapter navigation no longer forces cramped two-column cards on mobile. Each direction is a full-width, accessible row with a readable category and **uncropped chapter/subchapter title**. On wide containers, a two-column layout is available without relying on the device viewport size.

- Native **Jump to chapter** command to search the active project's order.
- Optional automatic footer for each chapter in Reading View or Live Preview, without editing the underlying Markdown.
- An explicit `longform-nav` block suppresses duplicate automatic navigation.
- **Manual navigation**, compatible with notes outside any Longform project, resolves native Obsidian links:
```longform-nav
mode: manual
previous: "[[Notes/Previous]]"
next: "[[Notes/Next]]"
```
Leave either field empty to omit that direction. Missing links are not opened.

### More Markdown and writing tools

- Ruby above: `{base|reading}`. Ruby below: `{base|reading|under}`. Rendered in Reading View and Live Preview, with source editable on selection.
- Interactive ratings, Discord-style timestamps, spoilers and subtext; time-to-read estimates; a preview-first linter.
- Native Obsidian commands and context menu for smart insertion. No duplicate editing toolbar.
- Per-project navigation controls, optional module overrides, editorial review notes and selected writing profile.

### Performance and compatibility

The project retains its existing local-first operations, protects Markdown from destructive updates where supported, and preserves the native editor. UI layout is scoped to the plugin and uses Obsidian theme variables. Automated source/bundle consistency, module regressions, style checks and a special Longform Nav rendering test gate this release.

**Limitations:** Automated tests cannot reproduce every Android WebView/theme combination. On-device validation is still encouraged, particularly in custom themes and heavily nested books.

## Installation

Download `main.js`, `manifest.json`, and `styles.css` from the release, or the ZIP containing all three. Place them in `.obsidian/plugins/basic-ai-tool-for-writers/` and reload the plugin. Back up your vault before upgrading from an older prerelease.

**Release tag:** `6.0.0` (without a `v` prefix). **Minimum Obsidian:** 1.11.4. **Desktop and mobile supported.**

Português: [Notas de lançamento em português](V6_RELEASE.pt-BR.md).
