# Basic AI Tool for Writers — 6.0.0-beta.4

**Experimental beta**, not a stable release. The latest stable version remains **5.2.0**.

## What's new

### Longform navigation
- **Automatic footer:** enable "Automatically add to note ends" under Longform settings, or choose "Enabled" inside an individual project's preferences. Existing Markdown files are not modified.
- Chapter navigation is available in Reading View and Live Preview. A note containing an explicit `longform-nav` code block will not receive a duplicate automatic footer.
- **Jump to chapter:** the command palette now includes fuzzy search for chapters and nested subchapters in the current book.
- **Manual mode:** choose a previous and a next note from the Obsidian vault, even if neither is part of any Longform project. Command: **Navigation: manually choose previous and next notes**. The wizard inserts:
```text
~~~longform-nav
mode: manual
previous: "[[Notes/First]]"
next: "[[Notes/Third]]"
~~~
```
  Either link can be empty, and missing notes are never opened. Existing automatic project navigation remains available through an empty `~~~longform-nav` block.

### Smart syntax insertion
- Native commands and a context menu, not a separate editing toolbar.
- Ruby above or below, ratings, Discord timestamps, spoilers and subtext.
- Dialogs are available in English and Portuguese. Original text is preserved if the editor changes while a dialog is open.

### Cleaner interface
- Compact, consistent controls in project preferences, Markdown settings and insertion dialogs.
- Scrolling tab navigation and small-screen layouts preserved.

### Per-project preferences
- Independent automatic navigation: **inherit / enable / disable**.
- Module overrides in each project's settings for Ruby, ratings, Discord syntax, timestamps, reading time and the linter. Globally hidden modules remain hidden.
- Project-specific editorial notes are passed to AI reviews alongside global instructions.
- Save a preferred writing preset for each project and apply it explicitly. Applying a preset changes global preferences until undone; it is **not** silently activated when opening a note.
- Preferences are saved in Basic AI data, not by modifying the Longform index.

## Upgrade
Place `main.js`, `manifest.json`, `styles.css` in `.obsidian/plugins/basic-ai-tool-for-writers/` or extract the three-file ZIP. Reload the plugin. Back up the vault before beta testing.

## Validation checklist for the RC
Test on Android and desktop, particularly footer placement in Live Preview, custom themes, non-Longform notes, index changes, nested chapters, project switches and undoing writing profiles. This beta's automated tests do not replace real device testing.
