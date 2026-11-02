# Basic AI Tool for Writers 8.0.0 — Performance & Polish

This release concentrates on compatibility, review correctness, and keeping the UI usable in Obsidian on desktop and Android.

## LanguageTool / HTML
- Hide HTML tags and attributes (including `align` and `center`), entities, and raw `script/style/svg/math/pre/code/textarea/iframe` blocks from grammar checks without changing string length, newlines, or source offsets.
- Preserve readable text between HTML tags. Editors never receive corrections that target masked syntax.
- On Android, tapping a highlighted finding can open a native Obsidian Modal with large, scrollable actions for replacements, explanations, and ignore commands. The original desktop hover/context menu remains intact.
- When touch pointer events miss the decoration, find the relevant word using the touch coordinates and CodeMirror's `posAtCoords`.
- Review lists display the first 24 suggestion cards and progressively reveal additional cards on demand, while all editor marks and cached results stay available.

## Performance
- Cache up to 128 indexed Markdown files when mtime and size remain unchanged, reducing full re-tokenization on subsequent scans.
- Cache the internal-link candidate list for 10 seconds to avoid enumerating large vaults on every autocomplete invocation.
- Maintain a separate review rendering boundary to minimize synchronous DOM updates on long chapters.

## Interface and build
- Use Obsidian theme variables and responsive sizing for review cards, buttons, and Android correction dialogs.
- Disable scroll snapping and animation only inside Basic AI navigation strips; preserve horizontal scrolling in Longform and settings.
- Maintain CSS in `src/styles/v8-navigation.css` and `src/styles/v8-review-mobile.css`, bundled into a single `styles.css` by `scripts/build-css.js`, with a synchronization check.
- Retain Pandoc, Longform projects, AI providers, English/Portuguese UI and existing writing tools.

## Verification and limitations
- Syntax, modular bundle/CSS consistency, community CSS checks and regression tests run in GitHub Actions.
- This is a targeted code-maintenance update, not a claim that every old CSS rule has been removed or that all devices are benchmarked. Test touch behavior in the Obsidian Android app after upgrading.
- Remote LanguageTool submissions still follow the existing privacy policy and configured endpoint.

Install the three official assets together: `main.js`, `manifest.json`, `styles.css`.

[Português](V8_0_0_RELEASE.pt-BR.md).
