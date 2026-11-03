# Basic AI Tool for Writers — 9.1.2

## Virtual Content

- Independent non-destructive virtual Markdown integration based on Virtual Content's concepts.
- Rules based on folders, tags and frontmatter properties, including AND/OR conditions, recursive paths/tags and negation.
- Sources include typed Markdown, a vault Markdown template, or the existing Longform BookNav.
- Locations include header, footer, sidebar, and beginning/end of a section (Reading View only). Generic headers and footers also render in Live Preview.
- Sidebar view with optional per-rule tabs and a command palette entry.
- Built-in variables: `{{file.name}}`, `{{file.path}}`, `{{file.folder}}`.
- Rules can be enabled, edited, removed and reordered; bounded to 40 rules with capped Markdown content.

## Automatic BookNav

- Chapters and subchapters can display automatic next/previous navigation without adding `longform-nav` to Markdown.
- Reuses the original Longform scene ordering, nested chapter support and YAML index fallback.
- Manual blocks, per-project navigation overrides and main/subchapter toggles remain supported.
- A matching virtual BookNav rule takes over placement and suppresses the global auto footer in that note.
- BookNav can refresh navigation when index order and configuration change.

## Compatibility and limits

Mobile remains supported. Templates may contain Markdown for Dataview/Bases, but rendering depends on those external plugins and the current view mode; Basic does not execute arbitrary queries or JavaScript as part of rule matching. Section injection is Reading-only. Virtual content never writes or replaces note files.

Manifest, package, lockfile, version map and bilingual documentation updated; dedicated regression tests included.
