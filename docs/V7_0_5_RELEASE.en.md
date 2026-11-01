# 7.0.5 — Longform book-series summary row

Focused visual improvement to the Longform project header.

- The series button no longer shares a wrapping flex row with the project selector, preventing it from jumping to a different position across tabs and sidebar sizes.
- A permanent second row displays the selected book's **Series** membership and a **Manage** button that opens the existing book-series organizer.
- Unassigned books display **No series**; books belonging to more than one series show all names, with full text available on hover.
- Adding, removing or renaming series in the manager updates the summary immediately, without redrawing the entire project view.
- Book contents, Longform indexes, Pandoc and other writing features remain unchanged.

Regression tests cover row placement, membership updates, and navigation. Update `main.js`, `manifest.json` and `styles.css` together.

[Português](V7_0_5_RELEASE.pt-BR.md).
