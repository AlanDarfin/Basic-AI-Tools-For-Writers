# 7.0.4 — Stable Longform tabs and scrollable settings

Small navigation maintenance focused on the original scroll-reset bug.

- **Longform:** clicking Relationships, Maps, Gallery, Sessions or any other tab keeps the same horizontal tab DOM node and only redraws the selected content panel. No full sidebar rebuild on tab clicks.
- **Top-level Longform groups:** Writing, World and Project update the tab buttons in place and preserve independent horizontal offsets, without rebuilding the whole view.
- **Settings:** both the main category row and the secondary section row support mouse-wheel / trackpad horizontal movement. Switching sections inside a group keeps the secondary navigation mounted, preserving its scroll position.
- **Visual scroll behavior:** disable scroll snapping and smooth scrolling specifically in Basic AI tab bars, avoiding animated jumps.
- **Preserved:** Android touch-friendly dimensions, books and vault data, Pandoc, permissions and existing writing features.

Includes navigation regression tests. Update the three official files (`main.js`, `manifest.json`, `styles.css`) together.

[Português](V7_0_4_RELEASE.pt-BR.md).
