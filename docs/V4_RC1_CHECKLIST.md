# Basic AI Tool for Writers — v4.0.0-rc.1

**Release candidate, NOT stable.** Based on the v4.0.0-beta.6 feature set, with modular UI, lighter Longform rendering, user-controlled tools and a local diagnostics panel.

## Customizable modules

Open **Settings → Basic AI Tool for Writers → Modules**. Switch off what you don't use, e.g. **Translator**.

The toggle hides corresponding navigation tabs and shortcuts. The translator also stops handling translation requests while hidden. Existing language preferences, prompts, project data, comments and snapshots are retained and restored when re-enabled. There is no destructive cleanup.

Module categories: dictionary, translator, chat, review/LanguageTool, Longform projects, writing tools, autocomplete, variants, selective Diff, snapshot shortcuts, TTS, Unicode, templates, mentions, comments, Wordwise AI actions and typewriter mode.

**Subtleties:** hiding *Snapshots* hides shortcuts, not the safety backups that can occur before editing a note. Existing rendered content (like a table of contents already present in a note) is not deleted when its authoring tools are hidden. Registered command IDs remain stable so saved Obsidian hotkeys are not broken; a command whose module is hidden will not open that hidden tool.

## Diagnostics

Visit **Settings → Diagnostics** for local status: plugin version, mobile/desktop flag, number of Markdown notes, enabled modules, LanguageTool configuration summary, providers with keys present (without displaying keys), TTS Web Speech API capability, and snapshots. The panel does not call any network service. It displays only the LanguageTool server's origin, not a full URL containing credentials or query parameters.

## Longform and large vaults

Longform only builds the selected tab rather than rendering every tab each time, reducing unnecessary work when navigating long manuscripts. Chapter hierarchy, drag-and-drop, keyboard buttons, and scroll preservation are retained.

## Regression and privacy checks

- [x] Programmatic tests for feature flags, retention of saved data and API-key redaction.
- [x] Integration checks for Longform, snapshots, Android command registration, Markdown-safe review, LanguageTool throttling and UI.
- [ ] Manual test: **Android** — menus and switches at 360px and 720px, enabling/disabling translator, Markdown selection commands in the native Obsidian toolbar, TTS fallback and native copy/paste interaction.
- [ ] Manual test: **Desktop** — same toggles, keyboard commands, all writing panels, large Longform projects and typewriter mode.
- [ ] Manual test: fresh installation and migration from beta.6, ensuring all settings, AI prompts, project chapters and snapshots are preserved.
- [ ] Manual test: network failures and rate limits (LanguageTool, online TTS, configured AI provider), confirming no accidental rewrite.
- [ ] Manual test: fonts, contrast, screen readers and themes.

**Privacy:** automated LanguageTool checks are triggered only while the Review tab is open and are sent to the configured endpoint. Online speech requires explicit opt-in. The diagnostics view does not make test calls or expose full API keys.

## Criteria for v4.0.0 stable

Promote the RC only after all manual verification items pass on actual desktop and Android environments, no P0/P1 issues remain, and the release workflow produces verifiable ZIP, manifest, styles and checksums. Do not promote directly on the strength of CI alone.

## Installation / rollback

Back up your Obsidian vault or test in a copied vault. Unzip the release to the existing plugin folder, replacing **main.js**, **manifest.json** and **styles.css**. **Do not overwrite data.json.** Reload the plugin. To roll back, restore the prior three files and your settings backup if necessary.
