# Changelog — Basic

The README files describe current features and usage examples only. Release history belongs here and in GitHub Releases.

## 10.10.1 — Android sidebar and Spaces dock repair

- Sidebar tabs now mount in the native mobile selector rather than creating another toolbar below it.
- Fixed mobile tab activation by using the drawer's native selectTabIndex and active state.
- Unified overflow and view actions under one menu with Spaces and vault access when available.
- Existing Spaces dock moves to the mobile drawer footer, outside File Explorer, and is no longer duplicated in two places.
- Reversible mobile controls, safe fallback when Obsidian internals differ, and regression tests for native tab switching and unload cleanup.

## 10.10.0 — Sidebars and editor width

- Sidebar Manager-inspired optional sidebar icon tabs, overflow, contextual action menu, local File Explorer filter and shared ordering settings for desktop/mobile, without moving native workspace leaves.
- Editor Width Slider-inspired desktop status control with default reset, settings controls and per-note YAML `editor-width` reading on desktop/mobile.
- Activation guarded in the existing optional module boundary, with cleanup on unload.
- No additional ribbon buttons or network calls. Features documented in README; change history stays here.

## 10.9.0 — Books, commands and interface

- Library: add standalone Markdown notes as books with fuzzy search; metadata from `banner`, `description` and `copyright`, with fallback cover properties.
- Reading progress: calculated automatically from Longform scene completion; optional `readingProgress` frontmatter for standalone notes. Removed the manual percentage field.
- Library: remove standalone books without deleting their Markdown notes.
- Command palette: remove redundant quick-actions and duplicate library-search/sorting commands.
- Explorer: reveal hidden files directly from the native sort menu.
- Settings: fuzzy vault pickers for Space folders/included files, mention folders and virtual-content template notes.
- Branding: plugin display name shortened to **Basic**.
- README EN/PT: removed version-by-version changelog and retained feature documentation and examples.
- UI: responsive book descriptions and copyright, slimmer scrollbars and edge fade in supported horizontal controls.

## 10.8.0 — Library and homepage fixes

- Rebuilt Longform library cards, fixed missing Books homepage widget, and matched filled favorite stars with the explorer.
- Related Notes remains a dedicated panel; Trash is a homepage-only widget.
- Restored advanced 10.7 integrations with guarded startup.

See the GitHub Releases page for earlier releases and detailed release assets.
