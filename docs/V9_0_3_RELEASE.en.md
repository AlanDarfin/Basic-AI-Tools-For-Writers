# Basic AI Tool for Writers 9.0.3

**Customizable homepage and view restoration · Obsidian 1.11.4+ · Desktop and Android**

## Homepage widgets

The homepage retains the heading, keyboard-enabled search, and shortcuts above a customizable widget dashboard. Select **Add widgets** to open the widget gallery. Every visible widget offers move and remove controls. Removing a widget hides it without deleting vault files or drafts. Preferences are saved in the plugin's settings.

Existing widgets (**Continue writing**, **Clock and calendar**, **Recent notes**, **Favorites**, **Quick drafts**, and **Vault summary**) stay enabled after updating. New widgets are opt-in and initially hidden:

- **Weekly activity:** number of Markdown notes modified on each of the last seven days.
- **Surprise note:** a random local note with open/shuffle buttons.
- **Popular tags:** up to ten frequent tags from indexed notes.
- **Word target:** progress toward a configurable word count for the last opened Markdown note (default 500). This measures the note length, not words typed today.

The calendar can now be hidden and reordered like the other widgets. Search and quick actions always remain available.

## Icon alignment

Lucide icons in Longform, tool and settings tabs now have consistent vertical alignment, spacing and sizes. Widget controls also use standard Lucide icons with compact mobile layouts.

## Hot-reload view restoration

Previously, only three sidebar pane types were snapshotted. The plugin now also attempts to restore **homepage, calendar, study, Spaces** and Basic editor-area tabs. Snapshots are consumed once and expire after two minutes; deliberately closed panes are not reopened. Existing Markdown or other plugins' panes are not overwritten. Exact tab group positions and platform-specific behavior still require visual testing.

## Update

Back up your vault and `.obsidian/plugins/basic-ai-tool-for-writers/data.json`. Replace `main.js`, `manifest.json` and `styles.css` with the 9.0.3 release files, then reload the plugin. No manual note migration is required.
