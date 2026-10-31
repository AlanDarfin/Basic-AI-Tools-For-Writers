# Basic AI v6 — Reference plugin review and integration architecture

> **Status:** planning and source audit, **not** v6 feature implementation or a release. Stable baseline: **Basic AI 5.2.0** on main, Obsidian **1.11.4+**, \`isDesktopOnly=false\`. The v6 work is isolated in a development branch.

## Supplied reference bundles

The six JavaScript bundles, six manifests and five available CSS files were inspected. Each JavaScript bundle passed \`node --check\` syntax validation; this is **not** a runtime Obsidian compatibility test. The supplied JavaScript consists primarily of compiled or bundled distributions, not the original source tree.

| Reference | Version | Reference minAppVersion | Main JS size | Scope |
| --- | --- | --- | ---: | --- |
| Advanced Ruby | 3.0.1 | 1.14.4 | 14 kB | Two-level ruby markup/annotations, Reading/Live Preview, cursor navigation, MD↔HTML converters, independent style settings |
| Discord Timestamps | 1.0.20 | 1.7.7 | 807 kB | Discord \`<t:epoch:format>\` rendering, timezone-aware insertion, format picker, history |
| Interactive Ratings | 1.0.8 | 0.15.0 | 34 kB | Editable rating symbols, optional fractions/percentages, half ratings, emoji patterns |
| Discord Syntax | 1.0.28 | 0.15.0 | 77 kB | \`||spoiler||\`, \`-# subtext\`, reveal/hide and Reading/Live Preview styles |
| Linter | 1.34.2 | 1.13.0 | 998 kB | YAML, headings, footnotes, lists, spacing, Markdown and paste rules; Diff preview, optional automatic triggers and bulk formatting |
| Reading Time | 1.1.2 | 0.12.17 | 16 kB | Active-note reading estimate, selection tool, words-per-minute, formats and status bar |

## Existing Basic AI architecture and important findings

1. **Keep the canonical sources authoritative.** Current code lives in \`src/v3/\`, \`src/v4/\`, \`src/v5/\`, plus \`projects.js\`. The shipped \`main.js\` (~434 kB) is produced using \`scripts/sync-projects.js\` and \`scripts/build-v3.js\`. Updating the bundle alone causes source-sync failures. All new v6 modules should be added as canonical modules and built/tested with the existing scripts before shipping.
2. **Confirmed syntax overlap.** \`src/v5/extended-syntax.js\` already handles \`||spoiler||\` in Reading and Live Preview. Do not install an additional independent Discord spoiler renderer; evolve the existing parser/markup handling to support better inline/block spoilers and \`-# subtext\`.
3. **Editor interference risk.** Linter modifies overlapping text ranges with Easy Typing, Smart Typography and potentially LanguageTool, while Keyshots changes keyboard navigation. Establish a shared protected-range policy, ordering, debounce, explicit undo, exclusion lists and a single controlled write path.
4. **Rendering efficiency.** Existing Extended/Pandoc Syntax modules already use markdown post-processors and CM6 decorations. A v6 shared range scanner/render coordinator should avoid double processing, repeated full-file scans and re-rendering hidden large Longform chapters.
5. **Avoid massive dependency duplication.** The supplied Linter and Discord Timestamps bundles are ~998 kB and ~807 kB. Rebuild purpose-built modules instead of embedding third-party compiled distributions. Prefer \`Intl.DateTimeFormat\` and focused pure rule functions where practical.
6. **Obsidian minimum-version gate.** Basic AI targets 1.11.4. The reference Advanced Ruby declares 1.14.4 and Linter 1.13.0. This does not *automatically* require raising Basic AI's minimum if independent implementations use older compatible APIs. Test compatibility, then set \`manifest.minAppVersion\` and \`versions.json\` together when needed.
7. **Bilingual compact UI.** Put new settings inside the existing six groups, not a return to 30+ top-level tabs. All descriptions, ARIA labels, tooltips, commands, and public docs must be Brazilian Portuguese and English.

## Integration design: all six references

**Advanced Ruby.** Support two annotation levels, raw Markdown text, Reader and Live Preview rendering, wrap/remove/copy/conversion commands, smart arrows and color/position/size controls. Protect links, math, code, nested and escaped delimiters. Build semantic \`ruby\`/ \`rt\` nodes instead of handling user input as raw \`innerHTML\`. The original bundle uses \`RegExp.escape()\`, unavailable in older JavaScript runtimes; avoid depending on it without compatibility checks.

**Discord Timestamps.** Recognize \`<t:epoch:style>\` (styles \`t\`, \`T\`, \`d\`, \`D\`, \`f\`, \`F\`, \`R\`); preserve the source and render localized values. Add a picker, saved recent choices, timezone configuration, range checking and optional explicit rendering inside code. Keep relative date refresh rate bounded and clean up listeners.

**Interactive Ratings.** Add full/half symbol families (stars, bars, emoji), selected-value and percentage/fraction modes, exact-range edits in the editor, keyboard and touch semantics. Handle emoji sequences by grapheme clusters, not UTF-16 code units. Be cautious with markdown lists and ordinary symbols that only *look like* ratings.

**Discord Syntax.** Improve the existing Extended Syntax spoiler implementation with safe block parsing, nested formatted spans, reveal/hide, tap, keyboard and correct source editing. Add \`-#\` subtext with code/list awareness. Use shared decorations and one reading postprocessor for the syntax family.

**Linter.** The requested reference provides a broad independent rules framework, not one formatter function. Design a pure \`text + rules → proposed changes / diagnostics\` engine; separate preview and commit. Cover YAML, headings, whitespace, lists, footnotes, paste, regex/custom replacements, ignore paths, manual/optional save/switch actions, and file/folder/vault runs. Treat batch changes as high risk: backups/snapshots, non-destructive Diff preview, confirmation, explicit ignore rules and concurrency protection are mandatory. Disable potentially disruptive automatic actions by default. Maintain a **rule-by-rule feature coverage matrix**, documenting any upstream parity gaps instead of promising identical behavior without tests.

**Reading Time.** Provide selectable reading speed, active-note and selected-text estimates, mobile-friendly presentation and desktop status bar, language-aware word counting, optional frontmatter/code exclusions and optional Longform aggregate. Debounce editor updates, avoid rescanning entire project on each keystroke.

## Licensing / attribution review

- **Advanced Ruby ≥2.0.1:** upstream's stated license is **PolyForm-Perimeter 1.0.1**, not Basic AI's MIT. Treat the uploaded distribution as a behavioral reference only; **do not paste, repackage or modify its code into MIT Basic AI** without checking permissions and license compatibility.
- The other tools may use more permissive licenses, but verify each exact source/release and required third-party notices before incorporating **any** implementation. Original independently authored behavior reduces direct copying and bundle/dependency conflicts.
- Maintain \`THIRD_PARTY_NOTICES.md\` for code/dependencies actually included, with correct authorship and licenses.

## Proposed file boundaries

\`\`\`text
src/v6/shared/{protected-ranges,render-coordinator,rules-runner}.js
src/v6/markdown/{ruby,discord-syntax,discord-timestamps}.js
src/v6/editor/interactive-ratings.js
src/v6/linter/{rule-registry,engine,preview}.js
src/v6/reading/reading-time.js
src/v6/settings/v6-settings.js
tests/v6/{ruby,discord-syntax,timestamps,ratings,linter,reading-time,compatibility}.test.js
\`\`\`

Existing module-visibility settings remain the source of truth. New persistent settings are namespaced, migrated without dropping \`data.json\`, and off by default where edits/remote access could be surprising.

## Milestones

1. **Foundation — this audit:** identify and examine all supplied references, audit existing code/collisions and licensing, define architecture; no feature implementation or release.
2. **Reading and dates:** shared protected-ranges scanner, lightweight Reading Time, Discord timestamps and mobile locale tests.
3. **Syntax:** combine Discord Syntax with existing spoiler engine and add safe two-level Ruby with Reading/Live Preview tests.
4. **Widgets:** Interactive Ratings with symbol/fraction/percentage conversion, CM6 exact-range edits, touch/keyboard.
5. **Linter:** pure rules engine, safe previews, per-file rules, folder/vault scope, optional triggers and bulk safety/undo.
6. **Release candidate:** Obsidian desktop and Android manual smoke tests, performance on large documents, internationalization review, CSS/community lint, all prior regression suites, version/minAppVersion check, release ZIP/checksum and GitHub tag \`6.0.0\` **without** a \`v\` prefix.

## v6 stability gates

- No regression in current Longform, AI, TTS, LanguageTool, Markdown, typewriter and typing helpers.
- No duplicate spoiler or parser decoration pipelines, no accidental transformations in source/code/math/links.
- Linter previews bulk edits, respects skip lists and protected regions, supports recovery and never silently reflows large manuscripts by default.
- Accessible keyboard/touch UI and screen-reader labels; tested on a 720p layout and a real Android Obsidian installation.
- Source synchronization, independent unit tests, integration fixtures, license audit and stable CI green.
- No v6 release until parity scope is explicitly documented and manual smoke testing is complete.

**Current result:** v6 architecture and audit only. Stable \`main\` and released **5.2.0** remain unchanged.
