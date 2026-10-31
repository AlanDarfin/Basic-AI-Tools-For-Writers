# Basic AI Tool for Writers 6.0.0-beta.1

**Major preview build (prerelease, not stable).** Obsidian 1.11.4+ (API-level automated checks; real-device validation pending). No leading \`v\` on the tag. The stable series remains **5.2.0** until the v6 release candidate is validated.

This version integrates six independent tool families built specifically for Basic AI, based on the requested reference functionality, **without copying third-party bundles**.

## New tools

- **Advanced Ruby (first-party implementation):** \`{base|annotation}\` reading markup, two nesting levels, Reading-mode Ruby HTML DOM, Live Preview source styling, selection wrap/removal/HTML conversion and per-level sizing.
- **Discord timestamps:** \`<t:epoch:style>\` preview for \`t/T/d/D/f/F/R\`, localized time in Reading mode, highlighted raw syntax in Live Preview, insertion date/time modal and recent timestamp history.
- **Interactive ratings:** \`[rating:3.5/5:star]\` and heart/moon/circle/bar/custom styles; clickable rating widgets, Shift-click for half increments, selectable fractions/percentages and user-defined symbols.
- **Discord Syntax integration:** Existing \`||spoiler||\` support is kept in Extended Syntax rather than duplicated. New \`-# subtext\` and optional \`||\` block spoiler pairs with accessible Reading-mode disclosure.
- **Reading time:** per-note desktop status and cross-platform selection/note command, configurable words per minute and frontmatter/code exclusions.
- **Linter (safety-first subset):** manual Markdown formatting rules for whitespace, headings, lists, footnotes, blockquotes and optionally YAML, with per-note Diff-like preview and confirmation. Folder batching (up to 50 notes) requires confirmation, skips the active note, checks for intervening changes and backs up each note before writing. Path exclusions and recovery copies included.

## Settings and compatibility

Features live in the existing **six settings groups** and are separately configurable. All six are **disabled by default** and use bilingual **English / Portuguese (Brazil)** UI.

New implementation modules: \`src/v6/foundation.js\`, \`reading.js\`, \`markup.js\`, \`linter.js\`; tests in \`tests/v6-integrations.test.js\`. The standalone release ZIP includes \`main.js\`, \`manifest.json\`, and \`styles.css\`.

## Important beta limitations

- These implementations **are not full one-to-one ports** of the six uploaded plugins. Most notably, the reference Linter's very large rules catalogue, automatic lint-on-save/rename and advanced YAML/bulk policies have **not** been fully reproduced.
- Nested Ruby, live editor decorations, spoilers with mixed nested formatting, custom emoji ratings, mobile touch targets and timezone changes still require hands-on testing in Obsidian desktop and Android.
- Ruby reference v3.x uses a different licensing model than Basic AI; this beta uses original independent code rather than bundling upstream material.
- No retired Editing Toolbar has been restored.
- Back up your vault before trying this prerelease, particularly before applying Linter changes. Although backups are written, test a small copy of a vault first.
- Check plugin privacy settings before enabling online AI/TTS/LanguageTool; the six new local tools do not require transmitting note content to a remote service.

## Install / report issues

1. Download **Basic-AI-Tool-for-Writers-6.0.0-beta.1.zip** from this prerelease.
2. Extract the three files into \`.obsidian/plugins/basic-ai-tool-for-writers/\` (back up \`data.json\` first; keep it intact).
3. Reload the plugin and visit grouped settings to enable individual v6 features.
4. Report issues with Obsidian build, operating system, a short reproducible example and whether another formatting plugin was active.

Read the complete [English v6 implementation guide](docs/V6-IMPLEMENTATION.en.md) and the [Brazilian Portuguese guide](docs/V6-IMPLEMENTATION.pt-BR.md).

**No stable 6.0.0 release yet.** The beta is for evaluation and iterative fixes before the production release.
