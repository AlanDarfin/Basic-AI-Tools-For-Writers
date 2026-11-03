# Markdown block reference — Basic AI Tool for Writers

This is a copy-ready guide to the **supported code-fence renderers**, not a list of hypothetical Make.md features. Replace the sample vault paths with your own. These blocks render content; the Markdown source remains in your notes.

**How to use:** create a Markdown note in Obsidian, paste any complete example below, and switch to Reading View or Live Preview. Enable the corresponding Basic module in Settings. The short names are preferred; existing \`writer-\` aliases remain supported for \`tabs\`, \`avatar\`, \`wiki\`, \`post\`, \`chat\`, \`media-gallery\` and \`folder-overview\`.

## 1. Folder Overview (\`folder-overview\`)

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

If \`folder\` is omitted, the block uses the folder associated with the note containing it (or its parent). A folder is always clickable to browse its contents, even if \`subfolders: false\`. In **list** mode, the right-hand chevron expands/collapses a nested subfolder while tapping its name opens it; this also works on mobile.

**Layout choices:** \`cards\` (responsive tiles), \`list\` (indented folder tree), \`compact\` (dense rows), \`grid\` (large icon grid), \`table\` (name/type/modified), \`board\` (folder and note columns). Legacy \`card\` and \`strip\` still map to \`cards\` and \`list\`. \`view:\` and \`layout:\` may also select the mode.

**Sort choices:** \`name-asc\`, \`name-desc\`, \`modified-desc\`, \`modified-asc\`, \`created-desc\`, \`created-asc\`, \`size-desc\`, \`size-asc\`, \`type\`. By default, folders appear before notes (\`folderFirst: true\`). Sorting is applied among children at each folder level, preserving the tree hierarchy. Use \`folderFirst: false\` for one combined sorting order.

**Remaining options:** \`subfolders\` (true/false), \`depth\` (0–8 levels beyond the current folder), \`limit\` (1–200 entries), \`noteOnly\` (hide folder rows but continue scanning their contents), \`showBrief\` (display text summaries), \`briefMax\` (32–400 characters), \`showPath\` (show paths on nested cards), \`controls\` (show view/sort/search toolbar). Changing a dropdown affects this rendered instance; set the fields in the code block for a persistent default.

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

## 2. Tabs (\`tabs\`)

Use \`=== Title\` to begin each tab (up to 12). \`layout: top\`, \`left\`, \`right\` or \`side\` changes navigation placement. Content is regular Markdown and can be edited from the rendered tab.

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

## 3. Wiki / infobox (\`wiki\`)

Header fields are \`key: value\` lines until \`---\`, followed by a Markdown body. \`title\`/\`name\`, \`subtitle\`/\`role\`/\`type\`, and \`image\`/\`cover\`/\`avatar\` are special. Other header fields become metadata rows (up to 12). Images must resolve to a **local vault file**.

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

## 4. Avatar / character card (\`avatar\`)

Shares the Wiki header format. \`layout: left\` or \`right\` positions the portrait next to the text; \`top\` is the default. If no local image is found, an initial is shown.

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

## 5. Fictional social post (\`post\`)

A post accepts \`author\`/\`name\`, \`handle\`, \`date\`/\`time\`, \`avatar\`/\`image\`, \`likes\`/\`flames\`, \`views\` and \`comments\`. The line \`=== reply\` starts another post; \`depth\` or \`level\` (1–5) nests a reply.

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

## 6. Fictional chat (\`chat\`)

\`<\` is the left side; \`>\` is the right side. Separate avatar, name, message and optional time with \`|\`. Profiles can define names, colors and local avatars. A message without an explicit name inherits the configured name; consecutive messages from the same speaker avoid repeated headers.

~~~~markdown
~~~chat
title: Archive expedition
[Left=Mira, right=Jonas]
[Mira=blue, Jonas=green]
[Mira=[[Characters/Mira.png]]]
< | Mira | We found the entrance. | 09:41
> | Jonas | I'll bring the supplies. | 09:42
< | | Check the map first. | 09:43
> | | Understood.
~~~
~~~~

A simpler valid format is \`< Mira | Hello\` or \`> Jonas | Hi | 10:00\`. Legacy \`=== Speaker\` sections remain supported with \`avatar\`, \`time\`, \`side\` or \`mine\` fields before \`---\`.

## 7. Vault media gallery (\`media-gallery\`)

Use \`path\` or \`folder\` to target a vault folder. \`type\`: \`all\`, \`image\`, \`video\`, \`audio\`, \`pdf\`. \`layout\`: \`masonry\`, \`grid\`, \`ratio\`. \`sort\`: \`name-asc\`, \`name-desc\`, \`mtime-desc\`, \`mtime-asc\`, \`size-desc\`, \`size-asc\`. \`subfolders\` is a boolean; \`limit\` is 1–150.

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

## 8. Markdown columns (\`columns\`)

Set \`columns: 1\`–\`4\`; split sections with \`--- end-column ---\`, \`--- column-break ---\`, \`--- column-end ---\`, or \`:::columnbreak\`. Column content is rendered Markdown.

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

## 9. Progress bar (\`progressbar\`)

**Manual:** \`kind: manual\`, \`min\`, \`max\`, \`value\`, \`name\`. Include \`id\` and \`button: true\` to show persistent +/− controls. The label supports \`{min}\`, \`{max}\`, \`{value}\`, \`{percentage}\`.

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

**Automatic:** use \`kind: day-year\`, \`day-month\`, \`day-week\` or \`month\`. For a date range, use \`day-custom\` with ISO dates in \`min\` and \`max\`.

~~~~markdown
~~~progressbar
kind: day-custom
name: Project timeline — {percentage}
min: 2026-11-01
max: 2026-12-31
~~~
~~~~

## 10. Widgets (\`widgets\`)

Each block renders **one** widget type: \`clock\`, \`quote\`, \`countdown\` or \`counter\`.

**Clock:**

~~~~markdown
~~~widgets
type: clock
format: 24hr
hideseconds: true
~~~
~~~~

Use \`format: 12hr\` for 12-hour time; omit \`hideseconds\` to display seconds.

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

## 11. YAML property field (\`meta-field\`)

Use \`property\` to name a frontmatter key, \`type\` to choose \`view\`, \`toggle\`, \`text\`, \`number\` or \`select\`, and \`label\` for the displayed heading. \`select\` accepts \`options\` separated by \`|\`. The field edits only the specified YAML property in the current note.

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

## 12. Instant table of contents (\`insta-toc\`)

Builds a nested contents list from the headings **in the current note**. \`maxDepth\` is 1–6; \`numbered\` and \`folded\` are booleans. Heading links jump to the corresponding text.

~~~~markdown
~~~insta-toc
maxDepth: 4
numbered: true
folded: false
~~~
~~~~

## 13. Chapter / note navigation (\`longform-nav\`)

With an empty block, the plugin resolves previous/next chapters using the current Longform project's order. For an ordinary note outside Longform, configure \`mode: manual\` and \`previous\`/\`next\` Obsidian note links.

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

## Troubleshooting

If you see raw code instead of a widget, check the spelling of the fence, the module toggle, and Obsidian's Reading View / Live Preview. For \`folder-overview\` and \`media-gallery\`, paths refer to **vault folders**, not operating-system absolute paths. For local images, the linked file must exist in the vault. On phones, the Overview **list tree** has separate touch targets: tap the chevron to collapse/expand, or the folder name to navigate into it.

All examples above use only the plugin's current renderer syntax; no external Make.md dependency is required.

## 14. Flow board (beta)

The new `flow` block accepts one unique `id:` and multiple `=== Column` sections, each with markdown-list cards beginning with `- `. The rendered board is interactive: drag cards between columns on desktop or use arrow buttons on mobile. **The board saves the movement in Basic settings, not inside the note text.** Change the original markdown to edit card text.

~~~~markdown
~~~flow
id: plot-flow
=== Ideas
- Introduce the protagonist
- Add the first location
=== Drafting
- Write chapter one
=== Editing
- Check dialogue
~~~
~~~~

### Slash quick insert

Enable slash suggestions in Settings → Flow & slash commands, then type `/flo` in an editor to suggest Flow, or `/over` for Folder Overview. This is opt-in to avoid conflict with other slash menus. Alternatively use the command-palette action **Writing: quick insert catalog**.

Included insert actions: heading, task, callout, divider, note link, folder overview, Flow board, tabs, gallery, progress bar and date.
