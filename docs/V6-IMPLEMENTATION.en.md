# Basic AI v6 — Feature integration preview (English)

**Branch:** \`feature/v6-full-integration\` · **Pull request:** #25 · **Current stable version: 5.2.0.** No v6 stable release has been issued.

Six independently authored tool families have been added without embedding the supplied third-party compiled distributions. Each new feature starts **disabled**. Enable it in its settings and, if necessary, show the module through **Settings → General → Modules**.

## Usage

### Reading time
**Review & reading → Dates & reading time.** Configure reading speed (60–900 words/min), frontmatter/code exclusions and status-bar display. On desktop, the active note shows a reading estimate in the status bar. The **Reading time: selection or note** command is available for both desktop and mobile.

### Discord timestamps
**Review & reading → Dates & reading time.** Render Discord \`<t:1710000000:f>\` tokens in Reading mode; the original Markdown remains intact. Live Preview adds a formatting hint to the syntax. The **Discord timestamp: insert marker** command provides local date/time selection, all seven formats (\`t\`, \`T\`, \`d\`, \`D\`, \`f\`, \`F\`, \`R\`) and a small recent-history list. Timezone and locale are configurable, with fallbacks for invalid timezone names.

### Ruby annotations
**Markdown → Ruby, Discord & ratings.** Type \`{漢字|かんじ}\` to annotate a base with phonetic text. Reading mode creates safe semantic Ruby DOM nodes; Live Preview marks the raw Markdown for editing. Two nested levels are supported, e.g. \`{one {漢字|かんじ}|annotation}\`. Commands wrap selected text, remove annotations, or convert the selection to escaped HTML. Independent size settings are provided for primary and nested annotations. This intentionally implements a focused subset of Advanced Ruby features; no copyrighted third-party code was incorporated.

### Discord syntax
**Markdown → Ruby, Discord & ratings.** Existing \`||spoiler||\` rendering stays inside the Basic AI Extended Syntax module, avoiding duplicate parsers. V6 adds \`-# subtext\` and opt-in block spoilers marked by separate \`||\` lines, rendered as accessible expandable sections in Reading mode. More advanced mixed-format spoiler parity has not yet been certified.

### Interactive ratings
**Markdown → Ruby, Discord & ratings.** Insert \`[rating:3.5/5:star]\`. Supported styles: \`star\`, \`heart\`, \`moon\`, \`circle\`, \`bar\`, and \`custom\`. Reading mode displays symbols, while an editor widget can update the precise marker range. Shift-click selects half a point. Choose your own full/empty/half symbols and optionally show fractions or percentages. Using explicit \`[rating:...]\` markers avoids unexpected changes to ordinary stars and emoji in prose.

### Linter
**Writing → Writing linter.** Rules cover trailing whitespace, heading/list spacing, footnote definitions, blockquote spacing, YAML property spaces, excessive blank lines and a final newline. **Linter: review note formatting** shows a before/after preview and requests confirmation. **Linter: review current folder** proposes a batch of at most 50 notes (excluding the active note); it backs up each note before writing. Backups use Basic AI Snapshots if enabled or a plugin-local recovery folder. The Linter skips excluded paths and protected Markdown regions and refuses stale edits.

**Important scope limit:** The uploaded Linter reference offers many more rules and automatic workflows than the first v6 implementation. Automatic lint-on-save/file-switch, the complete upstream rule catalog and full upstream compatibility **are not included** at this stage. The emphasis is safe, reviewable operations, not an untested full clone.

## Development safeguards and release gate

- Sources: \`src/v6/foundation.js\`, \`src/v6/reading.js\`, \`src/v6/markup.js\`, \`src/v6/linter.js\`; tests in \`tests/v6-integrations.test.js\`.
- \`main.js\` is generated from canonical source; never edit only the distribution artifact.
- New controls, labels, notices and settings are bilingual (pt-BR and English).
- New functionality is opt-in and must not affect existing Longform, AI, LanguageTool, typewriter, snapshots, Keyshots, Easy Typing or Smart Typography workflows.
- The upstream Advanced Ruby 3.x licensing is not MIT. This project implements similar behaviors separately without copying the provided compiled code.
- Passing GitHub CI is not equivalent to testing Obsidian's editor on desktop and mobile devices. We still need end-to-end tests with nested markup, links, large notes, IME, touch and CSS/theme compatibility.
- Do not publish v6 as stable until Obsidian compatibility, regression tests, manual desktop/Android smoke tests, bilingual documentation, manifest/version mapping and release ZIP/checksums are complete.

For reference architecture and licensing considerations, read [V6 architecture (English)](V6-ARCHITECTURE.en.md) and [Portuguese implementation guide](V6-IMPLEMENTATION.pt-BR.md).
