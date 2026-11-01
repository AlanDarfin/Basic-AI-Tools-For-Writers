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
