# Basic AI v5 — Keyboard and Markdown (development)

**Status:** Development branch. Stable release remains **4.3.1**. This branch has not been released or manually tested in Obsidian.

This implementation is original and takes the **Keyshots**, **Extended Markdown Syntax**, and **Pandoc Extended Markdown** community plugins as feature references. Their minified source files are not embedded.

## Keyshots: desktop navigation

14 editor commands: move and duplicate lines in either direction; insert lines above/below; delete, join and sort lines; change selection case (upper/lower/title); add cursor above/below.

Optional preset keymaps: **VS Code**, **JetBrains**, **None**. VS Code maps Alt+Up/Down to line moves, Shift+Alt+Up/Down to duplication, Ctrl/Cmd+Enter to insert below, Ctrl/Cmd+Shift+Enter to insert above, and Ctrl/Cmd+Alt+Up/Down to add cursors. JetBrains includes its own mapping subset. **None** disables preset bindings; all commands remain assignable in native Obsidian Hotkeys. Disabled on mobile.

## Extended Syntax

- Underline: ++text++
- Spoiler: ||text||
- Superscript: ^text^
- Subscript: ~text~
- Colored highlights: =={yellow}text==
- Custom spans: !!{note}text!!
- Simple fenced div: opening delimiter of three colons and a class name, then a standalone three-colon closing line.

Provides Reading mode transformations and Live Preview decorations, with settings for each grammar.

## Pandoc Syntax

- Alphabetic, Roman and auto-numbered lists: A. / iv. / #.
- Definitions: term followed by a line beginning with colon and a space.
- Numbered examples: (@id) description, with references in Reading mode.
- Custom labeled paragraphs: {::P} text.
- Restricted fenced div blocks using class, optional id and title.
- A command to navigate list-like structures in the active note.

Original Markdown source is preserved. The extension is not a complete Pandoc parser.

## Configuration

In Basic AI settings, **Modules** controls visibility of Keyshots, Extended Syntax and Pandoc Syntax independently. Separate settings tabs provide feature toggles. The deprecated Editing Toolbar and formatting commands are not restored.

## Known limitations

- Not complete parity with the original three plugins.
- No Pandoc executable integration, Lua filter execution, format export, DOCX/PDF preview or advanced sidebar yet. The Lua scripts supplied as references are not bundled.
- Fenced divs require a closing delimiter in this implementation.
- Some complex syntax combinations, code contexts, tables, callouts and nested blocks need additional testing.
- Changes to extension settings may require reopening the note to refresh existing decorations.
- Keyboard layouts and clashes with native Obsidian or other plugin hotkeys need desktop testing.

## Before publishing v5

- [x] Add three independent source modules.
- [x] Wire into Basic settings, module visibility, and build scripts.
- [x] Add initial automated regression tests.
- [ ] Run the full test suite and fix failures.
- [ ] Test desktop and mobile Live Preview and Reading mode.
- [ ] Review accessibility, performance and Obsidian plugin submission lint.
- [ ] Decide on the Pandoc export phase and publish release artifacts.
