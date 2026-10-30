# Writing Suite — v3.0.0

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
The supplied **Template by Note Name** plugin supports ordered name-matching rules. Configure a template folder and add one or more rules using **Starts with**, **Contains**, or **Ends with**, each pointing to a selected Markdown template. The first matching rule applies on note creation. Case sensitivity, template application on renaming, and date/time formats are configurable. Placeholders `{{date}}`, `{{date:YYYY-MM-DD}}`, `{{time}}`, `{{time:HH:mm}}` and `{{title}}` are supported. A selected template is prepended, preserving existing note content; enabling rename application can therefore modify existing notes, so take a backup first. To preserve the previous beta-4 behavior, **when no rules are configured**, the plugin looks for `Templates/<note basename>.md` and applies it to empty notes without erasing their content. The supplied bundle was used to verify behavior; the integration code is independent.

## Multilingual text-to-speech
Choose the **Extras** tab or use the command palette to read a selection or the active Markdown note. Controls: read, pause, resume and stop. Voices, speaking rate, pitch, volume and language are configurable, with Portuguese, English, Spanish, French, German, Italian, Japanese and Chinese options. Uses the operating system/browser's **Web Speech speechSynthesis**, not an AI API. A Google voice is available only if that voice is installed and exposed by the device; availability differs between Android and desktop.

## Language
UI labels and messages for the project workspace and the version-3 modules have been translated toward English based on the Obsidian interface language. File paths, saved project identifiers, settings keys and prior user data are never translated.

## Testing and safety
Run `npm run check` to validate source synchronization, syntax and regression tests. Test with a vault copy before removing any original plugins. Original Longform projects and Note Snapshots histories are not deleted or rewritten.

This is the **3.0.0 stable release**, with automated checks and regression tests. Full visual validation on every desktop theme and Android device is not available, and the independent integrations do not guarantee parity with every advanced upstream feature.

## Responsive translation sidebar

In a narrow Obsidian desktop sidebar, provider and source/target language selectors stack vertically. The layout responds to the **sidebar width**, not just the monitor width, to prevent truncated dropdowns and controls.

## 3.1.0-beta.1 preview: online speech and readable Unicode UI

- **Unicode search** displays the character as a large glyph beside its readable Unicode name, U+ code, and a favorite star. The search is ranked by name relevance and can be limited to arrows, quotations, math, letters, symbols or favorites. The full index remains locally cached after an optional one-time download from unicode.org.
- **Tab navigation** in the main sidebar, Writing Tools, Longform and Settings is horizontally scrollable on narrow desktop windows and phones. The writing-tools Extras panel separates characters, speech and project navigation into sections.
- **TTS engines**: System / offline (the existing Web Speech API), or Microsoft Edge neural / online (an independent implementation inspired by the user-provided Edge TTS plugin). Choose a language and online voice under Settings → TTS. Online TTS requires explicit opt-in and sends the text being read to Microsoft servers. It does not require an AI API key or an installed Linux voice package. Pause, resume, stop, sequential audio chunks and error feedback are supported.
- **Limitations**: the Edge consumer service is unofficial/undocumented and may reject requests or stop working without notice. Voice quality, network access and playback are not guaranteed. The original Obsidian Edge TTS plugin is licensed AGPL-3.0; the implementation here is independent, with no bundled code from that plugin. Do not use online speech for confidential notes unless you are comfortable sending their text to Microsoft.

Test online speech with a short selected passage first. If it fails on your Arch installation, the system engine remains available once you install an OS-compatible speech voice.

## 3.1.0-beta.2 — Unified menu controls

The LanguageTool review selector and other native dropdowns in the main sidebar, Writing Tools, Longform, Unicode search and Settings now share a consistent minimum height, padding, font size and focus styling. This prevents the older theme-dependent combination of fixed Obsidian dropdown height and 9px vertical padding from vertically cropping selected text. Responsive settings columns adjust to the panel width, not the display width. The same styles remain scoped to Basic AI to avoid changing unrelated Obsidian plugins.
