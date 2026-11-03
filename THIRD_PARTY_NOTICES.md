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
