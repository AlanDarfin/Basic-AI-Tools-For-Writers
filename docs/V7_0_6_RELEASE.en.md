# 7.0.6 — Interaction-only Typewriter line highlight

Maintenance fix for Typewriter Mode and its interaction with Remember Cursor Position.

- Opening or switching notes never highlights the active line immediately.
- The marker appears only after a deliberate pointer/touch or keyboard interaction inside the editor.
- Mouse-wheel scrolling disables the marker and Typewriter auto-centering until the next editor interaction.
- Each editing pane tracks interaction independently.
- Programmatic selection, cursor restoration and viewport measurements do not activate highlighting.
- A real input gesture cancels any pending delayed cursor restoration without removing the saved bookmark.
- Focus-mode dimming is gated by active editor interaction, so wheel scrolling never leaves the whole editor dimmed.

No changes to vault files, Longform, AI providers or integrated Pandoc. New regression tests cover pointer/keyboard/wheel sequences, independent panes, and cursor restoration.

Update the official `main.js`, `manifest.json` and `styles.css` together.

[Português](V7_0_6_RELEASE.pt-BR.md).
