# v9 — Final integration and compatibility audit

## Historical lineage / Origem histórica

- **1.0.0 (Alan's Offline Dictionary):** the vault dictionary uses `# word` headings separated with `---`. The current `parseDictionary()` still recognizes this content. **Obsidian plugin ID was different** (`alans-offline-dictionary`), and Obsidian does not auto-migrate its settings to `basic-ai-tool-for-writers`. Keep the original vault note and copy settings manually. Do not delete either plugin's `data.json` without a backup.
- **1.8.0–2.0.0:** retained dictionary, AI providers, translations, selection tools, English/Portuguese UI and Longform-compatible project notes.
- **3.x–4.x:** retained autocomplete, variants, snapshots, grammar, templates, TTS and independent module switches.
- **5.x–6.x:** retained Markdown extensions, editor helpers, Longform hierarchy and project/chapter navigation.
- **7.x–8.3:** retained compendium, worldbuilding, calendars, study tools, homepage and writing blocks.
- **9.0.0:** new customizable editing toolbar, native Explorer personalizations, Smart Spaces, redesigned calendar and Obsidian-native settings group.

## Feature comparison to reference projects

These are **independent feature adaptations**; no upstream code is vendored. Original projects remain installable. Comparisons were made against their published source structure, README and relevant design contracts. **No claim of exact feature parity.**

| Upstream plugin | Basic integration reviewed | Supported | Not equivalent or out of scope |
| --- | --- | --- | --- |
| Various Complements | Local suggestions and vault indexing | Configurable suggestions; module visibility | Not all upstream sources/triggers |
| VariantEditor | Text alternatives and comparison | Local variants and safe review | Not identical upstream format/UI |
| Note Snapshots | Local revision history | Independent snapshots and restore | Does not load original snapshots automatically |
| Longform | Projects, scenes, hierarchy, compilation | Compatible planning workflows, chapter navigation | Not a complete Longform fork |
| LanguageTool + LanguageTool Advanced | Grammar suggestions and paragraph checks | Optional LanguageTool integration; Markdown-aware checks | Not an exact replacement for either extension |
| Edge TTS | Multilingual reading | System and optional network engine | Remote protocol may change, requires consent |
| Keyshots, Easy Typing, Smart Typography, Pandoc Syntax, Extended Syntax | Editor helper functions | Independently configurable writing modules | Upstream command coverage varies |
| StoryLine, Storyteller Suite, Folder Notes, BookNav / NoteChain | Scene planner, compendium, folder notes, chapter navigation | Independent project and folder workflows | Upstream formats/features vary; avoid simultaneous auto-modification |
| Full Calendar (archived) + Remastered | Calendar in Markdown | Month, week, day, three days, agenda, sidebar, recurring event exceptions | No Google/CalDAV sync; no claim of upstream recurring event compatibility |
| Spaced Repetition | Study module | Local Q/A, cloze and review scheduling | Not full upstream scheduling/features |
| cMenu | Markdown editing toolbar | 27 actions, custom order, module switch and mobile opt-in | Does not import custom upstream cMenu commands |
| Make.md | Native explorer and organization | Per-file icons/colors, folder cards/list, virtual Smart Spaces | No complete Make.md databases, formulas, rollups, Flow or full Spaces engine |
| Harbor / homepage concepts | Landing workspace | Search, clock/calendar, icons, recent files, local shortcuts | Does not replace Obsidian core search or tabs |

## UI audit

**Rules:** default to Obsidian's `--background-*`, `--text-*`, `--interactive-accent`, `--font-*`, `--radius-*` and spacing tokens; keep rules scoped to Basic-owned surfaces; do not restyle other plugins' modals, notes or native file lists; preserve keyboard focus, readable labels, compact 720p/mobile layouts, theme contrast and native mobile editing.

**Actions in v9:**
- Separated homepage, toolbar, Explorer, Spaces and calendar configuration from the General tab into a Customization group.
- Added final scoped design-system CSS for consistent cards, tabs, form controls and focus indicators.
- Reworked Explorer observer from the entire workspace to Explorer containers and stopped redundant icon reconstruction.
- Kept calendar navigation/sidebar **inside** the calendar view, not a second Obsidian side panel.
- Mobile cMenu-inspired toolbar disabled by default; module toggles preserve user data.

## Data, security, lifecycle and accessibility

- Event notes remain local Markdown, use explicit confirmation for deletion, preserve event bodies, and reject stale writes.
- Network AI/TTS/LanguageTool remain independent opt-in features and may send text to a provider when enabled. Never store credentials in Markdown.
- Existing user notes, Longform data, local history and dictionary content should not be rewritten automatically by migration.
- On plugin reload, sidebar snapshot restoration remains; test hot reload with multiple docked panels.
- Calendar and Smart Spaces use virtual filtering, not a new persistent database or external sync.
- Full syntax, source/bundle synchronization, CSS community lint, package metadata and regression checks run in GitHub Actions.
- **Limits of automated tests:** no actual Obsidian Desktop, Android WebView, screen reader or arbitrary third-party theme instance in CI. Manual acceptance in those environments is still recommended.

## Installation from v1

1. Back up the entire vault, including `.obsidian/plugins/alans-offline-dictionary/data.json`, your dictionary Markdown note and `.obsidian/plugins/basic-ai-tool-for-writers/data.json` if it exists.
2. Install Basic AI Tool for Writers separately; the plugin ID is different from v1. Do **not** rename the plugin ID in its manifest.
3. Set the Basic dictionary file to your existing Markdown note, keeping the `# word` entry format. Copy relevant provider/settings values manually, without sharing API keys.
4. Verify words, translation, snapshots, Longform and mobile panels before uninstalling the old plugin.
5. Leave original reference plugins installed until you have confirmed that the subset of Basic features you use is sufficient.

## Release acceptance criteria

- Version agreement across manifest, package, lockfile, versions.json and bilingual README.
- CI `npm run check`, CSS scan and release workflow succeed.
- Release attaches **exactly** `main.js`, `manifest.json`, `styles.css`; no `v` prefix.
- No untested claim of full parity with upstream or fully automated v1 migration.

## 9.0.1 candidate (not released)

The branch `fix/v9-0-1-ui-spaces-iconic` adds independent color controls, expanded Lucide selection, homepage layout changes, optional Spaces sidebar, and a visual-only password gate. Unlike a full Make.md implementation, this **does not add** relational properties, rollups, formulas or Flow editing. The password gate **does not encrypt notes**. See `docs/V9_0_1_PREVIEW.pt-BR.md` for the feature-by-feature status. This section describes a candidate only and does not revise the v9.0.0 release claims.
