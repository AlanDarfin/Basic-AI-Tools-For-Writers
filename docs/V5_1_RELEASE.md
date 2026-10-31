# Basic AI Tool for Writers 5.1.0

**Stable quality-of-life release** · Obsidian **1.11.4+** · desktop and mobile · release tag **5.1.0** (no \`v\` prefix).

## What's new

- **Searchable settings:** search option names in the current category and jump to matching categories from a bilingual, accent-insensitive suggestion list. Keyboard users can press Enter for the first category match or Escape to clear.
- **Quick writing profiles:** Novel, Study, Revision and Technical Markdown presets switch a safe subset of editing settings. Up to **10 custom profiles** can save only selected editor preferences, with one-step Undo. Notes, dictionary entries, AI keys, API configuration, prompts and snapshots are left unchanged.
- **Shortcut diagnostics:** view active Keyshots and contextual Easy Typing bindings, duplicate key combinations, and (when exposed by the Obsidian host) overlapping command hotkeys. Provides a one-click way to disable automatic Keyshots presets. The report **cannot** guarantee that unrelated plugins' private CodeMirror shortcuts were inspected.
- **Compact responsive settings:** improved spacing for narrow desktop windows (including 720p displays), searchable settings, wrapping controls and reduced-motion support.
- **Regression coverage:** new tests check settings migrations, search matching, profile undo/whitelisting, sensitive data exclusion, shortcut checks and responsive CSS hooks.

## Compatibility and upgrading

1. Download **Basic-AI-Tool-for-Writers-5.1.0.zip**.
2. Extract \`main.js\`, \`manifest.json\` and \`styles.css\` to \`.obsidian/plugins/basic-ai-tool-for-writers/\`, replacing the previous three files.
3. Keep your existing \`data.json\` and back up the vault before updating.
4. Enable/reload the plugin and open **Settings → Basic AI Tool for Writers**; search appears above the category tabs, and **Quick profiles** offers presets.
5. Open **Diagnostics** to inspect keyboard shortcuts.

All existing v5 modules remain available, including Keyshots, Extended/Pandoc syntax, Easy Typing, Smart Typography, LanguageTool and Longform writing projects. **The old Editing Toolbar is not restored.**

## Verification and limitations

- CI validates the standalone plugin bundle, source syntax, regressions, Obsidian CSS lint, manifest and ZIP checksums before release.
- No installed-Obsidian desktop/Android end-to-end test is implied by passing Node tests. Different keyboards, IMEs, accessibility tools, third-party plugins and responsive layouts may behave differently; please report reproducible problems with app version and platform.
- Custom profiles do not execute scripts. Search operates locally and does not send settings contents to any server.
- Shortcut diagnostics can only inspect known plugin keymaps and host-exposed command bindings, not every third-party private editor extension.

Documentation: [English README](../README.md) · [Português (Brasil)](README.pt-BR.md) · [v5 technical guide](V5-DEVELOPMENT.md).
