# Basic AI Tool for Writers 5.0.0

**Major stable feature release** · Obsidian **1.11.4+** · **Desktop and mobile** · No `v` prefix on the version tag.

This release expands the standalone Obsidian writing suite while keeping the existing AI, dictionaries, translation, LanguageTool, Longform projects, snapshots, TTS, cursor memory, typewriter mode and native Obsidian formatting behavior intact.

## Highlights

- **Keyshots-inspired keyboard navigation:** 14 line, selection and cursor actions plus optional desktop shortcut presets (VS Code, JetBrains or None).
- **Extended Markdown:** underline, spoiler, superscript, subscript, colored highlights, custom class spans and fenced divs in Reading mode and Live Preview.
- **Pandoc-inspired syntax:** lettered, Roman and auto-numbered lists; definitions, numbered examples, labeled paragraphs, fenced class blocks and navigable outline.
- **Easy Typing:** smart Tab out of symbol pairs, smart paste and list Backspace, optional capitalization and CJK spacing, custom literal and opt-in bounded regex rules, plus navigable text snippets with Tab/Shift+Tab and native commands.
- **Smart Typography:** configurable curly quotation marks and apostrophes, em/en dashes, ellipses, arrows, comparisons, and optional fractions and guillemets.
- **Pandoc export (optional desktop-only):** export the current note to DOCX, HTML, EPUB, ODT, PDF, LaTeX or plain text, with a configured local Pandoc executable. New exported files receive collision-safe names in a dedicated vault folder.
- **Independently toggled modules:** 23 module categories, including the new features, without deleting stored settings.

## Final maintenance

- Reviewed source modules for unsafe execution and accidental formatting side effects.
- Hardened text transforms against recognized frontmatter, links, URLs, inline and fenced code; improved typing snippets to release Tab after leaving the active placeholder.
- Added ordinary quoted-pair Tab navigation, safer Pandoc process timeout handling and extra regression coverage.
- Improved reading and editor decoration refresh behavior.
- Updated English and Portuguese READMEs, release metadata, version mapping and automated packaging checks.

## Installation

1. Download **Basic-AI-Tool-for-Writers-5.0.0.zip** from this release.
2. Extract **main.js**, **manifest.json** and **styles.css** into `.obsidian/plugins/basic-ai-tool-for-writers/`.
3. Enable/reload **Basic AI Tool for Writers** in Obsidian.
4. Open plugin settings → **Modules** to enable/disable the tools you use.

Do not install the GitHub repository's standalone source modules individually. Keep existing `data.json` when upgrading; back up the vault first.

## Limits and compatibility

- Desktop Keyshots shortcuts are disabled on mobile. Most other writing, Markdown and typography tools have mobile-capable source code; real-device keyboard and touch checks are still recommended.
- Pandoc export requires the **Pandoc CLI installed locally**. PDF output may additionally need a LaTeX/PDF engine. No external Lua filters or shell scripts are executed automatically.
- The Markdown extensions implement a **documented subset**, not the full Pandoc parser or the complete third-party reference plugins.
- Advanced regex rules are **off by default**; test a custom rule on a scratch note before enabling it.
- No retired Editing Toolbar has been restored. Use Obsidian's native toolbar and formatting commands.
- Automated checks cover syntax, source/bundle consistency, feature regressions, community CSS lint and artifact metadata; **real Obsidian desktop/Android manual testing is not implied by CI success**.

See [README](../README.md), [Português](README.pt-BR.md) and [v5 technical notes](V5-DEVELOPMENT.md).

**Privacy:** Local editor helpers run on-device; AI, LanguageTool and optional online speech may contact separately configured services according to the user's settings.
