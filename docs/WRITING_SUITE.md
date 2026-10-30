# Writing Suite — v3.0.0-beta.4

This release adds several **independently implemented** features to Basic AI Tool for Writers, using the plugins supplied by the user as behavior and UI references. The original compiled plugin code has **not** been inserted wholesale into the distribution.

## Abbreviations
Expand enabled abbreviations when typing a space, like the supplied Abbreviation plugin. Each entry has its own text replacement, enable toggle, and case-sensitivity flag. The default nine entries include `atm`, `eg.`, `imo`, `w/`, `w/o`, `btw`, `afaik`, `rn` and `ily`. Edit them through **Settings → Abbreviations**, or run **Edit abbreviations** from the command palette.

## Another Name
An optional property (`another-name` by default) displays an alternative name immediately below the Obsidian inline title. The original title remains visible.

## View Mode
An optional per-note `prefer-view` YAML property supports `read`, `edit`, `edit-source` and `edit-preview`. It is applied when a Markdown note opens, without changing the user's note text.

## Longform tasks
Projects now have a **Tasks** tab alongside Scenes, Project, Compile and Notes. Tasks are stored per project in Basic AI settings; they can have named groups, due dates and links to vault notes, and be completed or edited quickly. Settings include sorting, hiding completed entries and showing due dates. Existing Longform project YAML is not modified by the task manager.

## Instant table of contents
Insert an `insta-toc` Markdown code block using the command palette. It renders headings hierarchically and allows expanding/collapsing groups. Optional block settings:

```insta-toc
maxDepth: 4
numbered: false
folded: false
```

This implementation covers on-note headings and collapsible navigation; some specialized controls of the source plugin may differ.

## Unicode search
The writing-tools sidebar has an **Extras** tab with Unicode Search. Search by character, name, or codepoint (`U+2014`), insert the result in the editor, and save favorites. A small built-in set is available immediately. For extensive name-based search, choose **Settings → Unicode → Download / update** once to download the public UnicodeData index from unicode.org into the plugin's data folder. Further searches work offline.

## Template by note name
An automatically created *empty* note can receive the contents of `Templates/<note basename>.md`. Configure the folder under Settings → Templates. Supports `{{title}}` and `{{date}}`. Existing text is never overwritten automatically. **No separately identifiable Template by Note Name bundle was present among the supplied files**, so this is a safe independent implementation, not a claim of full upstream equivalence.

## Multilingual text-to-speech
Choose the **Extras** tab or use the command palette to read a selection or the active Markdown note. Controls: read, pause, resume and stop. Voices, speaking rate, pitch, volume and language are configurable, with Portuguese, English, Spanish, French, German, Italian, Japanese and Chinese options. Uses the operating system/browser's **Web Speech speechSynthesis**, not an AI API. A Google voice is available only if that voice is installed and exposed by the device; availability differs between Android and desktop.

## Language
UI labels and messages for the project workspace and the version-3 modules have been translated toward English based on the Obsidian interface language. File paths, saved project identifiers, settings keys and prior user data are never translated.

## Testing and safety
Run `npm run check` to validate source synchronization, syntax and regression tests. Test with a vault copy before removing any original plugins. Original Longform projects and Note Snapshots histories are not deleted or rewritten.

This is a **beta integration**, pending hands-on desktop and Android confirmation. It is not guaranteed to reproduce every advanced behavior of the original upstream plugins.
