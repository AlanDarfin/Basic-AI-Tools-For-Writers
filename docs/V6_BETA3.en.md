# Basic AI Tool for Writers — 6.0.0-beta.3

**Experimental prerelease**. Stable remains **5.2.0**.

- **Longform Nav:** discovers scenes from the original Longform YAML index when the metadata cache is incomplete; respects the order of chapters and nested subchapters.
- **Ruby in Live Preview:** annotations render directly in CodeMirror. Moving the selection into a token shows editable Markdown again.
- **Ruby below:** use `{base|reading|under}` for text below or `{base|reading}` for text above. A separate command inserts below-text Ruby.
- **Compact UI:** flatter controls in the Markdown settings and smaller chapter navigation buttons for mobile.
- Regression tests added for the scene-list fallback and Ruby editor decorations.

To install, replace `main.js`, `manifest.json`, and `styles.css` in `.obsidian/plugins/basic-ai-tool-for-writers/` (or extract the three-file ZIP) and reload Obsidian. Test on Android before considering the issue fully resolved.
