# basic — release history

Version notes live here; README documents features and examples.

## 10.9.0 — Books and interface

- Standalone books, automatic progress, description and copyright.
- Fuzzy search, command cleanup, shorter name, and tab overflow fades.


## Version 10.8.0 — cleaner UI and restored advanced integrations

- **Ribbon:** removed the redundant Basic quick-actions popup and extra Books/Spaces ribbon entries; the commands and Spaces explorer dock remain.
- **Related Notes:** sidebar panel only, with responsive non-overlapping cards, readable titles, truncated paths and a clear link action. Removed its Homepage widget.
- **Trash:** Homepage widget only, with refresh, restore, confirmed deletion, expansion and confirmed empty. Old restored Trash sidebars are detached; no new sidebar can be opened.
- **Books widget:** connected the previously missing renderer, fixed widget allowlist and saved layouts, and displays up to four favorite/recent Longform books with covers and progress. The widget becomes visible after migration.
- **Bookshelf:** redesigned responsive library cards, labelled status/progress/shelf controls, and filled favorite stars matching the icon configured in File Explorer.
- **Advanced features restored:** re-enabled all nine 10.7 source modules (Make.md-like databases, Zotero API, ICS, FSRS, StoryLine graph, JSON/YAML editors, local speech and cross-note block movement). Initialization is deferred and individually isolated; the compatibility switch lets users disable the group without losing settings.
- **Activation guard preserved:** the 10.7.3 `setIcon` fix remains, and startup smoke tests were expanded. External Zotero/ICS connections are opt-in; no automatic manuscript upload.
- [Full UI and integration audit](docs/V10_8_UI_REVIEW.pt-BR.md). Runtime UI testing in Obsidian desktop/Android is still recommended.

## Version 10.7.3 — fix plugin activation (`setIcon`)

- **Root cause confirmed by the Obsidian console:** `ReferenceError: setIcon is not defined` during `writerV106DragRegister` in the 10.6 Dragger-inspired integration.
- Fixes the Dragger startup icon to import `setIcon` directly from Obsidian's API, with a text fallback if the API is unavailable.
- Fixes five more missing `setIcon` references in the Related Notes and Trash Explorer sidebar/widgets, preventing the next error after activation.
- Each optional editor/UI module is now registered in an isolated error boundary, so a supplementary tool cannot disable the whole writing plugin.
- Adds **executable startup regression tests** that reproduce the Dragger icon creation using a minimal Obsidian API mock, verify its fallback, check related-note icons, and verify errors cannot stop the core commands.
- Keeps existing notes, settings, Longform, homepage, language tools, toolbar and pre-10.7 features. The nine experimental 10.7 modules remain quarantined from the production bundle, as in 10.7.2.
- Install all three matching release assets (`main.js`, `manifest.json`, `styles.css`) and restart Obsidian. No need to delete `data.json`.

## Version 10.7.2 — emergency stable-runtime recovery

- **Activation first:** production `main.js` restores the last known stable pre-10.7 module set while retaining all prior features, including homepage, Longform, LanguageTool, reading progress, settings, Dragger-inspired block controls, Zotero imported-note support and related-note/trash widgets.
- **Safe quarantine:** the nine advanced 10.7 integration sources (new databases, Zotero Web API, FSRS, remote ICS, relationship graph, advanced editor, local Web Speech, cross-note move and optional integration registry) remain in the Git repository, **but are not included in the shipped bundle** until the cause of the activation failure can be reproduced in Obsidian.
- No user data, settings migration or plugin ID changes. This release contains a smaller, reduced-risk `main.js` with the original features preserved.
- Full regression checks now confirm that experimental modules are absent from the production bundle, all legacy modules remain, and no optional network calls are unexpectedly active.
- **Status:** runtime Obsidian activation still requires validation on real desktop and Android installations. If installation fails, see [recovery guide](docs/V10_7_2_STABLE_RECOVERY.pt-BR.md) and provide the first console error without private data.

