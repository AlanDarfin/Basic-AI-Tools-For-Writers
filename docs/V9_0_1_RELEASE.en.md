# Basic AI Tool for Writers 9.0.1

**Stable maintenance release · Obsidian 1.11.4+ · Desktop and Android**

This release refines the writing workspace while preserving ordinary Markdown files and the existing plugin ID.

## Interface improvements

- **Homepage search:** full-width field at the very top, above the heading, shortcuts and calendar. Results show note names and full vault paths to distinguish duplicates, Lucide icons, favorites and a clear selected-row state. Navigate with **Up/Down**, open with **Enter**, and clear with **Escape**.
- **Fictional chat:** consecutive messages from the same speaker avoid repeated names/avatars. Names and times are displayed only when explicitly included in a message block. Previous syntax remains supported.
- **Homepage accents:** independent HEX colors for heading and icon, each using the current theme accent by default; quick actions and draft tabs make better use of available width.
- **Settings:** compact search, consolidated Writing + Markdown category, and Lucide icons in settings, tools and Longform navigation.
- **Explorer:** searchable Lucide picker and custom HEX color picker. Customization stays in plugin settings, not the Markdown files.

## Spaces

- Dynamic folder/tag/property collections, manually curated note collections, pinned folders and an optional sidebar independent of the native Explorer.
- Simplified cards, list, table and board views. Make.md relational databases, formulas, rollups and Flow Editor are **not** included.

## Optional visual password gate

A password can limit visibility of selected notes or folders through the Basic UI. **It does not encrypt files and cannot stop another plugin, backups or the operating system from accessing their content.** This is not a substitute for device encryption.

## Install

Download `main.js`, `manifest.json` and `styles.css` from the 9.0.1 release and place them in `.obsidian/plugins/basic-ai-tool-for-writers/`. Back up your vault and the plugin's `data.json` first.

Automated validation covers source/bundle sync, regression tests, CSS lint, syntax and release packaging. Manual checks in third-party themes and on Android are still recommended.
