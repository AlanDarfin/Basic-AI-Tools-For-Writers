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
- **Longform** — Kevin Boeh and contributors. The project-index YAML format
  and workflow concepts inspired the compatible project manager.
  https://github.com/kevboh/longform

All names and trademarks remain with their respective owners. The separate
Basic AI local history store does not write to the original Note Snapshots
directory. Users should keep the original plugins and their data backed up
until they have verified compatibility for their workflows.


## V4 plugin inspirations and supplied reference files

The following v4 features were independently implemented in the modular Basic AI
code; their original compiled JavaScript bundles were examined as references,
not incorporated verbatim into the release or build:

- **Abbreviation** — typing-space expansion, editable entries, per-entry enable
  and case sensitivity (supplied main(2).js).
- **Another Name** — frontmatter secondary title after the inline title
  (supplied main(3).js).
- **View Mode** — prefer-view frontmatter behavior (supplied main(4).js).
- **Homework Manager** — lists, subjects, deadlines and tasks adapted as a
  Longform tab (supplied main(5).js).
- **Insta TOC** — live headings from Obsidian metadata with auto-synchronized
  Markdown code blocks (supplied main(6).js).
- **Unicode Search** — symbol lookup and favorites (supplied main(7).js);
  https://github.com/BambusControl/obsidian-unicode-search
- **Template by Note Name** — same-named templates for new notes. A separate
  corresponding source bundle was not included, so implementation follows
  the described expected behavior independently.
- **Text-to-speech** — built on the browser/OS Web Speech API; no bundled
  AI model or proprietary speech assets.

Source ownership, names and trademarks remain with their respective authors.
These integrations are not guaranteed to reproduce every undocumented option
or import another plugin's private saved-data schema. Preserve your original
plugins and archives while verifying interoperability.
