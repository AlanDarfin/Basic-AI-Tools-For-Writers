# Feature and integration guide

**Basic 13.7.0** · Obsidian 1.11.4+ · [Português](SUITES_AND_INTEGRATIONS.pt-BR.md) · [First steps](GETTING_STARTED.en.md) · [README](../README.md)

Use this guide to locate a setting and understand what its feature does. The names match the current interface. Implementation IDs and supported Markdown syntax remain compatible with existing vaults; older release guides can use earlier labels.

## Choose features and find controls

Open **Settings → Basic**. The nine categories below contain all current settings sections. Choose a category and section or search for an option directly, including before its section has been opened. Current English/Portuguese labels and earlier feature names can be used in search.

**General → Features** controls which features appear in Basic's panes, menus and actions. Their settings remain available while hidden, and their saved data is retained. A page can also contain its own functional enable switch. Compatibility options that affect feature loading state when a restart is required. Settings in separately installed plugins are independent.

Favorite up to 12 sections for quick access. Use **General → Writing profiles** to save supported groups of writing preferences and undo the last profile application. Profiles are not full vault backups or credential exports.

## Settings directory

### General

| Section | What you configure |
| --- | --- |
| **Get started** | Initial setup, language and feature shortcuts. |
| **Features** | Choose the features shown in panes, menus and commands. |
| **Writing profiles** | Save combinations of preferences and undo the last application. |
| **Diagnostics & shortcuts** | Check local status and possible shortcut conflicts. |
| **Integrations & sync** | Mentions, integrated actions and connections to external plugins. |
| **Compatibility** | Control advanced feature loading after restarting. |

### Appearance & panes

| Section | What you configure |
| --- | --- |
| **Homepage** | Search, shortcuts, widgets and books on the homepage. |
| **File explorer** | Icons, colors, previews and folder presentation. |
| **Note properties** | Property presentation and editing in the editor. |
| **Images & annotations** | Insert, resize, view and annotate local images. |
| **Media & dragging** | Dragging and previews for images, audio and video. |
| **Blocks & widgets** | Columns, progress, galleries and interactive blocks. |

### Writing & editing

| Section | What you configure |
| --- | --- |
| **Editor shortcuts** | Keyboard navigation, line editing and multiple cursors. |
| **Typing & typography** | Quotes, dashes, paste, replacements and text rules. |
| **Typewriter & focus** | Active line position and comfortable focus while writing. |
| **Word suggestions** | Autocomplete using local words and terms. |
| **Cursor position** | Restore note cursor position, selection and scroll. |
| **Abbreviations** | Text expansions and abbreviations used while writing. |
| **Alternate titles** | Display names and alternate note titles. |
| **Editor modes** | Editing, reading and view preferences. |
| **Note templates** | Reusable templates to create and fill notes. |
| **Quick actions** | Action palette, idea capture and folder focus. |
| **Advanced editing** | Additional editor commands and features. |

### Markdown & formatting

| Section | What you configure |
| --- | --- |
| **Formatting toolbar** | Toolbar buttons, groups, shortcuts and appearance. |
| **Text formatting** | Underline, highlight, subscript, superscript and alignment. |
| **Advanced lists & blocks** | Definition lists, examples and export using Pandoc. |
| **Annotations & text elements** | Pronunciation, subtext, spoilers and interactive ratings. |
| **Numbering & captions** | Sequences, references, chapters, figures and tables. |
| **Smart insertion** | Insert formatting and elements based on context. |
| **Symbols & characters** | Choose and insert Unicode characters. |
| **Note table of contents** | Generate and configure a table of note headings. |
| **Markdown cleanup** | Preview formatting rules before applying changes. |

### Organization & focus

