# Markdown block reference — Basic AI Tool for Writers

In a Markdown note, run **Writing: quick insert catalog** or type `/` and a block name. You can also paste a complete example below. Enable the corresponding Basic module in Settings and use Reading View or Live Preview. Replace sample paths with locations in your vault.

| Purpose | Block names |
| --- | --- |
| Fictional conversations and posts | `chat` / `writer-chat`, `post` / `writer-post` |
| Notes and worldbuilding | `tabs` / `writer-tabs`, `wiki` / `writer-wiki`, `avatar` / `writer-avatar` |
| Writing and revision | `scene-card`, `character-voice`, `beat-sheet`, `editor-note` |
| Files and media | `folder-overview` / `writer-folder-overview`, `media-gallery` / `writer-media-gallery` |
| Layout and navigation | `columns`, `writer-columns`, `insta-toc`, `longform-nav` |
| Planning | `flow` / `writer-flow`, `timeline` / `writer-timeline`, `timeline-labeled`, `basic-timetable` |
| Library and citations | `bookshelf` / `writer-bookshelf`, `bibliography` / `zotero` |
| Databases and properties | `basic-database` / `writer-database`, `basic-suite-db`, `basic-suite-chart`, `meta-field` |
| Widgets and progress | `widgets`, `progressbar` |
| Meta Bind compatibility | `meta-bind`, `meta-bind-button` |

## 1. Folder Overview (`folder-overview`)

The block browses a folder directly inside the note. It supports **six layouts**, nine sort orders, a searchable toolbar, custom per-file icons from Explorer settings, nested folders, and mobile-friendly tree expansion. It intentionally **does not show cover thumbnails**; each item displays its folder or note icon and name. Descriptions are **off by default**, but can be enabled.

~~~~markdown
~~~folder-overview
folder: Writing
style: cards
sort: name-asc
folderFirst: true
subfolders: true
depth: 2
limit: 80
showBrief: false
briefMax: 110
showPath: false
noteOnly: false
controls: true
~~~
~~~~

Use `folder: /` for the vault root. If `folder` is omitted, the block uses the folder associated with the note containing it (or its parent). A folder is always clickable to browse its contents, even if `subfolders: false`. In **list** mode, the right-hand chevron expands or collapses a nested subfolder while tapping its name opens it. The search field checks names and paths within the configured depth before applying the result limit.

**Layout choices:** `cards` (responsive tiles), `list` (indented folder tree), `compact` (dense rows), `grid` (large icon grid), `table` (name/type/modified), `board` (folder and note columns). Legacy `card` and `strip` still map to `cards` and `list`. `view:` and `layout:` may also select the mode.

**Sort choices:** `name-asc`, `name-desc`, `modified-desc`, `modified-asc`, `created-desc`, `created-asc`, `size-desc`, `size-asc`, `type`. By default, folders appear before notes (`folderFirst: true`). Sorting is applied among children at each folder level, preserving the tree hierarchy. Use `folderFirst: false` for one combined sorting order.

**Remaining options:** `subfolders` (true/false), `depth` (0–8 levels beyond the current folder), `limit` (1–200 entries), `noteOnly` (hide folder rows but continue scanning their contents), `showBrief` (display text summaries), `briefMax` (32–400 characters), `showPath` (show paths on nested cards), `controls` (show view/sort/search toolbar). Changing a dropdown affects this rendered instance; set the fields in the code block for a persistent default.

**Mobile-friendly nested list:**

~~~~markdown
~~~folder-overview
folder: Writing
style: list
sort: modified-desc
folderFirst: true
subfolders: true
depth: 4
showBrief: false
controls: true
~~~
~~~~

**Table of recently modified notes:**

~~~~markdown
~~~folder-overview
folder: Writing
style: table
sort: modified-desc
folderFirst: false
noteOnly: true
subfolders: true
depth: 3
limit: 50
~~~
~~~~

## 2. Tabs (`tabs`)

Use `=== Title` to begin each tab (up to 12). `layout: top`, `left`, `right` or `side` changes navigation placement. Content is regular Markdown and can be edited from the rendered tab. A marker inside a nested fenced code example stays in that tab’s content.

~~~~markdown
~~~tabs
layout: left
=== Synopsis
## Opening
The characters arrive in the city.

=== Characters
- [[Mira]]
- [[Jonas]]

=== Checklist
- [x] Outline
- [ ] First draft
~~~
~~~~

