# Third-party notices and inspiration

The Basic AI Tool for Writers v3 implementation in `src/v3/` is independently
written for this project. It is inspired by the behavior and documented formats
of the following independent Obsidian community plugins. Their source code has
**not** been vendored or copied into the v3 modules.

- **Various Complements** — Tadashi Aikawa. MIT.
  https://github.com/tadashi-aikawa/obsidian-various-complements-plugin
- **VariantEditor** — Kunal Jain. The upstream LICENSE/README describe 0BSD;
  one package manifest has said MIT. Verify the upstream revision's license
  before reusing any of its source code.
  https://github.com/kunalJa/VariantEditor
- **Note Snapshots** — Aphasia. MIT.
  https://github.com/aphasialog/obsidian-note-snapshots
- **Edge TTS (Obsidian)** — travisvn and contributors. AGPL-3.0.
  The browser Edge Read Aloud protocol and UI are used as reference; no source
  code from this AGPL plugin has been copied or bundled here. Microsoft's
  endpoint is unofficial and can change.
  https://github.com/travisvn/obsidian-edge-tts
- **Longform** — Kevin Boeh and contributors. The project-index YAML format
  and workflow concepts inspired the compatible project manager.
  https://github.com/kevboh/longform

All names and trademarks remain with their respective owners. The separate
Basic AI local history store does not write to the original Note Snapshots
directory. Users should keep the original plugins and their data backed up
until they have verified compatibility for their workflows.


## v6/v7 writing and worldbuilding references

The v7 Compendium, Longform planner, timeline, folder-note affordances, scene sheets, tags, relationship explorer, image maps, and series manager are independent implementations developed for Basic AI Tool for Writers. Feature ideas and screenshots from community projects (including StoryLine, Storyteller Suite, Folder Notes, Make-a-Wiki, Avatar, and Tabbed) were used as **behavioral and visual references**.

Their JavaScript, CSS, images, bundled assets and documentation are **not** copied into, required by or redistributed with the Basic AI v7 plugin. Each reference plugin remains a separate project with its own license, maintainers, trademarks and capabilities.

**Compatibility note:** the v7 Folder Notes action recognizes common folder-note naming conventions and does not replace a dedicated Folder Notes plugin. Longform-compatible scene indexing and project compilation are not complete upstream Longform implementations. Back up any related plugin data before making major changes to a vault.

## v9 toolbar and Make.md-inspired native explorer

- **cMenu**, by chetachiezikeuzor, is under **Mozilla Public License 2.0**.
  https://github.com/chetachiezikeuzor/cMenu-Plugin
- **Make.md**, by JP Cen and contributors, is under **MIT**.
  https://github.com/Make-md/makemd

The v9 toolbar and native explorer modules are **independently written
implementations** inspired by the described workflows of these projects.
Their source code, images, UI assets and dependencies are **not** vendored
into Basic AI. Basic AI does not claim to be a complete Make.md fork.
For any future direct code reuse, original notices and applicable source
file licenses must be preserved and reviewed separately.

## v9 local calendar (Full Calendar references)

- **Full Calendar (original, archived)** — Davis Haupt and community contributors. https://github.com/community-archive/obsidian-full-calendar
- **Full Calendar Remastered** — https://github.com/obsidian-full-calendar-remastered/plugin-full-calendar

The original and Remastered calendar features and UI workflow were reviewed as **behavioral references** for the independent local Markdown calendar redesign. No FullCalendar Standard/Premium bundles, external connectors, assets or source code were copied. The Basic module does not provide Google Calendar or CalDAV sync.

## v9.1 desktop audio and explorer references

- **Soundscapes** — Andrew McGivery and contributors. MIT.
  https://github.com/andrewmcgivery/obsidian-soundscapes
- **Click Clack** — Acylation and contributors. MIT.
  https://github.com/Acylation/obsidian-click-clack
- **Flexplorer** — kh4f and contributors. MIT.
  https://github.com/kh4f/flexplorer

The v9.1 radio selection, desktop playback controls, WAV sound-pack
compatibility, and native Explorer enhancements are independently implemented
using upstream public behavior and user interfaces as references. The original
YouTube radio identifiers are documented playlist references; videos and audio
are never redistributed. No upstream WAV files, recordings, artwork, plugin
bundles, or proprietary browser assets are copied or shipped with Basic AI.
Users are responsible for using legal media streams and their own vault audio.
The Basic player is not a complete replacement for all upstream settings and
operating-system media integrations; it works with vault media and an embedded
YouTube player.

## v9.1.2 Virtual Content reference

- **Virtual Content**, by Signynt and contributors, is MIT-licensed.
  https://github.com/Signynt/virtual-content

The Basic AI virtual-content module is an **independent implementation** inspired by folder/tag/property matching, dynamic header/footer/sidebar templates and non-destructive rendering. No source code or assets from Virtual Content are vendored. The built-in Longform BookNav implementation is reused rather than replaced. Dataview and Obsidian Bases remain separate optional integrations; this module does not execute user-supplied JavaScript or dynamic Dataview queries itself.

## v9.2.0 reference projects

The following projects inspired independently authored Basic AI features. No source code or assets from them were copied or bundled.

- Favorite Note — https://github.com/mahmudz/obsidian-favorite-plugin (MIT)
- Multi-Column Markdown — https://github.com/ckRobinson/multi-column-markdown (GPL-3.0)
- Meta Bind — https://github.com/mProjectsCode/obsidian-meta-bind-plugin (GPL-3.0)
- ProgressBar — https://github.com/zwpaper/obsidian-progressbar (Apache-2.0)
- Obsidian Widgets — https://github.com/rafaelveiga/obsidian-widgets (GPL-3.0)
- Zotero Integration — https://github.com/community-archive/obsidian-zotero-integration (GPL-3.0)
- StyleMate — https://github.com/droidstreamer/stylemate (MIT)
- Session Notes — https://github.com/tabibyte/session-notes (MIT)
- File Preview — https://github.com/xhuajin/obsidian-file-preview (MIT)

