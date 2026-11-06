# Suites and integration guide · Basic 12.0.1

This document describes features **actually implemented in Basic**, rather than claiming the original plugins were copied in full. Existing vault content and settings remain in place.

## Settings navigation

Open **Obsidian Settings → Basic**. Recent features now have separate top-level **Toolkit v12** and **Suites** categories rather than being appended to Files & shortcuts.

| Category | Subsections |
| --- | --- |
| Toolkit v12 | Overview, Writing & shortcuts, Images, Tasks & inbox, Privacy, Reading & voice, Integrations & sync |
| Suites | Unique Suite, Notion Suite, Number Suite, Longform Studio |
| Interface | Homepage, file explorer, visual properties, toolbar, sound and styles |
| Organization | Spaces, calendar, Flow, Pomodoro, session drafts, visual lock and files |
| Writing | Markdown, widgets, typing, linter, templates and navigation |
| Longform | Projects, bookshelf, tasks, BookNav, virtual content and worldbuilding |
| AI & dictionary / Review | Models, providers, prompts, grammar, TTS and versions |

You can search settings for terms like *numbering*, *task*, *encryption*, *sync*, *image* and *subscript*.

## Suites integrated in versions 10.11 and 11

| Original project | Basic's implemented features | Scope limit |
| --- | --- | --- |
| [Unique Suite](https://github.com/Benhaman9/unique-suite) | Academic center, class notes, daily entries, reminders, semester/folder schedules, and timetable blocks | Not a full copy of the source workflow; no automatic vault restructuring |
| [Notion Suite](https://github.com/navysum/notion-suite) | Markdown-driven table, board, gallery, list, calendar, timeline and chart views; properties, filters, sort, grouping, limits and a visual view-block builder | No proprietary database; not complete Notion parity |
| [Number Suite](https://github.com/ZHYX91/obsidian-number-suite) | Heading/number outline, explicit write/remove numbering, hierarchical scheme, optional Live Preview number decorations, figure/table/equation/code caption counters and footnotes | Visual-only mode does not rewrite original headings |
| **Longform Studio v11** (Basic extension) | Continuous editing inside the original Longform view, chapter search, editorial review, manuscript compilation and compatibility diagnostics | No separate project manager or duplicate homepage widget |

## Version 12 toolkit and eight companion projects

| Reference | Implemented in Basic | Requires the original plugin |
| --- | --- | --- |
| [Ultimate Toolkit](https://github.com/ahmdmusa/obsidian-toolkit) | 65-action palette, callouts, dividers, templates, folder focus, reused Basic AI/TTS, selected-document text reader, individually encrypted new notes | Whole-folder encryption, concealed search/filenames, full bilingual PDF/HTML TTS and complete image HUD |
| [Visual Kit](https://github.com/pedrohf-dev/visual-kit) | Image viewer, confirmed width normalization and a local pen/arrow/rectangle/text/area-cover annotator exporting a new PNG | Advanced HTML editor, rich paste/copy and file deduplication. Upstream Visual Kit is desktop-only |
| [Snailkit](https://github.com/arnaudgastelblum/snailkit) | Tag-grouped task Workbench with safe checkbox edits, Inbox, brainstorm, extract selection into linked note; reused Basic search/calendar | Full upstream Workbench, editing toolkit and exporters |
| [dropit](https://github.com/smart-kits/dropit-obsidian) | Local Inbox capture and external command discovery | Device pairing, transport and automatic receipt |
| [Syncthing Integration](https://github.com/LBF38/obsidian-syncthing-integration) | External command detection/manual dispatch and local conflict inspection | Syncthing API and sync engine |
| [Syncthing Manager](https://github.com/gustjose/obsidian-syncthing-manager) | Same manual hub and read-only local conflict viewer | Remote status, versioning, merge and server operations |
| [Obsidian Git](https://github.com/Vinzent03/obsidian-git) | Manually dispatches available commands of the installed Git plugin | Git implementation, push/pull, history |
| [FIT](https://github.com/joshuakto/fit) | Manual provider selection and dispatch to installed FIT commands | GitHub synchronization and remote conflict handling |

## Ribbon actions and mobile menus

Basic retains its own Assistant, Projects and Tools shortcuts. Version 12.0.1 adds one **Basic: quick actions** icon for read-aloud, formatting, focus screen, folder focus and the integration center. The separate **Read Aloud**, **Formatting Palette**, **Fullscreen Note** and **Focus on current folder** shortcuts from the Ultimate Toolkit are owned by that other plugin; modifying Basic cannot directly fix its handlers.

The Basic mobile sidebar now delays native **More options** actions until the first sheet has dismissed. Its **Bookmark** item prefers a registered Obsidian Bookmarks command, or relays the original native button. Long-pressing a panel icon can pin, close or close other non-pinned panels.

## Safety

Per-note AES-256-GCM encryption is opt-in and does not conceal filenames or secure entire folders; passwords cannot be recovered. Image annotation exports a new file and does not delete the unredacted original. Selecting one sync provider in Basic does not disable auto-sync in other installed plugins: configure a single background sync strategy. Desktop/Android hands-on UI testing remains valuable beyond the automated checks.

See [v12 coverage](V12_SCOPE.pt-BR.md) and [security](../SECURITY.md).