## Version 10.7.1 — activation recovery and safe initialization

- **Critical activation fix:** previous v1–v10 modules load before optional 10.7 integrations. The new modules register only after the workspace is ready and cannot abort Basic's main startup if one fails.
- **Preserved functions:** no legacy source module removed; verified core, Longform, homepage, grammar, toolbar, study, calendar and writing tools remain bundled.
- **Partial update recovery:** guards protect optional module references when release files are mismatched or a component is unavailable.
- **Compatibility switch:** disable advanced 10.7 integrations in Settings, restart Obsidian, and retain all previous features and saved settings.
- Added dedicated regression tests for missing modules, isolated failures, deferred startup, unload cleanup and legacy module presence. The actual user-side error trace is not yet available, so this fix still needs confirmation on Android and desktop.
- See [activation recovery and reinstall instructions](docs/V10_7_1_ACTIVATION_RECOVERY.pt-BR.md). Always install `main.js`, `manifest.json` and `styles.css` from the **same** release.

## Version 10.7.0 — advanced integrations

- **Make.md:** Markdown databases with table/board views, sorting, filtering, safe formulas and linked-note rollups; property editing and CSV export.
- **Zotero:** optional read-only Web API v3 library import, temporary per-request key and CSL JSON export; imported note and Better BibTeX features remain available.
- **Calendar:** opt-in read-only HTTPS ICS subscriptions with deduplicated append-only import and optional periodic checks.
- **Study:** choose FSRS-4.5 or existing SM-2, plus Anki-compatible TSV import/export.
- **StoryLine:** interactive, repositionable relationship graph and explicit links between compendium notes.
- **Enhancement Suite:** preview-confirmed batch find/replace with snapshots, live YAML diagnostics, and editable JSON tree for selected content.
- **Dragger and media:** safe cross-note block transfer, responsive Markdown columns, navigable PDF page previews with native-viewer fallback.
- **Accessibility:** OS speech synthesis with voice/rate controls and additional LanguageTool popup scroll protection.
- [Integration audit and remaining gaps](docs/V10_7_INTEGRATIONS_AUDIT.pt-BR.md). OAuth/CalDAV bidirectional sync, actual PDF page raster thumbnails and Anki .apkg are **not** implemented.

## Version 10.6.1 — formatting toolbar in Reading view

- Hide the Basic custom formatting toolbar when a Markdown note is in **Reading** mode, on both desktop and mobile.
- Show it again when returning to Source/Live Preview editing, without changing customization or toolbar position.
- Detect changes to the active Markdown view without requiring the user to close/reopen the note; release observers when the plugin unloads.

## Version 10.6.0 — clean home sessions, block dragging and historical integrations

- **Session reset:** optionally start every new Obsidian session with exactly one Home tab, discarding restored **main tabs only**. This is enabled by default; sidebars, notes, and layout settings stay intact. Plugin updates/hot reloads cannot trigger a reset. A confirmed manual cleanup command is included.
- **Dragger-inspired editor controls:** drag paragraphs, headings, list items (with children), tasks, quotes/callouts, tables and fenced code; multi-line selections, nested list indentation, drop indicators, mobile long-press, configurable handle icon/color/size/offset, keyboard move commands and block-type menu. The original Dragger is detected to prevent competing handles.
- **Recovered v1 dictionary path:** optional inspector can link a valid Markdown dictionary note from the legacy Alan's Offline Dictionary settings without importing API keys or deleting old files.
- **Enhancement Suite follow-up:** inspect selected JSON as a bounded, read-only expandable tree.
- **Audit:** See [v1–v10 integration report](docs/V10_6_HISTORICAL_AUDIT.pt-BR.md) for functions present, partially implemented and still absent. Includes Make.md, Zotero, calendar, TTS and media limitations.
- No third-party plugin source is bundled. A real Android and desktop acceptance test is still needed for gestures and theme variations.

## Version 10.5.0 — research, recovery and reading