These are limited independent implementations, not full upstream forks or API-compatible replacements. Zotero quotes use explicit highlights from local Markdown imports only. Session drafts do not automatically delete files.

### Click Clack sound packs (optional download)

Basic AI Tool for Writers offers an opt-in catalog of 13 original Click Clack WAV sound schemes. Audio is never bundled; files are downloaded on request from [Acylation/obsidian-click-clack](https://github.com/Acylation/obsidian-click-clack), revision 6d5b7f0 (release 0.1.2). The upstream code is MIT licensed and credits Writemonkey 3 as the origin of the sound schemes. Users should verify original sample rights before redistributing the audio.


## v9.5 Timeline blocks

- **Timeline**, by George Butco (George-debug) and contributors. MIT.
  https://github.com/George-debug/obsidian-timeline

The `timeline` and `timeline-labeled` Markdown syntax is based on the
public original README. Basic's rendering, parsing, horizontal/vertical
layout, themes, photos, icons and optional controls are independently
implemented. No upstream JavaScript, CSS or images were copied.

## Dragger (Ariestar)

The v10.6 block dragging feature is an original Basic implementation inspired by the public feature list of [Dragger](https://github.com/Ariestar/obsidian-dragger) (MIT-licensed). No source code or proprietary assets were copied or bundled. Full Dragger feature parity is not claimed.

## FSRS-4.5 and third-party APIs

The scheduling calculations in Basic 10.7 follow the published FSRS-4.5 equations and parameter defaults documented by [open-spaced-repetition](https://open-spaced-repetition.github.io/ts-fsrs/guide/model/fsrs-4dot5). This is an original integration and does not bundle the upstream library. Zotero Web API integration uses documented public v3 HTTP endpoints with explicit user activation; Zotero trademarks and web services remain those of their respective owners. The calendar subscription feature uses the standard iCalendar (.ics) format and user-supplied HTTPS feeds.

## Sidebar Manager and Editor Width Slider — inspiration (10.10.0)

[Sidebar Manager by koosolek](https://github.com/koosolek/obsidian-sidebar-manager) and [Editor Width Slider by MugishoMp](https://github.com/MugishoMp/obsidian-editor-width-slider) are MIT-licensed independent Obsidian plugins. Basic's implementation is newly written and **does not vendor their source files or images**. Their capabilities inspired optional sidebar view buttons, overflow/accessibility controls and a status bar/metadata-based editor-width feature. Sidebar Manager targets private UI structures from Obsidian 1.14; Basic intentionally avoids copying its DOM mutation and vault-switching internals. The Basic sidebar feature is opt-in, reversible and not a claim of full parity.

## Unique Suite, Notion Suite and Number Suite — inspiration (10.11.0)

This release adds newly authored Basic modules inspired by documented capabilities of three independently developed **MIT-licensed** Obsidian plugins. No upstream application source, icons, fonts, third-party dependencies or compiled bundles have been copied into Basic.

- [Unique Suite](https://github.com/Benhaman9/unique-suite) — Benjamín Alcalde (2026), MIT. Academic note capture, daily notes, reminders, class timetable and the academic dashboard concept. Basic deliberately reuses its existing calendar, study engine and optional iCalendar subscriptions.
- [Notion Suite](https://github.com/navysum/notion-suite) — craigstfn / navysum and contributors, MIT. Markdown-backed table, board, list, gallery, calendar, timeline and chart views. Basic's independent renderer uses `basic-suite-db` rather than taking over the original `notion-db` code block.
- [Number Suite](https://github.com/ZHYX91/obsidian-number-suite) — ZhengYX and contributors (2026), MIT. Visual heading numbering, navigable outline and confirmed preview-before-write operations. Basic implements a limited H1–H6 Reading View and single-note subset.

These are **feature integrations, not full ports**. In particular, the upstream Notion Suite and Number Suite use Obsidian APIs from newer releases than Basic's compatibility baseline. See `docs/V10_11_SUITES_SCOPE.pt-BR.md` for the implemented scope and missing functions. The original projects remain maintained separately.

## v12 toolkit and synchronization references (2026)

The v12 additions in `src/v12/unified-toolkit.js` are independent implementations of the documented user interactions and a **runtime command bridge**, not source-code copies or redistributed packages. **No upstream code has been vendored.** Each original project retains its copyright and license; install the original plugin separately to access capabilities delegated to it.

- Ultimate Toolkit / My Toolkit — Ahmed Moussa: https://github.com/ahmdmusa/obsidian-toolkit
- Visual Kit — pedrohf-dev: https://github.com/pedrohf-dev/visual-kit
- Snailkit — Arnaud Gastelblum: https://github.com/arnaudgastelblum/snailkit
- dropit Obsidian — smart-kits: https://github.com/smart-kits/dropit-obsidian
- Syncthing Integration — LBF38: https://github.com/LBF38/obsidian-syncthing-integration
- Syncthing Manager — Gustavo Carreiro: https://github.com/gustjose/obsidian-syncthing-manager
- Obsidian Git — Vinzent: https://github.com/Vinzent03/obsidian-git
- FIT (File gIT) — joshuakto: https://github.com/joshuakto/fit

Basic v12 does not include the external plugins' cryptographic, synchronization, pairing, or image-annotation engines. Do not confuse runtime command compatibility with complete feature parity.
