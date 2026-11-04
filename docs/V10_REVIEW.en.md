
# Version 10.0.0 — upstream review and future work

The code is original and built around Basic AI's existing modules. **Inspired by** does not mean **full plugin parity**. Do not assume an upstream feature exists unless it is listed here.

| Reference | Implemented in Basic | Further improvements |
| --- | --- | --- |
| Longform / StoryLine / BookNav / NoteChain | Projects, nested scenes, story beats, compilation, notes, navigation, timelines | Reliable drag-and-drop, scroll restore, more export previews |
| weph Bookshelf | Longform index covers, visual search, block renderer and homepage widget | Reading status/progress, genre shelves, series filters |
| s1m4ne Workspace Plus | Space-specific filters/widgets/sorts; opt-in save/restore of pane layout | Snapshot history, backups, profiles, undo and context matching |
| Make.md / Flexplorer / Custom Sorting | Flow blocks, slash entry, Spaces, previews, sorting | Complete Flow graph editor, full sorting-spec grammar, bulk operations |
| Media Gallery View | Images/video/audio/PDF/document tiles, local audio player | PDF thumbnails, file previews, batch changes, pagination |
| Falcion UNITADE.md | Text/code editor from file menu with explicit save and file-size guard | More code modes, read-only large-file view; **no binary DOCX/EPUB editing** |
| Lemon695 Enhancement Suite | Sort selected Markdown table rows, format selected JSON, insert callout | YAML validator, table filters, bulk property editing, PDF/HTML export |
| Qwyntex DoubleShift | Opt-in Double Shift command palette, configurable interval | Custom keys, left/right handling, context exclusions |
| Iconic / Pretty Properties / Folder Notes | Icons/colors, cover/banner, properties, Folder Note previews | Accessibly-sized touch controls, predictable DOM lifecycle |
| George-debug Timeline | Horizontal/vertical blocks, themes, images, fictional events | Dependencies, event virtualization, era-aware scales |
| LanguageTool / Advanced / original LanguageTool plugin | Grammar, paragraphs, hover/caret suggestions, optional external bridge | Android positioning, local dictionary synchronization |
| Harbor / Genkan / Widgets | Responsive homepage, fuzzy search, quotes, gallery, recents, books | Widget virtualization, accessibility of reordering |
| Full Calendar / Spaced Repetition / Pomodoro | Calendar, studies, timer, desktop status bar | Calendar sync, scheduling controls, focus analytics |
| Keyshots / Complements / Variants / Snapshots / Remember Cursor | Keyboard editing, suggestions, variants, snapshots, cursor memory | Android cursor restoration and scaling vault index |
| TTS / Soundscapes / Click Clack | Reader, radio, typing sounds | Cross-platform TTS, audio focus on Android |
| Extended Syntax / Easy Typing / Pandoc | Markdown/typography tools, optional export | Wider syntax compatibility and verified conversions |

## Remaining validation

Automated source checks cannot replace practical testing in Obsidian Desktop and Android. Prioritize small 720p screens, light/dark themes, settings navigation, long presses, LanguageTool touch popovers, code-fence rendering, workspace restoration and large-vault performance.

## Roadmap candidates

- 10.0.x: fix runtime/mobile regressions and finish every remaining PT/EN tooltip.
- 10.1: PDF/document thumbnails, richer Gallery filters and lazy rendering.
- 10.2: versioned Space layout snapshots, diff, backups/import/export.
- 10.3: bookshelf reading metadata, stronger grammar profiles and index optimization.

These roadmap items are **not** part of the 10.0.0 delivered scope.