- Discover related notes locally with a similarity index, sidebar, homepage widget and one-click Markdown links.
- Explore Obsidian's internal `.trash`: restore without overwriting, delete with confirmation and optionally empty the trash.
- New homepage widgets: related notes, trash, note reading statistics and imported Zotero sources.
- Curated public-domain philosopher and writer quotations without overriding personalized quote lists.
- Improved Zotero imported metadata and an insert-citation dialog using Better BibTeX citekeys (`[@key]`) or a note link.
- Fixed reading-progress indicator in source and Reading views; configurable accent color and height.
- No direct Zotero sync, OS trash access or claims of full parity with reference plugins.

## Version 10.4.10 — grouped settings search, Android layout fix

- Rebuilt settings results as native-looking, self-contained rows instead of generic buttons, preventing conflicts with Obsidian themes and CSS snippets on Android.
- Repeated options such as **Subscript** or **Underline** appear once, with separately selectable destinations for **Formatting toolbar** and **Extended Syntax**. Every destination supports tap/click, Enter and Space.
- Removed redundant, conflicting search CSS from previous updates; result panels are compact, scrollable and independent of the internal settings container. Other controls, toolbar customization and alignment syntax are unchanged.

## Version 10.4.9 — compact settings and Markdown justification

- **Settings search results:** full-width, compact rows with small icons and readable section labels rather than narrow centered dark buttons; improved sizing and scrolling on Android.
- **Toolbar controls:** replace the oversized generic mobile dropdown/slider/color-picker rows with consistently spaced controls for Style, Button size, Placement and Colors. Keep all existing settings and functions.
- **Justification:** use the same short Markdown suffix syntax as other alignments: `Paragraph {j}` or `## Heading {j}`. Live Preview, Reading View, toolbar and command palette share the same implementation; no HTML wrapper is inserted. Older `{c}`, `{l}`, `{r}` and legacy notation still work.

## Version 10.4.8 — customizable editing toolbar and precise settings search

- **Editing toolbar:** keep the existing Markdown buttons, with additional indent/outdent, left/center/right and justified alignment, text color and background highlight. The Basic toolbar remains opt-in on mobile and never replaces Obsidian's own toolbar.
- **Customization inspired by Editing Toolbar:** add any command exposed by Obsidian or another installed plugin; customize button names and Lucide icon IDs; build named group submenus; drag or use up/down arrows to reorder buttons. Set Tiny, Compact or Comfortable density, icon labels, size, and color presets.
- **Placement:** top or bottom, plus optional Follow cursor on desktop (falls back to the bottom on mobile).
- **Settings search:** search by individual option instead of only categories. It indexes displayed settings, previously visited tabs, and the built-in formatting actions even before their list is expanded. The Portuguese alias `subescrito` finds `Subscrito`; selecting a result opens its section and highlights the corresponding control.
- **Settings layout:** compact search results, theme-aware input fields and buttons, horizontally scrollable navigation tabs, and reduced visual clutter at mobile widths.

## Version 10.4.7 — compact mobile Explorer and optional ordering controls

- **Compact mobile files:** manual-sorting arrows are no longer rendered across every file or folder row during normal browsing. Folder notes, favorite stars, images, descriptions and custom file icons remain intact.
- **Reorder only when needed:** in Obsidian's native **Sort** menu, select **Reorder items on mobile (Basic)**; alternatively use the command-palette shortcut **Explorer: toggle mobile reorder mode**. This temporary mode shows small overlay arrows without expanding row heights. Toggle it again to return to normal browsing; the mode starts off after each plugin reload.
- **Order preserved:** exiting the mode hides only the controls, never modifies, moves or deletes vault files or stored manual order. CSS stays compatible with Obsidian community lint requirements.

## Version 10.4.6 — compact LanguageTool corrections and stable review scrolling

