# Changelog — Basic

The README files describe current features and usage examples only. Release history belongs here and in GitHub Releases.

## 12.0.2 — Scoped Spaces and per-device toolbar

- Added local per-Space hiding and folder-root rendering in the native Explorer.
- Updated filtered Space collections to respect hidden folder descendants and folder renames.
- Preserved desktop Dragger handles while moving the pointer from content to grip.
- Limited floating toolbar to real selections and split desktop/mobile profiles.
- Folded suite/toolkit settings into the original tabs.
- Reviewed open issues and pull requests; added regression tests.

## 11.1.1 — Mobile sidebar and integrated Longform writing

- Moved continuous writing into the standard Longform project tabs, preserving scene order, source files, guarded saves, snapshots, editorial comments and manuscript compilation.
- Removed the redundant Longform Studio homepage widget and updated the bookshelf shortcut to use the same Longform workspace.
- Delayed all nested native mobile sidebar actions until their parent menu closes to prevent instant open-close behavior, retaining the original action targets.
- Added long-press actions on mobile sidebar icons: pin/unpin, close and close other unpinned panels. Pinned views stay first and are excluded from bulk close. A normal tap still switches views; scrolling cancels long-press.
- Improved generic panel naming in the sidebar (Longform, Homepage), added optional long-press toggle, mobile styling and regression tests. See docs/V11_1_1_MOBILE_LONGFORM.pt-BR.md.

## 11.1.0 — Number Suite and Notion view-builder expansion

- Added opt-in visual heading numbering for Live Preview using CodeMirror line decorations (non-destructive).
- Added independent CSS counters for Figure, Table, Equation and Code captions in Reading View, plus a navigable outline of headings, captions, footnotes and endnotes.
- Added a guided visual builder for existing Markdown database blocks, including views, columns, sorting, grouping, pagination limit and simple filters, with safe editor insertion and no implicit note or folder creation.
- Preserved existing database engine and supported Obsidian 1.11.4+, with module isolation, CSS, PT/EN docs and regression tests.
- Full Number Suite cross-reference/batch numbering, relational Notion databases, cloud sync and other integrations remain incomplete; see docs/V11_1_INTEGRATIONS_SCOPE.pt-BR.md.

## 11.0.0 — Longform Studio foundation and database workflow

- New source-preserving sequential chapter editor with guarded writes, snapshot integration and explicit save actions.
- Editorial review compares local snapshot lines and stores local per-note comments.
- Search note contents, names and frontmatter within book, Space or bounded vault scans; open matched source notes.
- Safe Markdown manuscript assembly with preview and non-overwriting new export files.
- Local compatibility diagnostics, bookshelf Studio shortcut and optional homepage widget.
- Extend Notion-style board with drag-and-drop and accessible selectors to update existing status groups with conflict protection.
- Add typed Markdown property editor with validation and user-confirmed changes.
- Add desktop/mobile responsive styling, PT/EN documentation and regression coverage.
- Scope limitation: these features are built as original modules; not all upstream capabilities have been ported. See docs/V11_SCOPE.pt-BR.md.

## 10.11.0 — Academic, database and numbering integrations

- Added an academic center based on the Unique Suite workflow, with user-triggered class capture, daily notes, local dated reminders and a Markdown timetable renderer. The existing Basic calendar and ICS feed modules are reused.
- Added Notion-inspired Markdown database views: list, gallery, calendar, timeline and chart, alongside table and board. Reuses Basic's formulas and relation rollups. New block `basic-suite-db` avoids conflict with the original plugin.
- Added conservative Number-inspired H1–H6 virtual numbering in Reading View, a navigable outline, recognized prefix removal and preview/confirmation before writing headings. Single-note changes use snapshots when available and exact file staleness checks.
- Independent module settings, guarded startup, responsive CSS and slash-menu starters. No additional ribbon icons, external network requests or automatic vault migrations.
- Added regression tests and a [Portuguese scope report](docs/V10_11_SUITES_SCOPE.pt-BR.md). These integrations are subsets, **not full compatibility with every function in the three original plugins**.
- README files remain dedicated to current capabilities and examples; this file is the only version history.

## 10.10.4 — Persistent collapsible mobile Spaces

- Move the Spaces selector out of the Explorer's temporary drawer contents and anchor it directly to the native mobile tab bar.
- Always show a compact, collapsible selector just above the sidebar tabs, displaying the currently selected Space.
- Expand to show Entire vault, saved Spaces, per-Space actions and Create/Manage controls; collapse automatically after selection.
- Restore the selector after native Android drawer header replacement, and keep it in place when switching sidebar tabs.
- Keep desktop behavior unchanged and disable Space-chip desktop drag gestures on mobile.
- Add regression coverage for tab switches, collapsible state, selected Space, header recreation and unload cleanup. No notes or saved Space configurations are modified.

## 10.10.3 — Sidebar and native menu stability

- Keep the Android tab button DOM stable across layout changes, preserving its active indicator and menu anchors.
- Observe mobile drawer DOM changes and remount the tab row if Obsidian replaces its header.
- Restore original Lucide icons or localized fallbacks for native Explorer actions in the Sidebar Manager menu.
- Open the native sort popup after the parent menu closes, and retain its hidden trigger as a laid-out anchor so it does not immediately dismiss.
- Add regression coverage for tab restoration, unchanged toolbar controls, native action icons and delayed sorting.

## 10.10.2 — Dragger desktop-only

- Disable the block Dragger completely on mobile. No drag handle, indicator, pointer or touch listeners, or Dragger-specific commands are registered on Android.
- Preserve the desktop Dragger with its existing settings. Remove the mobile long-press toggle and obsolete mobile handle styling.
- Add mobile activation regression coverage. Other editing features and all user settings are preserved.

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
