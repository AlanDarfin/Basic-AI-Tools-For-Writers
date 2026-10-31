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
- Optional desktop Pandoc executable export is now implemented for DOCX, HTML, EPUB, ODT, plain text, LaTeX and PDF (the PDF target can require additional LaTeX installation). Executing arbitrary Lua filters, interactive PDF/DOCX previews and a full native Pandoc AST/sidebar remain out of scope. The Lua reference scripts are not bundled.
- Fenced divs require a closing delimiter in this implementation.
- Some complex syntax combinations, code contexts, tables, callouts and nested blocks need additional testing.
- Changes to extension settings may require reopening the note to refresh existing decorations.
- Keyboard layouts and clashes with native Obsidian or other plugin hotkeys need desktop testing.

## Before publishing v5

- [x] Add three independent source modules.
- [x] Wire into Basic settings, module visibility, and build scripts.
- [x] Add initial automated regression tests.
- [x] Run the full test suite and fix automated failures (GitHub Actions checks).
- [ ] Test desktop and mobile Live Preview and Reading mode.
- [ ] Review accessibility, performance and Obsidian plugin submission lint.
- [ ] Decide on the Pandoc export phase and publish release artifacts.


## Easy Typing (new v5 module)

The Basic integration implements a focused, independent subset of the reference Easy Typing plugin, without copying its minified bundle:

- **Tab out of paired delimiters** in the active editor (parentheses, brackets, quotes, wiki links, inline-code ticks and common Markdown delimiters). The keymap yields to normal Tab when not applicable.
- **Smart paste in lists and blockquotes**, adding the current marker to subsequent pasted lines while preserving already-marked lines.
- **Smart Backspace** to remove an empty list/quote marker instead of leaving stray Markdown punctuation.
- Optional **sentence capitalization**, **CJK/Latin spacing**, and **literal text replacement** rules. Rules are limited to safe source/replacement pairs, not scripts or regex execution.
- Explicit commands to format a selected passage or line, remove extra blank lines from a selection, wrap selected text in a code fence, toggle Obsidian comments and select the current paragraph.
- Optional formatting on paste and path-based exclusions.

The full upstream scripted rule engine and language-specific formatting system are **not** copied. Instead, v5 includes **opt-in bounded regex substitutions**, case-insensitive/Unicode flags, a JSON-lines snippet editor, a searchable template picker and navigable numbered Tab stops with a final cursor marker. Arbitrary JavaScript execution and direct copying of third-party bundles remain deliberately unsupported. Advanced codeblock commands and mobile IME behavior still require manual testing. Automatic changes are guarded against recognized inline code, links, URLs, frontmatter and fenced code; unusual nested Markdown should still be tested.

## Smart Typography (new v5 module)

Uses the same safe transaction pipeline as Easy Typing but can be enabled independently:

| Input | Output, when enabled |
| --- | --- |
| Straight quotes/apostrophes | Smart opening/closing quotes |
| Two hyphens | Em dash, or en dash if configured |
| Three dots | Ellipsis |
| Arrow sequences | Left/right arrows |
| Comparison sequences | Greater-or-equal, less-or-equal, not-equal symbols |
| Simple fractions | Unicode fractions (opt-in) |
| Double angle brackets | Guillemet quotation marks (opt-in) |

The eight quotation/arrow symbols are customizable. There is an on/off command and a **convert selection** command. Conversions do **not** require an external typography engine. They are designed not to rewrite code/URLs or existing Markdown markup when recognized, and are only applied automatically during single-character typing (never on opening an existing note).

Both new modules have independent visibility toggles in Basic AI **Modules**, plus dedicated settings tabs. The existing Keyshots hotkey profiles are unaffected. No retired Editing Toolbar is restored.

### Extra release checks

- [x] Safe settings migration and basic replacement tests
- [x] Separate Easy Typing and Smart Typography configurations
- [x] Safe, opt-in regex rules, text snippets and desktop export added (not one-to-one upstream parity)
- [ ] Manual IME/composition/mobile keyboard verification
- [ ] Manually test shortcuts alongside Keyshots, abbreviations and Obsidian core editor commands

## Advanced Easy Typing rules and snippets

**Regex replacements:** Enable explicitly in the Easy Typing settings. Add up to 30 one-line rules in \`pattern|replacement|flags\` format, such as \`teh|the|\` or \`([A-Za-z]+)123|$1-123|i\`. Backreferences in the replacement string use JavaScript-style \`$1\`; rule patterns are bounded in size, input is restricted to the final 256 characters, and dangerous nested repetitions are rejected. This is a practical subset, **not** a sandbox for arbitrary scripts, and care should still be taken with custom regular expressions.

**Navigable snippets:** Run \`Easy Typing: insert navigation snippet\`. The snippets are configured as JSON objects, one per line, with \`name\` and \`body\`. Use \`\${1:placeholder}\`, \`\${2:placeholder}\` and \`\${0}\` to insert initial text and navigate via Tab; Shift+Tab returns to an earlier stop. The current note content is preserved outside the inserted selection.

## Pandoc desktop export

Configure **Pandoc Syntax → Pandoc export (desktop)**, enable it and set the installed \`pandoc\` executable if needed. Then use \`Pandoc: export current note\` or a format-specific command. Export creates a **new file** within the configured vault folder (\`Exports/Pandoc\` by default), appending a numerical suffix rather than overwriting existing files. The note is never changed and files are generated in an isolated temporary directory that is removed afterward.

- Supported outputs: DOCX, HTML, EPUB, ODT, PDF, plain text and LaTeX.
- Markdown input enables recognized Pandoc fenced divs, fancy/definition/example lists, bracketed spans and dollar-math extensions; [Pandoc manual](https://pandoc.org/MANUAL.html) documents each format.
- Requires Pandoc installed locally; mobile Obsidian cannot run the export command. For PDF, a LaTeX-compatible PDF engine may also be required.
- No shell interpolation and no automatic execution of user-supplied Lua filters. External Pandoc software and exported files must be validated on the actual user's operating system before stable release.

## Verification status

**GitHub Actions** checks the standalone bundle and executes unit/regression tests for v3/v4/v5 features, regex and snippets, syntax contexts and Pandoc argument/path construction. These automated tests **do not constitute a real Obsidian UI test**. Still required: a full smoke test on desktop and Android, input method composition, link/code preservation in the editor, CodeMirror shortcut precedence, markdown reading/live preview in a large document and a real Pandoc export with the executable installed.