- **LanguageTool suggestions:** compact, scrollable desktop correction menus, smaller icons, denser replacement rows and a tighter floating review popover, while retaining touch-friendly minimum sizes on mobile.
- **Typewriter and Remember Cursor:** neither feature moves the editor when a LanguageTool popup or correction menu is open, hovered or clicked. Pointer interactions suspend recentering; actual typing, input composition and arrow/navigation keys resume it.
- **Keep your viewport:** applying a correction with the mouse briefly preserves the visible CodeMirror scroll offset, even if the caret remains on a different line. Pending cursor-restoration timers are cancelled without erasing saved bookmarks.
- **Safety and compatibility:** ordinary note edits, keyboard navigation and language-review actions are preserved, with dedicated regression coverage.

## Version 10.4.5 — timeline visual presets and complete AI context grouping

- **Context menu:** organize AI tools at menu-display time, after other editors have registered actions, so Translate, Meaning, Synonyms, Antonyms and Rewrite appear under **AI · Tools** instead of duplicating in the root. Lookup/Translation and Writing/Revision have distinct Lucide icons; original actions and other plugins are kept.
- **Timeline:** restore visual distinctions from George-debug's original `line-2` to `line-5` and `body-2` to `body-4` styles (rings, solid dots, dashed rails, diamonds, panel/flag/accent borders), including all eleven upstream `active-color-*` tokens and `spaced-lines` / `hide-titles`.
- **Named themes:** Minimal is now open, unboxed prose; Compact uses dense rows with inline date and title. Cards, Classic and Editorial remain, joined by Poster, Glass and Terminal. The Timeline toolbar offers live theme, line and card selectors without changing the Markdown source.
- **Compatibility:** preserves image events, horizontal/vertical layouts, metadata links, groups, search and old code fences. Includes automated syntax and regression tests.

## Version 10.4.4 — context menus, double-press hotkeys and Homepage navigation

- **Editor context menu:** AI actions are grouped into lookup/translation and writing/revision submenus where Obsidian's menu API supports it; the Basic's extra text-formatting and alignment actions are available inside Obsidian's existing **Format** submenu. Native and third-party actions remain intact if they cannot be safely grouped.
- **Configurable double-press keys:** replace the single Double Shift configuration with a dedicated expandable shortcut manager. Add multiple key-to-command bindings, choose a command from a searchable list, set editing contexts, and remove or disable individual bindings. Existing Double Shift preferences migrate automatically. Letters/digits/Tab/Space cannot trigger while editing text.
- **Homepage:** on desktop, the search field gains focus when the Homepage opens (not on every rerender). Opening a note from search, recent notes or widgets replaces the Homepage in the same tab instead of creating a new tab; mobile does not autofocus.

## Version 10.4.3 — root sorting and a single native control

- **Vault root:** root folder keys `/` and `(empty)` are treated as the same folder. Manual order now renders through the native File Explorer sorting method, rather than conflicting with a second CSS-order pass.
- **Single sorting control:** choose sorting from Obsidian's existing **Change sort order** toolbar button. Its built-in sort options apply globally, while Basic adds Manual sorting, Number in title, YAML property and Folders first. Any option selected there affects **all folders**, including the root.
- **Clean context menus:** remove `Sort this folder`, `Move earlier` and `Move later` from file context menus. Pinning, hiding, icons, previews and other actions are unchanged. Mobile inline reorder controls remain available in manual mode.
- **Spaces shortcuts:** sorting shortcuts in the Spaces sidebar point to the same native Explorer button. Existing per-folder custom orders are preserved and used when the global Manual option is chosen.

## Version 10.4.2 — safer Explorer sorting, mobile Spaces and bookshelf

