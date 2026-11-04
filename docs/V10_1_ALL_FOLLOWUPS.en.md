# 10.1.0 — requested follow-up sweep (EN)

This reference tracks **all** areas requested after 10.0.0, with the implemented slice and remaining limits. The integrations are original implementations and do not copy upstream plugin code. Passing automated tests does not prove identical behavior on every Obsidian version, theme or Android WebView.

| Original reference | 10.1 implementation | Limitations / next validation |
| --- | --- | --- |
| Longform / StoryLine / BookNav | Per-tab scroll retention; moved chapter focus; touch-hold reorder grip | Longform remains the source of truth; verify deeply nested drag/drop on Android |
| weph Bookshelf | Manual progress, reading status, shelves/genres, favorites, series order, filters, pagination | No automatic e-reader page position or tracking from external book apps |
| s1m4ne Workspace Plus | Per-Space history with snapshots, rollback, layout JSON import/export, previous version preservation | Obsidian's \`changeLayout\` may behave differently with plugins or mobile pane types |
| Make.md Flow / Flexplorer / Custom Sorting | \`graph\` Flow, editable \`after\` relationships, bounded dependencies, additional sorting-spec patterns, descending numeric/YAML sorts | Not the full Make.md engine or entire sorting-spec grammar |
| Media Gallery View | Pages, multi-selection/copy links, local excerpts, video posters, native PDF support | PDF is opened natively; no cross-platform raster thumbnail engine |
| Falcion UNITADE.md | More source extensions, caret status, Tab indentation, save and conflict guard | Text/source editor only; no binary Office/EPUB editing |
| Lemon695 Enhancement Suite | YAML validation, table filters and safe CSV export, footnotes, batch YAML with opt-in confirmation and snapshots | Not every external enhancement is reproduced; bulk changes require explicit user action |
| Qwyntex DoubleShift | Choose same/left/right/either Shift, restrict to input context, ignore dialogs | Keyboard accessibility and conflict with system shortcuts vary by OS |
| Iconic / Pretty Properties / Folder Notes | Consistent UI controls and touch sizing in new components; legacy customization untouched | Requires visual QA for old themes and 720p layout |
| George-debug Timeline | Event IDs, eras, dependencies, bounded dependency sort and pages | Dependency visualization is not a full interactive relation graph |
| LanguageTool / Advanced | Project-scoped dictionary, option to accept a word for one book, viewport-constrained menus | Remote LanguageTool remains an external network service; Android popup must be tested on device |
| Harbor / Genkan / homepage | Named dashboard widget presets and keyboard rearrangement | Widget layouts are still HTML/CSS grid, not a full drag editor |
| Full Calendar | Local ICS exchange, duplicate detection, non-overwriting imports | **No automatic Google Calendar/Outlook OAuth sync** |
| Spaced Repetition | Configurable interval parameters, remembered deck, 7-day due forecast | This is a local SM-2-style algorithm, not Anki/FSRS compatibility |
| Pomodoro | Local session history, seven-day chart, task breakdown and CSV report | No cloud sync or background delivery when Obsidian is closed |
| Keyshots / Complements / Variants / Snapshots | Preserved unchanged; snapshots now protect batch property operations | Huge vault performance still merits profiling |
| Remember Cursor | Multiple Android scroll attempts canceled on touch/pointer or cursor motion | WebView layout races may still require device-specific adjustment |
| TTS / Soundscapes / Click Clack | Split native utterances into smaller chunks; pause soundscape and optionally resume | Native Android speech cannot be forced if WebView does not expose Web Speech; online TTS needs consent |
| Pandoc / Extended Syntax / Easy Typing | Existing syntax and transformations preserved; footnotes/CSV/YAML commands supplement workflow | Native Pandoc binary export requires PC installation; no guaranteed round-trip for every format |

## Safety, migration and compatibility

- Existing notes, Longform indices and old Markdown fences stay in place; no forced mass rewrite.
- Layout import/export changes **only workspace layout**, not note contents.
- Bulk frontmatter changes start disabled, require explicit confirmation, and create local version snapshots before editing.
- ICS reads a file from the vault and creates **new** calendar notes without overwriting existing notes.
- CSV exports escape formula-like values to reduce spreadsheet injection risk.
- Book reading progress is local editable metadata, separate from text and scene completion.
- Voice notes in fictional chat remain fictional; no real microphone transcription was added.

## Practical QA still required

Test on desktop and Android with themes, 720p viewport, editor dropdowns, nested Longform scenes, audio focus, keyboard shortcuts, LanguageTool interactions, ICS import/export and heavy folders. No source-only test can verify every platform-specific integration or external service.
