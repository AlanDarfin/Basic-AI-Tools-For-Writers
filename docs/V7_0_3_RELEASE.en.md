# 7.0.3 — Longform horizontal tab navigation

This patch fixes a navigation regression in the Longform/project sidebar.

- Switching from Relationships to Sessions, Maps, Gallery, and other tabs no longer resets the horizontal tab strip to its leftmost position.
- Scroll positions are stored separately for the Writing, World and Project tab groups and survive panel rerenders within the same open view.
- Previously, the position was restored while the new tab strip still had no buttons; browsers clamped the scroll to zero. The fix restores it **after** creating the buttons.
- Clicking the current tab no longer triggers a redundant rerender.
- No changes to note data, Pandoc, permissions, responsive layouts or mobile touch targets.

New automated regression tests simulate the original problem and verify tab switching and group navigation. Update `main.js`, `manifest.json` and `styles.css` together using the official release.

[Português](V7_0_3_RELEASE.pt-BR.md).
