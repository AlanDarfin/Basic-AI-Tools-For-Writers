# Basic AI Tool for Writers — version 9.2.0

## Explorer and Folder Notes
- Favorites integrated with existing Home favorites, a customizable Lucide icon and **fully filled state** on favorite files.
- Native Explorer previews: off / Folder Notes only / all notes and Folder Notes.
- Folder Note `description` appears under the matching folder. Edit it in properties or from the folder context menu; new Folder Notes include the property.
- Ordinary notes show their `description`, `summary` or a Markdown excerpt.

## Interactive Markdown
- Responsive `columns`/`multi-column` blocks supporting Markdown.
- `progressbar` for manual or calendar-based progress, with optional persisted manual buttons.
- `widgets` for clocks, quotes, counters and countdowns.
- `meta-bind` forms, `meta-bind-button` actions and Reading-mode `INPUT`/`VIEW` fields, safely bound to YAML properties with no arbitrary JavaScript execution.

## Zotero references and quotes
- Local literature note indexing and optional vault `.bib` support.
- Reference picker and `zotero`/`bibliography` blocks.
- The homepage quote widget can prefer Zotero highlights or mix them with manual quotes; **Open reference** links to the imported note.
- Limitation: this does not connect directly to Zotero's private database or reproduce Better BibTeX/Zotero Integration APIs. Import or sync notes/exports to the vault.

## Note styling and session drafts
- Reversible note appearance controls for H1–H6, text, lists, quotations, colors, local presets and CSS.
- Temporary and session-local scratch note panel, with Markdown export and no automatic deletion of existing vault files.

## Maintenance
- Individually toggleable modules and settings integrated into Basic AI's settings navigation.
- Updated manifest, package, lockfile, version map, bundled JS/CSS, and bilingual feature-only READMEs.
- Dedicated regression tests and build checks.
- All integrations are independently implemented from the nine credited repositories' documented behaviors, not verbatim forks.