- **Manual sorting:** moving a note up/down no longer reparents Obsidian's native File Explorer DOM nodes. The plugin applies visual CSS order without renaming, deleting, or moving vault files and restores original styles on unload.
- **Spaces sidebar:** keep the Space tabs visible while scrolling the note list independently, with a count and buttons for new Space, Longform bookshelf and sorting the current folder.
- **Bookshelf:** add interactive sorting and responsive single-column cards for narrower screens; improve reading-status, percentage and shelf controls, with a direct ribbon shortcut.
- **Fictional voice notes:** generate a different waveform-height and animation pattern for each rendered message; no audio is generated or fetched.
- **Shortcuts:** add palette commands for switching Spaces, quick pinning, sorting the current folder, and a compact Basic quick-actions ribbon menu.
- **Personal CSS:** the separate optional `Basic-Compat-Unificado-v2.css` snippet preserves the user's previous styles while adapting subtitle alignment, heading overrides, Spaces and bookshelf.

## Version 10.4.1 — heading alignment and easier controls

- Align **headings (H1–H6) and paragraphs** while preserving native Markdown. Use a short end-of-line suffix: `# Chapter {c}`, `## Subtitle {r}` or `Text {l}`. Suffixes are hidden in Reading View, and outside the active Live Preview line when enabled.
- Use Left, Center, Right or the new **Cycle line or heading alignment** command. Assign them to desktop hotkeys or add them to the Obsidian mobile toolbar; they operate on the current line and preserve heading markers.
- Legacy `::c: text` and `::c[text]` remain supported. Commands can convert old notation into the short suffix without losing Markdown headings.
- Explicitly aligned headings override blanket heading-centering CSS snippets while unmarked headings retain your usual style.

## Version 10.4.0 — native Explorer sorting, Spaces and audio polish

- **Explorer:** custom folder order is now applied through a guarded native sorting adapter when supported; a DOM fallback remains for other versions. Global hiding also covers folder descendants and is synchronized on native explorer renders.
- **Manual sorting:** drag notes/folders into position inside a custom-sorted folder without requiring Alt by default; an optional Alt modifier and a drop indicator are available. Existing mobile arrow controls remain available.
- **Spaces:** selecting a Space activates its independent state, curated collections can sort by inclusion order, and the manager searches up to 5,000 results with pagination. Add the current note from the note context menu.
- **Fictional chat:** center the play/pause icon inside voice-note circles.
- **Enhancement Suite:** choose the thickness and accent/hex color of the existing Reading View progress line.

## Version 10.3.0 — Explorer, Spaces and alignment fixes

- **Alignment:** use `::l: text`, `::c: text` or `::r: text` on their own line; no square brackets required. Old bracket syntax is still recognized for compatibility.
- **Explorer:** better sized desktop toolbar; remove redundant preview-expansion and icon-grid name hover labels.
- **Spaces:** access the manager via a mobile ribbon button; remove per-Space file hiding while preserving global explorer hiding.
- **Sorting:** dedicated manual folder sorting, reset and drag toggle commands; the existing custom sort uses Alt + drag on desktop.
- **Reading:** optional progress line in the Reading View when the Enhancement Suite is enabled.

## Version 10.0.0 — consolidation, not a rewrite

- **Fictional chat audio:** if a written transcription is present, it appears immediately below the animation, with no show/hide button. This is not speech recognition.
- **Longform bookshelf:** a visual library of existing Longform book indices and covers, a compact **Books** homepage widget, and a Markdown bookshelf block. Chapter counts are not reading progress.
- **Spaces:** optionally save and restore pane layouts per Space; automatic saving and restoration are separate and off by default. Existing filters, icons, sorting, independent widgets and dock remain intact.
- **Gallery:** adds **Documents** to existing image, video, audio and PDF types. DOCX/EPUB open using the app's native handler, not as editable rich-text files.
- **Text editor:** explicit Save, conflict detection and 512 KiB limit for supported source and plain-text formats; binary files are not edited.
- **Writing utilities:** opt-in Double Shift to launch the command palette; table-row sorting, JSON selection formatting and callout insertion.
- **Settings:** groups are now General, Customization, Workflow, AI & Dictionary, Longform, Writing & Markdown, and Review & Reading.

See the [v10 feature-by-feature audit](docs/V10_REVIEW.en.md), [current/legacy block guide](docs/BLOCKS.en.md) and [Portuguese documentation](docs/README.pt-BR.md). These are independent integrations inspired by other plugins, not claims of full upstream equivalence.