## 3. Wiki / infobox (`wiki`)

Header fields are `key: value` lines until `---`, followed by a Markdown body. `title`/`name`, `subtitle`/`role`/`type`, and `image`/`cover`/`avatar` are special. Other header fields become metadata rows (up to 12), and their names can include accented letters. Images must resolve to a **local vault file**.

~~~~markdown
~~~wiki
title: Northern Archive
type: Location
subtitle: Ancient library
image: [[Images/archive.webp]]
region: Highlands
founded: Year 312
keeper: Mira
---
A quiet archive holding maps and old manuscripts.

- [[Library inventory]]
- [[Expedition notes]]
~~~
~~~~

## 4. Avatar / character card (`avatar`)

Shares the Wiki header format. `layout: left` or `right` positions the portrait next to the text; `top` is the default. If no local image is found, an initial is shown.

~~~~markdown
~~~avatar
title: Mira
role: Explorer
image: [[Characters/Mira.png]]
layout: right
---
**Goal:** find the missing expedition.

- Trait: curious
- Ally: [[Jonas]]
~~~
~~~~

## 5. Fictional social post (`post`)

A post accepts `author`/`name`, `handle`, `date`/`time`, `avatar`/`image`, `likes`/`flames`, `views` and `comments`. Outside fenced code examples, a line with `=== reply` starts a reply. `depth` or `level` (1–5) sets its indentation.

~~~~markdown
~~~post
author: Mira
handle: @mira
date: 12:30
avatar: [[Characters/Mira.png]]
likes: 12
views: 94
---
The northern gate is finally open!

=== reply
author: Jonas
handle: @jonas
depth: 1
likes: 3
---
Did you bring the map?

=== reply
author: Mira
depth: 2
---
Of course.
~~~
~~~~

This is fictional, locally rendered content; there is no network posting.

## 6. Fictional chat (`chat`)

`<` is the left side; `>` is the right side. Separate avatar, name, message and optional time with `|`. Profiles can define names, colors and local avatars. A message without an explicit name inherits the configured name; consecutive messages from the same speaker avoid repeated headers.

~~~~markdown
~~~chat
title: Archive expedition
group-image: [[Images/Expedition.webp]]
[Left=Mira, right=Jonas]
[Mira=blue, Jonas=green]
[Mira=[[Characters/Mira.png]]]
< | Mira | We found the entrance. | 09:41
---
> | Jonas | I'll bring the supplies. | 09:42
--- Two hours later ---
< | | Check the map first. | 11:43
> | | Understood.
~~~
~~~~

Use `< Mira | Hello` for a short message, `> Jonas | Hi | 10:00` to include the time, or `< [[Characters/Mira.png]] | Mira | Hello` to include an avatar without the time. Legacy `=== Speaker` sections remain supported with `avatar`, `time`, `side` or `mine` fields before `---`.


**Chat dividers:** write `---` on its own line **between messages** for a simple dividing line. Write `--- Two hours later ---` or `--- 14:30 ---` to center an elapsed-time or timestamp label. Dividers render outside the message bubbles and reset consecutive-speaker grouping. In the older `=== Speaker` format, the **first** plain `---` after a legacy header still separates metadata from the body; later dividers render in the transcript.

**Group photo:** add `group-image: [[Images/Expedition.webp]]` just below `title:` for a circular image beside the conversation title. `group-photo:` and `group-avatar:` are also accepted. Image paths resolve only to files in the vault; remote images are ignored. The group image is independent of participant avatars and remains visible with `avatars: off`.

**Fictional voice notes:** use `[audio:0:15]` or `[voice:1:09]` as the entire message body. The play/pause button animates a waveform but **does not produce audio, record, or upload anything**. Example: `< | [audio:0:15] | 10:00`.

To include a written transcript, add `:text` after the duration, as in `[audio:0:15:I'll be there in five minutes.]`. The text appears below the waveform as soon as the message loads. Use `\n` for a line break or `\\n` to display a literal backslash-n.