| Section | What you configure |
| --- | --- |
| **Workspaces** | Collections by folder, tag and properties, with independent layouts. |
| **Calendar & events** | Agenda, imports and calendar feeds. |
| **Tasks & capture** | Find tasks, organize to-dos and capture ideas. |
| **Tables & databases** | Views, properties, queries and local database creation. |
| **Slash commands & insertion** | Block composition and slash command menus. |
| **Focus timer** | Focus sessions, breaks and timer controls. |
| **Music & ambience** | Radio, playlists and local music while writing. |
| **Typing sounds** | Desktop keyboard sound packs and volume. |
| **Temporary drafts** | Session drafts kept in memory. |
| **Interface privacy** | Visual privacy and local interface locking. |
| **Protected notes** | Create and open notes with encrypted content. |
| **Files & tools** | Text files, tables, batch properties and side panes. |

### Books & projects

| Section | What you configure |
| --- | --- |
| **Book writing** | Projects, chapters, continuous writing, recovery and compilation. |
| **Library** | Shelves, series, covers and book presentation. |
| **Project tasks** | Project lists with groups, due dates and links. |
| **Chapter navigation** | Links and navigation blocks following chapter order. |
| **Dynamic content** | Compose passages from folders, tags and properties. |
| **Characters & worldbuilding** | Compendium, characters and story world organization. |
| **Relationship graph** | Visualize relationships between characters, places and notes. |

### Review & versions

| Section | What you configure |
| --- | --- |
| **Grammar checking** | Languages, personal dictionary and LanguageTool checking. |
| **AI review** | Style reviewers, beta reader and editorial profile. |
| **Comparison & selective review** | Compare versions and accept selected changes. |
| **Rewriting & alternatives** | Sentence alternatives and rewrite comparisons. |
| **Version history** | Local copies, previews and version restoration. |

### Reading & study

| Section | What you configure |
| --- | --- |
| **Citations & reading** | Research sources, imported highlights and reading style. |
| **Reading time & dates** | Reading estimates and timestamp presentation. |
| **Read aloud** | Voices, languages and services for reading notes aloud. |
| **Voice & accessibility** | Selection reading, local controls and voice features. |
| **Study & spaced repetition** | Study routine, flashcards and review scheduling. |

### Artificial intelligence

| Section | What you configure |
| --- | --- |
| **Dictionary & definitions** | Local dictionary, lookup and definition connection. |
| **Translation** | Connection, source language and target language. |
| **Writing assistant** | Chat, editor suggestions, model and assistant instructions. |
| **AI connections** | Keys, endpoints and on-demand checks. |
| **AI models** | Model catalog and per-feature choices. |
| **AI instructions** | Default prompts for definitions, translation and writing. |

## Put the features to work

### Homepage and workspaces

The homepage combines fuzzy vault search, quick actions and configurable widgets such as books, calendar, recent notes, favorites, writing goals, quotes and local photos. Its title, icon, appearance and widget visibility are configurable. You can choose whether it opens for an empty new tab.

On desktop, widgets can be moved and resized using their controls; saved frames and visibility can be scoped to a workspace. Mobile uses the available widget actions without desktop resize handles. Book cards can use a local cover, synopsis, series and progress metadata.

Workspaces collect notes using folders, tags and properties. They can keep their own presentation and layouts. A folder can become the explorer's visual root, and notes can be hidden in that workspace without changing another workspace. These presentation choices do not relocate files or change filesystem permissions. Return to the entire-vault scope when you want to browse everything.

The file explorer adds icons, colors, folder views, previews and manual ordering. Saved manual order controls presentation without moving the source files.

### Books, chapters and recovery

Books can be chapter projects or individual Markdown notes. Projects retain chapter order, nested scenes, tasks, goals and planning information. Characters and worldbuilding entries stay in Markdown, with links, fields, images and relationships. A relationship graph and narrative timelines provide additional views of that material.

Chapter navigation can display links in project order. Dynamic content rules can display templates or navigation in note headers, footers and supported reading areas or panes, based on folders, tags and properties, without inserting that content into the source file.

Continuous writing displays separate chapter editors. Save each chapter explicitly; concurrent changes need review. **Books: recover drafts** opens local recovery copies, compares originals and offers a separate Markdown copy or explicit discard. Existing recovery entries remain available if you stop creating new copies. Temporary session drafts stay in memory until saved to a file.

