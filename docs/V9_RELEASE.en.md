# Basic AI Tool for Writers 9.0.0

**Final feature release · Obsidian 1.11.4+ · Desktop and Android**

The v9 combines writing, Longform, local organization, grammar review, assistant tools and Markdown authoring. The user's vault remains the source of truth. v9 is the last planned major feature expansion; routine maintenance and smaller integrations follow.

## New features
- Calendar Studio: compact month, day, three-day, week and 30-day agenda; inside-view sidebar, mini-calendar, categories and upcoming events; event notes and repeating series with intervals, end dates and single-instance exceptions. **No Google/CalDAV sync**.
- 27 cMenu-inspired Markdown formatting actions with visual per-button toggles/reordering and top/bottom placement; enabled on desktop and disabled on mobile by default.
- Make.md-inspired improvements inside Obsidian's native Explorer: Lucide icons/colors, folder views, Markdown index notes. Optional local Smart Spaces for filterable virtual list/cards/table/board collections. **Not a full Make.md database or Flow editor**.
- Writing homepage: configurable heading, vault/HTTPS image or Lucide icon, compact clock above calendar, persistent fuzzy search and quick writing actions.
- Obsidian-native styling and new **Customization** settings group for Homepage, Toolbar, Explorer, Spaces and Calendar.
- More efficient Explorer observer scoped to the File Explorer only; language support in English and Brazilian Portuguese.

## Continuity from 1.0.0
The original Alan's Offline Dictionary format (`# word` Markdown entries separated by `---`) is still understood by the dictionary parser. Original v1 plugin id: `alans-offline-dictionary`; current id: `basic-ai-tool-for-writers`. Because IDs differ, **old plugin data/settings do not migrate automatically**. Preserve vault files and back up the original plugin's data before uninstalling. See `docs/V9_FINAL_AUDIT.md`.

## Compatibility and limitations
This release contains original Basic implementations inspired by various community plugins; no claim of full upstream fork compatibility. See `THIRD_PARTY_NOTICES.md`.
The CI checks JavaScript syntax, bundle reproducibility, source tests, CSS community compatibility and metadata. In-app testing on desktop and Android is still recommended, including other installed plugins and themes. Turn off an optional module under Settings → Modules if it conflicts with an existing upstream plugin.

## Installation
From the release assets install `main.js`, `manifest.json`, and `styles.css` under `.obsidian/plugins/basic-ai-tool-for-writers/`, then enable/update the plugin. Back up the vault and plugin data first. The project and your notes remain ordinary Markdown files.

## Notes
This release does not delete previous project data or require removal of other community plugins. No account credentials are migrated automatically. Remote AI/LanguageTool/TTS connections follow their separate user settings and permissions.