## Mobile Spaces, properties, chat and images · 10.2.0

**Spaces:** responsive mobile note cards, left-aligned names, truncated paths, view switches and pagination instead of an overflowing two-column grid.

**Pretty Properties:** native row actions (⋯) hide a property in one note or all notes, assign a per-property icon and reveal hidden fields without deleting YAML data.

**Fictional chat:** compact WhatsApp-style author-written voice transcripts, independent speaker bubble colors and transparent conversation background. It does not record or transcribe real audio.

**File previews:** banner/cover/thumbnail properties, local embeds and explicitly linked HTTPS images (remote loading can be disabled for privacy).

**Image search:** Wikimedia Commons without a key; optional direct Pexels, Pixabay and Unsplash APIs with the user's own keys, no third-party search proxy. Save photos into the vault or insert a URL, including into frontmatter.

**Text alignment:** line-anchored non-codeblock syntax ::l[text], ::c[text], ::r[text], preserving Markdown bold/italics without conflicts with pipes or link slashes.

[10.2 detailed guide](docs/V10_2_MEDIA_AND_EDITOR.en.md) · [Markdown syntax](docs/BLOCKS.en.md)

## Expanded writing workflows · 10.1.0

This update extends the existing v10 foundation **without rewriting projects, migrating notes destructively or removing legacy syntax**. Settings and features are bilingual (PT/EN), and optional actions remain opt-in where they change many files or rearrange the workspace.

- **Longform:** less disruptive chapter-panel scroll and focus, desktop drag handle and a touch-hold-to-select destination workflow on mobile.
- **Bookshelf:** local reading progress (0–100%), planned/reading/paused/finished statuses, shelf/genre labels, favorites, filtering, series/progress ordering and pagination. Progress is a manual book record, not inferred from chapter count.
- **Spaces/Workspace:** per-Space versioned layout checkpoints with restore, JSON export/import, bounded history and preservation of the previous layout before overwrites. Layout switching may reorder tabs; confirm before restoring.
- **Flow/Explorer:** graph layout and note dependencies using \`after:[[Note]]\`, cycle-bounded depth, and expanded sorting-spec patterns/numeric and property descending options.
- **Media Gallery:** incremental pages, multi-selection, copying vault links, lightweight document excerpts, video metadata previews, and native PDF/document opening. Full PDF page rasterization and office document editing are not included.
- **Files/Enhancement Suite:** extended source file extensions, editing status (line/column), Tab indentation, YAML validation, filtered Markdown table preview, guarded CSV export, footnotes and opt-in batch frontmatter edits backed by Snapshots.
- **DoubleShift:** choose same/left/right/either Shift, trigger context and modal exclusions; feature stays disabled until enabled.
- **Timelines:** eras, dependencies, dependency ordering and paginated event rendering.
- **LanguageTool:** book-local accepted words, optional additions from suggestion menus, and clamped popup position; other projects retain their own dictionaries.
- **Homepage:** named widget layout presets, keyboard arrows on widget handles and explicit Books widget metadata.
- **Calendar:** offline import and export of local \`.ics\` files with confirmation and duplicate detection. **No live Google Calendar synchronization.**
- **Study and Pomodoro:** configurable repetition intervals, review forecast and remembered deck; focus history, weekly chart, task counts and CSV report.
- **Cursor and audio:** mobile cursor restoration retries that stop upon interaction; chunked native TTS and optional Soundscapes audio focus. Native TTS availability still depends on the WebView.
- **Markdown:** extended source editing and editorial commands, keeping existing Pandoc, Keyshots, variants, typewriter and syntax tools.

See the [complete v10.1 feature/compatibility review](docs/V10_1_ALL_FOLLOWUPS.en.md) and [current and legacy blocks](docs/BLOCKS.en.md). Most new actions are available in their existing settings tabs and via the command palette.

