# Basic AI Tool for Writers 8.0.2 — Mobile layout and hot-reload stability

A focused maintenance release based on Android screenshots and feedback.

## Layout and navigation
- Longform Structure sub-tabs (Plotlines, Story beats, Pacing, Connections) no longer wrap inside narrowly squeezed pill buttons. The toolbar scrolls horizontally and supports trackpad or mouse wheel, with stable active-tab state and proper accessibility labels.
- Dictionary optional context is a compact two-line field rather than a full-height sidebar editor. It expands on focus and can be resized.
- Synonyms, Antonyms and secondary writing tool actions adopt subtle transparent/outlined buttons similar to the Longform Project controls. Primary actions continue to use Obsidian's accent style.
- These changes are scoped to Basic AI classes, preserving core Obsidian Bookmarks/File Explorer.

## Reloading without losing panels
- During unload, store a session-only snapshot of existing Basic AI, Longform and Writing tools leaves, including their selected tabs and which sidebars were expanded.
- Immediately after the next plugin load and Obsidian layout readiness, recreate only those panes if they are not already present; restore selected sections and reveal only previously expanded sidebars.
- Snapshots expire after two minutes and are consumed once; manually closed or previously collapsed panes are not forcibly shown. This does not mutate manuscript data.
- Obsidian still has to destroy plugin views when the code unloads; this is recovery across hot reload, not preservation of the original DOM.

## Verification
- New tests cover horizontal labels, CSS scope, bounded context, state snapshot and one-time restore, manual closures and stale snapshots.
- CI also runs the full suite, source/bundle checks and community CSS lint.

Install all three official assets: `main.js`, `manifest.json`, and `styles.css`. Validate actual touch behavior in Obsidian on Android.

[Português](V8_0_2_RELEASE.pt-BR.md).