~~~~markdown
~~~chat
title: Expedition group
group-image: [[Images/group.webp]]
[Left=Lia, Right=Davi]
< | Lia | [audio:0:15:I'm almost there.\nPlease wait for me!] | 10:01
> | Davi | [voice:0:08:We're waiting!] | 10:02
~~~
~~~~

**Line breaks:** consecutive lines and blank lines after a message become Markdown content in the same bubble. You can also type a literal `\n` inside one message field for a new line; `\\n` displays a literal backslash-n.

**Visual presets (optional, before messages):** `density: compact|normal|relaxed`, `bubbles: soft|round|square`, `avatars: on|off`, `width: normal|wide`. Character colors, avatars and default names still work as before.

~~~~markdown
~~~chat
density: compact
bubbles: round
[Left=Maria, right=João]
< | Hello\nSecond line | 10:00
> | [audio:0:15] | 10:01
< | Next message
Another paragraph:

- Markdown list
~~~
~~~~

Long conversations open with the first 50 transcript items. Choose **Show more messages** to continue reading. A chat block accepts up to 32,000 characters.

## 7. Vault media gallery (`media-gallery`)

Use `path` or `folder` to target a vault folder and `/` for the vault root. The available types are `all`, `image`, `video`, `audio`, `pdf` and `document`. Choose `masonry`, `grid` or `ratio` for `layout` and use `name-asc`, `name-desc`, `mtime-desc`, `mtime-asc`, `size-desc` or `size-asc` for `sort`. Set `subfolders: true` to include nested folders. `limit` caps the results after sorting and filtering (1–500), and `pageSize` sets how many results appear per page (8–60).

~~~~markdown
~~~media-gallery
path: Media
type: all
layout: masonry
sort: mtime-desc
subfolders: true
limit: 90
~~~
~~~~

## 8. Markdown columns (`columns`)

Set `columns: 1`–`4` on the first line. Split sections with `--- end-column ---`, `--- column-break ---`, `--- column-end ---`, or `:::columnbreak`. A separator inside a nested fenced code example stays in that column’s Markdown.

~~~~markdown
~~~columns
columns: 3
### Characters
- Mira
- Jonas
--- end-column ---
### Places
- Northern Archive
- East Port
--- end-column ---
### Tasks
- [ ] Check maps
- [ ] Write scene
~~~
~~~~

## 9. Progress bar (`progressbar`)

**Manual:** `kind: manual`, `min`, `max`, `value`, `name`. Include `id` and `button: true` to show persistent +/− controls. The label supports `{min}`, `{max}`, `{value}`, `{percentage}`.

~~~~markdown
~~~progressbar
kind: manual
id: chapter-one
name: Chapter one — {value}/{max} ({percentage})
min: 0
max: 20
value: 6
button: true
~~~
~~~~

**Automatic:** use `kind: day-year`, `day-month`, `day-week` or `month`. For a date range, use `day-custom` with ISO dates in `min` and `max`.

~~~~markdown
~~~progressbar
kind: day-custom
name: Project timeline — {percentage}
min: 2026-11-01
max: 2026-12-31
~~~
~~~~

## 10. Widgets (`widgets`)

Each block renders **one** widget type: `clock`, `quote`, `countdown` or `counter`.

**Clock:**

~~~~markdown
~~~widgets
type: clock
format: 24hr
hideseconds: true
~~~
~~~~

Use `format: 12hr` for 12-hour time; omit `hideseconds` to display seconds.

**Quotation:**

~~~~markdown
~~~widgets
type: quote
quote: Every manuscript begins with a first page.
author: Sample quote
~~~
~~~~

**Countdown:**

~~~~markdown
~~~widgets
type: countdown
date: 2027-01-01
to: Next writing milestone
completedlabel: Milestone reached
~~~
~~~~

**Counter** (the value is stored in the plugin's settings):

~~~~markdown
~~~widgets
type: counter
id: writing-sessions
startvalue: 0
increment: 1
text: Completed sessions
~~~
~~~~

## 11. YAML property field (`meta-field`)

Use `property` to name a frontmatter key, `type` to choose `view`, `toggle`, `text`, `number` or `select`, and `label` for the displayed heading. `select` accepts `options` separated by `|`. The field edits only the specified YAML property in the current note.

**Toggle:**

~~~~markdown
~~~meta-field
property: complete
type: toggle
label: Chapter complete
~~~
~~~~

**Text / number / select / read-only examples:**

~~~~markdown
~~~meta-field
property: reviewer
type: text
label: Reviewer
~~~

~~~meta-field
property: revision
type: number
label: Revision number
~~~

~~~meta-field
property: status
type: select
label: Status
options: Draft | Revising | Complete
~~~

~~~meta-field
property: author
type: view
label: Author (read-only)
~~~
~~~~

### Inline fields in Reading view

Enable **Inline INPUT and VIEW fields** in Basic’s settings. Write these tokens as plain Markdown text. They read or edit top-level YAML properties in the same note.

```markdown
Chapter complete INPUT[toggle:complete]
Status INPUT[select(Draft, Revising, Complete):status]
Progress INPUT[slider(0, 100, 5):progress]
Current status VIEW[status]
```

Enable **Legacy Meta Bind blocks** to use simple `meta-bind` forms and `meta-bind-button` actions on the same note. An active Meta Bind plugin takes priority. Buttons support `set`, `toggle` and `increment`.

~~~~markdown
~~~meta-bind-button
property: revision
action: increment
step: 1
label: Advance revision
~~~
~~~~

## 12. Instant table of contents (`insta-toc`)

Builds a nested contents list from the current note's Markdown headings, including headings underlined with `===` or `---`. `maxDepth` ranges from 1 to 6. Use `numbered: true` for an ordered list and `folded: true` to start with sections collapsed. Each link jumps to its own heading in Reading View or Live Preview, even when two headings have the same title.

~~~~markdown
~~~insta-toc
maxDepth: 4
numbered: true
folded: false
~~~
~~~~

## 13. Chapter / note navigation (`longform-nav`)

With an empty block, the plugin resolves previous/next chapters using the current Longform project's order. For an ordinary note outside Longform, configure `mode: manual` and `previous`/`next` Obsidian note links.

**Automatic:**

~~~~markdown
~~~longform-nav
~~~
~~~~

**Manual:**

~~~~markdown
~~~longform-nav
mode: manual
previous: "[[Writing/Chapter 01]]"
next: "[[Writing/Chapter 03]]"
~~~
~~~~

## 14. Narrative timelines (`timeline` / `timeline-labeled`)

Both the original George-debug Timeline block formats work in Basic. The original bracket presets (`line-2` through `line-5`, `body-2` through `body-4` and all 11 original `active-color-*` presets) are supported. Dates can be text such as “Before the war”; they are not forced into Gregorian dates.

**Original three-plus syntax:**

~~~~markdown
~~~timeline
[line-3, body-2, active-color-interactive-accent]
layout: vertical
theme: classic

+ 2030
+ The first meeting
+ A **Markdown** description with [[Links]].

+ The next winter
+ New discoveries
+ The story advances.
~~~
~~~~

**Extended timeline with images and horizontal layout:**

~~~~markdown
~~~timeline-labeled
layout: horizontal
theme: cards
density: comfortable
sort: source
controls: true

date: 2030-04-01
title: The first meeting
group: Part I
icon: sparkles
color: #b278c8
image: [[Images/first-meeting.webp]]
link: [[Chapters/First Meeting]]
content:
This event can include **Markdown**, lists and internal links.

---
date: 2030-06-08
title: Departure
group: Part II
image: [[Images/departure.jpg]]
content:
A second moment on the same interactive timeline.
~~~
~~~~

Options: `layout` (`vertical` or `horizontal`), `theme` (`classic`, `cards`, `minimal`, `compact`, `editorial`, `poster`, `glass`, `terminal`), `density` (`normal`, `compact`, `comfortable`), `sort` (`source`, `asc`, `desc`), `controls` (`true` or `false`), `color` (six-digit hexadecimal), `line` (2–5), `body` (2–4). Event fields: `date`, `title`, `content`, `group`, `image`, `color`, `icon`, `link`. Images and linked notes resolve **only from your vault**. Search, group filtering, orientation switching, horizontal scrolling and keyboard-friendly controls are available without rewriting the note. The plugin's Longform project timeline remains independent.

Original line styles: `line: 2` uses a hollow ring, `line: 3` a solid dot, `line: 4` a dashed rail and target-shaped marker, and `line: 5` a diamond. Original card styles: `body: 2` is a panel, `body: 3` a colorful arrow banner, and `body: 4` a side accent strip. The original `spaced-lines`, `hide-titles`, and all 11 `active-color-*` presets are supported. The timeline toolbar lets you try themes, lines and cards; edit the Markdown block to save a choice. Minimal has unboxed prose and airy dividers, while Compact has dense rows with dates and titles aligned side by side.

Descriptions support fenced and indented code. To separate labeled events, put `---` before the next `date`, `time`, or `when` field. A divider followed by more prose stays in the description. To scroll a horizontal timeline with the keyboard, focus it and use the arrow keys.

## Troubleshooting

If you see raw code instead of a widget, check the spelling of the fence, the module toggle, and Obsidian's Reading View / Live Preview. For `folder-overview` and `media-gallery`, paths refer to **vault folders**, not operating-system absolute paths. For local images, the linked file must exist in the vault. On phones, the Overview **list tree** has separate touch targets: tap the chevron to collapse/expand, or the folder name to navigate into it.

All examples above use only the plugin's current renderer syntax; no external Make.md dependency is required.


## 15. Longform bookshelf (bookshelf / writer-bookshelf)

The bookshelf reads existing Longform indices and local covers, without creating a second library database. A compact **Books** widget is also available on the homepage.

~~~~markdown
~~~bookshelf
sort: recent
layout: compact
~~~
~~~~

Set `sort` to `title`, `recent`, `chapters`, `progress`, or `series`. Set `layout` to `normal` or `compact`.

## 16. Gallery documents and text editing

In addition to image/video/audio/pdf, the Gallery accepts **type: document**. Document tiles include TXT, Markdown, JSON, CSV, XML, RTF, DOCX, EPUB and similar formats. Audio has playback controls; PDFs and binary documents are delegated to native viewers. The new text editor edits supported text/code extensions up to 512 KiB, with explicit Save; it is **not** a DOCX editor.

~~~~markdown
~~~media-gallery
folder: Books/Resources
type: document
layout: grid
subfolders: true
~~~
~~~~

## 17. Fictional audio: always-visible written transcription

With [audio:0:15:Written text] or [áudio:0:15:Texto escrito], the supplied text appears immediately and safely below the simulated waveform. There is no transcript toggle. It is not real audio transcription or playback. Older chat, writer-chat, --- and --- label --- syntax remains supported.


## 18. Version 10.1 additions and compatibility

The `bookshelf` and `writer-bookshelf` blocks show the same library. Filter by shelf, reading status, or favorites and adjust those fields on the book card. For Longform projects, progress follows the share of completed chapters. For single-note books, progress follows scrolling or uses the note's `readingProgress` property.

**Media Gallery:** keep \`media-gallery\` (or legacy \`writer-media-gallery\`), optionally set \`pageSize: 24\` and \`limit: 200\`; the UI paginates rather than showing every item. Use **Select multiple → Copy links** for Obsidian wikilinks. Text file excerpts are read locally, while PDFs use Obsidian's native handler.

~~~~markdown
~~~media-gallery
folder: Books/Research
type: all
layout: grid
sort: mtime-desc
limit: 200
pageSize: 24
subfolders: true
~~~
~~~~

**Flow graph:** retain \`flow\` / \`writer-flow\` and add \`layout: graph\`. A note can declare a dependency using a line such as \`[[Draft/Chapter 2]] | after:[[Draft/Chapter 1]]\`. Basic renders the dependency as depth and lets you change it from the card. It does not execute a graph pipeline.

~~~~markdown
~~~flow
layout: graph
[[Draft/Chapter 1]]
[[Draft/Chapter 2]] | after:[[Draft/Chapter 1]]
[[Draft/Chapter 3]] | after:[[Draft/Chapter 2]]
~~~
~~~~

**Flow text cards:** Start each column with `=== Column name` and each card with `- `. Move cards by dragging on desktop or using the arrow buttons. Basic saves the column assignments in its vault settings and keeps the Markdown as written. Give each board an optional unique `id` to keep its assignments when it moves within the note.

Use **Writing: quick insert catalog** from the command palette to add a text card board or other blocks while editing.

~~~~markdown
~~~flow
id: story-ideas
=== Ideas
- Plan the opening
=== In progress
- Draft chapter one
~~~
~~~~

**Timeline:** in \`timeline-labeled\` or legacy \`timeline\`, use \`sort: dependencies\`, \`max-events: 150\` and \`page-size: 30\`, plus event properties \`id\`, \`after\` and \`era\`. The previous maximum (80) remains the default; you can raise it to 250 explicitly. Dependency ordering is display-only.

~~~~markdown
~~~timeline-labeled
layout: horizontal
theme: cards
sort: dependencies
max-events: 150
page-size: 30

date: 2040
title: The founding
id: founding
era: First Age
content:
The settlement begins.

---
date: 2041
title: The journey
id: journey
after: founding
era: First Age
content:
The story continues.
~~~
~~~~

**Not a code-fence renderer:** importing/exporting ICS, filtering Markdown tables, validating YAML, editing batch properties, changing DoubleShift shortcuts, managing Space history, and saving dashboard presets are commands or settings, not Markdown fences.


## 19. Chat and text alignment (10.2)

~~~~markdown
~~~chat
title: Example
background: transparent
bubble-color: green
[Maria=purple, Maria=bubble:orange]

< | Maria | Test message | 14:32
> | Me | [audio:0:02:test test] | 14:34
~~~
~~~~

Name and bubble colors are independent, and transcripts are author-written fictional text. Transparent backgrounds remove the conversation panel.

Align Markdown text by wrapping a single line without code fences:

~~~~markdown
::l[Left]
::c[**Centered**]
::r[*Right*]
~~~~

Long aliases: ::left, ::center, ::right.

## Inline text and heading alignment (10.4.1)

Use a short suffix at the **end of the line**, keeping the real Markdown heading marker.

~~~md
# Main title {c}
## Right-aligned subtitle {r}
### Left-aligned section {l}
Justified paragraph with longer text {j}
## Justified heading {j}
Centered **bold** paragraph {c}
~~~

- {l} = left, {c} = center, {r} = right, {j} = justify.
- Suffixes are hidden in Reading View and may be hidden outside the active Live Preview line.
- For a one-tap solution, use the **Align left**, **Center text or heading**, **Align right**, **Justify text**, or **Cycle line or heading alignment** commands. Assign a desktop hotkey or add them to the Obsidian mobile toolbar. Commands format the current line while preserving H1–H6.
- The former ::l: / ::c: / ::r: and bracket syntax (for example, ::c[text]) remain recognized for existing notes.



## 10.7 — Databases and columns

Additional examples. Fields refer to Markdown note YAML properties; rollups follow `[[Note]]` links stored in `related`.

```writer-database
folder: Personagens
columns: file, status, priority
view: board
group: status
sort: priority
order: desc
formula: doublePriority = priority * 2
rollup: scenePages = related.pages | sum
limit: 100
```

```writer-columns
## Notes
- A
- B

---column---
## References
- C
- D
```

## Database views and class timetables

Use `basic-suite-db` with `folder` or `database` and a `view` such as `table`, `board` or `gallery`. For a count by YAML property, use `basic-suite-chart` with `group`.

~~~~markdown
~~~basic-suite-chart
folder: Writing
group: status
~~~
~~~~

Create the timetable note from **Study: open academic center**, then insert `basic-timetable`. The optional `file` points to a different timetable note. The block recognizes weekdays in English and Portuguese and highlights the current day.

~~~~markdown
~~~basic-timetable
title: Classes this term
~~~
~~~~

## Four writing and editing blocks

Enable **Extended Syntax → Interactive blocks**. Insert them from the command
palette using **Insert: Scene card**, **Character voice**, **Story beats**, or
**Editorial note**. Selected editor text is kept in the inserted block. The
**Edit** button edits the fenced Markdown source and detects concurrent changes.
If any part of the note changes while the inline editor is open, saving is
rejected and your draft stays in the editor. Copy it before reopening the block.
Nested Markdown code fences are kept inside a sufficiently long outer fence.

````markdown
```scene-card
title: The empty station
pov: Ana
location: Platform
goal: Find her brother
conflict: The last train is leaving
outcome: She finds a clue
---
The scene starts with **Ana** arriving at the platform.
```

```character-voice
name: Ana
tone: Anxious
---
“Did you hear that too?”
```

```beat-sheet
title: The first act
---
Opening | Ana arrives at the station.
Turn | She finds [[Letter|a letter]].
Outcome | The train leaves without her.
```

```editor-note
title: Scene review
status: Pending
---
Check whether Ana's motivation is clear to the reader.
```
````

Initial lines are optional fields; `---` separates them from the Markdown body.
In `beat-sheet`, use `Title | content` on each line. Spaces around the separator
are required, so wiki-link aliases such as `[[Note|Alias]]` stay intact. A block
is limited to 32,000 characters and a beat sheet to 80 lines.

**Writing: rhythm and repetition** analyzes the selection, or the current note if
nothing is selected. It groups sentences into 1–12, 13–24 and 25+ words,
shows the longest sentences and paragraphs, and lists nearby repetitions.
Click a finding to return to the original text. Counts are approximate and
analysis stays local. A report covers at most 200,000 characters.
