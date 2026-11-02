# Basic AI v9 — integration preview

Version: **9.0.0-beta.1**. This is not a stable release.

## Implemented in this branch

| Requested feature | Implementation |
| --- | --- |
| cMenu-style toolbar | 21 Markdown actions; reorderable/optional buttons; compact mode; command-palette commands. Enabled on desktop, **disabled on mobile by default**. |
| Local Smart Spaces (optional) | Saved folder/tag/property filters with cards, list, table and status-board views. Disabled by default and stored in Basic settings. No additional sidebar. |
| Make.md-inspired native explorer | Custom Lucide icons, accent colors, file/folder context menus, filterable folder browser in cards/list layouts, and Markdown folder index creation. No new sidebar. |
| Writing homepage | Centered title, transparent icon, more Lucide options or a vault/HTTPS image, icon above the title on mobile or next to it on desktop, and clock above calendar. |
| Independent modules | Toggle formatting toolbar and native explorer enhancements; configure individual options; PT-BR and English UI. |

## Make.md architecture survey

The upstream Make.md repository tree contains around 634 files, including core UI, Obsidian adapters, data storage and caching, Spaces, Flow editing and Maker Mode. Porting the complete project would overlap navigation, data models, styling, and dependencies. These changes are an **independent feature adaptation**, not a full fork.

| Upstream subsystem | Basic approach | Status |
| --- | --- | --- |
| File icons and navigation | Extend the native File Explorer | Initial implementation |
| Folder cards/list | Native folder context action and existing Markdown folder overviews | Initial implementation |
| Spaces, saved collections | Optional local Smart Spaces; not Make.md's relational Spaces engine | Partially implemented |
| Database schemas, relations, formulas, rollups | Need a Markdown/properties-compatible data model | Not implemented |
| Database tables, boards, calendars | Reuse existing local calendar and Longform boards; avoid replacing Bases | Not fully ported |
| Flow editor and inline transclusions | Existing Basic inline blocks remain separate | Not ported |
| Maker Mode / slash editing | First-stage formatting toolbar | Partial |
| Custom dashboards | Writing homepage | Partial |

No source code from Make.md or cMenu is copied. See THIRD_PARTY_NOTICES.md for credits and license terms.

## Release verification

Run npm run build, npm run check, npm test. Test formatting selections, mobile keyboard, context menus, renames/deletes, very large vaults, settings persistence, plugin hot reload, desktop 720p and smaller Android viewports. Test compatibility with Make.md, cMenu, Obsidian Bases and Folder Notes.

**Known limitation:** the Make.md relational database, Spaces, formulas, rollups and Flow Editor are not present. Keep Make.md and vault backups until feature parity is independently verified.

Previous stable version: 8.3.0.