**Books: compile Markdown manuscript** assembles every chapter in the selected draft. Saved-file mode uses disk content. Current-writing mode can include compatible drafts and open editor buffers. A missing chapter or conflicting version blocks preparation. The preview is fixed until refreshed, and export creates a new Markdown file under `Basic Exports/`.

Chapter recovery, version snapshots and an independent backup have different purposes. They can contain plaintext. See the [writing walkthrough](GETTING_STARTED.en.md#write-your-first-book) and [security](../SECURITY.md).

### Typing, formatting and navigation

Editor shortcuts provide desktop navigation, line operations and multiple cursors. Diagnostics can inspect known shortcut conflicts; the host cannot expose every third-party editor keymap, so a successful scan is not a complete conflict guarantee.

Typing controls cover paired quotes, apostrophes, dialogue dashes, paste, snippets and literal/regex replacements. Individual rules have enable switches and replacement fields, including multiline text. Regex is optional; an invalid edit retains the previous valid rule. Automatic typography skips recognized code and structured contexts. Test custom rules on a short note before using them broadly.

Markdown formatting includes toolbar actions, underline/highlight, subscript/superscript, aligned text, definition lists, numbered examples, symbols, annotations and tables of contents. Cleanup rules show a preview before applying changes. Numbering can be visual only; commands that write or remove heading numbers require a preview and confirmation because changing a heading can affect links.

Quick actions offer formatting, capture, reading and focus commands. Folder focus and interface locks change visibility; use protected notes when you specifically need encrypted content.

### Tables, tasks and study

Database views read properties from ordinary Markdown notes. Table, board, gallery, list, calendar, timeline and chart views support their implemented filters, sorting, grouping and limits. The visual builder prepares a `basic-suite-db` block and inserts it after confirmation; it does not create all database rows automatically. Editing a typed property or moving a board card can update its source note, with change checks.

For example:

~~~~markdown
~~~basic-suite-db
folder: Research
view: board
group: status
columns: file,status
limit: 80
~~~
~~~~

The task navigator reads Markdown tasks; the workbench can toggle a checkbox after checking that the source still matches. Quick capture and brainstorming create separate Markdown notes when requested. Calendar entries, local iCalendar import/export and optional feeds have their own controls. Feed refresh can contact configured URLs automatically when you enable it.

Study tools use tagged Markdown cards such as `#flashcards` with `Question::Answer`, reversible `A:::B` cards and supported clozes. Scheduling offers the implemented SM-2 and FSRS-4.5 choices. TSV import/export supports interchange with Anki-compatible text files; it is not a live connection to an Anki collection. Study routines include user-triggered class/daily notes, reminders and timetable blocks.

### Images, media and protected notes

Image tools include preview, width changes with confirmation and local annotation. Image captions can display descriptions from Markdown image text. The annotator creates a new PNG using pen, arrow, rectangle, text or a covered area. The original image remains available and may still contain what was covered in the copy. Media previews depend on formats supported by the device.

Protected notes create new AES-256-GCM files under `Basic Secure/`. The password is not stored by Basic and cannot be recovered. This protects file content; filenames, folder structure, file existence and backups remain visible. Existing ordinary notes are not encrypted automatically.

## Markdown blocks and existing files

Use the [block examples](BLOCKS.en.md) for syntax and complete examples. Common blocks include:

| Block | Purpose |
| --- | --- |
| `tabs` | Markdown sections inside tabs. |
| `wiki`, `avatar` | Worldbuilding and character cards. |
| `post`, `chat` | Fictional social threads and conversations. These are local story content, not messaging connections. |
| `media-gallery`, `folder-overview` | Local media and dynamic folder listings. |
| `columns`, `progressbar`, `widgets`, `meta-field` | Layouts, progress, widgets and property controls. |
| `insta-toc`, `longform-nav` | Tables of contents and chapter navigation. |
| `timeline`, `timeline-labeled` | Narrative timelines with supported layouts and options. |
| `scene-card`, `character-voice`, `beat-sheet`, `editor-note` | Planning and editorial blocks with guarded source edits. |
| `basic-suite-db` | Local Markdown database views. |

Existing aliases such as `writer-tabs`, `writer-avatar`, `writer-wiki`, `writer-post`, `writer-chat`, `writer-media-gallery` and `writer-folder-overview` remain supported. Removing Basic leaves the Markdown source, but enhanced views need the plugin to render.

Fictional chat accepts `[Left=Maria, right=João]`, participant shorthand such as `[Maria=blue]`, and tab headings such as `=== Maria`. Simulated audio and author-written transcripts are story elements, not real recordings or transcription services. See the block guide before adding advanced syntax.

## Connections and data use

| Connection | What to expect |
| --- | --- |
| **AI providers** | Selected text, prompts and reference attachments are sent to the chosen provider for the requested action. Account access, models and billing depend on the provider. Automatic inline features can send text while enabled. |
| **Ollama or a custom endpoint** | Requests go to the configured server. A locally hosted server can be used, but the endpoint you select determines where text goes. |
| **LanguageTool** | Grammar text goes to the configured endpoint, or to the separately installed integration selected in settings. Automatic checks can run while the review pane is active when enabled. |
| **Zotero** | Imported Markdown highlights can be read locally. Optional Web API actions use a configured library and a temporary request key, with a preview before creating reference notes; they do not edit the remote library. |
| **Pandoc** | Desktop exports require a separate executable. It can access referenced local or remote document resources. PDF may require an additional engine. |
| **Device speech and online speech** | Device speech uses the voices exposed by the browser/OS; availability and offline operation depend on the voice. Online Edge read-aloud sends text to an external, undocumented consumer endpoint that may change. |
| **Music and typing sounds** | Desktop web radio uses YouTube embeds and may be blocked by the service. Local audio stays in the vault. Sound-pack downloads contact their remote source when requested. |
| **Calendar feeds** | Enabled HTTPS subscriptions contact their configured URLs manually or through the optional automatic-refresh setting. Imports are local; Basic does not modify the upstream feed. |
| **Surfing and web browsing** | With Surfing installed on desktop, the homepage can mount its native header. Other configured paths use the native Web Viewer or an external browser. Mobile links use the system browser. Remote pages and images make their normal network requests. |
| **Synchronization integrations** | Basic discovers and manually dispatches available commands of separately installed plugins, including Git, Syncthing and FIT integrations. Their authentication, transfers and automatic schedules remain in those plugins. Selecting a provider in Basic does not suspend another plugin's jobs. |

AI credentials live in Basic's plugin settings without encryption. Zotero's temporary request key has a different, session-only lifecycle. Do not publish API keys, personal plugin data or private manuscripts in issue reports. See [security](../SECURITY.md) and [third-party notices](../THIRD_PARTY_NOTICES.md) for licenses and implementation details.

## Platform and scope limits

- Desktop and Android are supported, but feature availability depends on native APIs, media formats, installed tools and the Obsidian version. Physical Android validation is separate from desktop viewport emulation.
- Keyboard preset bindings, web radio, keyboard sound playback, desktop widget resizing and Pandoc export have desktop requirements. Use the platform-specific controls that the interface exposes.
- Continuous chapter writing uses separate editors rather than one combined native document. Complete manuscript compilation produces Markdown; other publishing formats use the optional desktop exporter.
- Built-in databases, study tools and integrations have the behaviors described here. They do not imply complete feature parity with any external application. Additional external commands require that application/plugin to be installed and enabled.
- Feature visibility, interface privacy and folder focus do not secure the filesystem. Protected note content is separate from visible filenames and metadata.

For installation and problem diagnosis, use [Getting started](GETTING_STARTED.en.md). [Historical release notes](../CHANGELOG.md) and [older implementation guides](README_HISTORY.md) preserve prior names and scopes; the settings directory above is the current navigation reference.
