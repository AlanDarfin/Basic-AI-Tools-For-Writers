# 7.0.2 — More compact desktop sidebars

A focused visual fix for the writing sidebar and the Longform/project sidebar.

- Correct the Definitions search input and context textarea growing far beyond their intended height because of inherited flex sizing in a vertical layout.
- Slightly reduce desktop-only padding, tab heights, control heights and button spacing so both sidebars fit better at 1440×810 and other desktop resolutions.
- Keep all tabs horizontally scrollable and text at Obsidian's normal readable UI size.
- Keep Android sizing, touch targets, Pandoc, data structures and plugin functionality unchanged.
- Do not apply CSS `zoom`, transform scaling or global Obsidian theme changes.

The changes affect `styles.css` only at runtime. Upgrade `main.js`, `manifest.json` and `styles.css` together from the official release to maintain version consistency.

[Português](V7_0_2_RELEASE.pt-BR.md).
