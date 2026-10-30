# Basic AI Tool for Writers — v4 beta preview

Status: **4.0.0-beta.2** (development branch). Not a stable release.


## Beta.2 — integrated writing workspace

- Longform chapter reordering supports desktop HTML drag/drop (before or after) and an accessible two-tap handle flow for touch devices. Up/down buttons remain available. The vertical scrollbar position now persists across rerenders and chapter index writes.
- Android TTS resolves the most recently opened Markdown editor and falls back to reading the actual vault file when a sidebar has focus.
- A **Comments** tab in Longform stores selected-text comments per chapter locally, including jump-to-passage, resolve/reopen and delete. Comments follow a note when it is renamed. This is a native Basic AI implementation, not the Document Comments plugin's full inline margin UI.
- A note **Mention** suggester uses configurable trigger/folder/link mode; it supports explicit note creation after confirmation.
- A contextual **Editing toolbar** formats selected text with Markdown; a **Writing actions** menu provides AI-based improvement, expansion, shortening, simplification, dialogue, tone, grammar, critique and brainstorming. Proposals are reviewed before application using selective Diff.
- **Typewriter mode** centers the cursor while composing and optionally dims surrounding lines, all independently configurable.

The new tools live under **Settings → Integrated tools**. The comments UI lives inside the Longform Projects panel. This is an original implementation with distinct behavior from the referenced third-party plugins.

## Highlights

- **Selective revision (Diff):** select a passage in a Markdown editor, open the command **Basic AI: Revisar seleção com diff**, edit or paste a proposed revision or explicitly request AI generation, compare line changes, accept only the desired changes and apply them after review.
- **Safe edits:** optimistic checks reject stale selections; the existing v3 snapshot workflow records the original before applying text. Protected Markdown prevents accidental modifications to frontmatter, code blocks, inline code, comments, embeds, links, and writing-variant syntax.
- **Writing profiles:** configure per-folder instructions in **Settings → Selective review & profiles**. Add the note property **basic-ai-profile: Fantasy** to override folder matching. The most specific folder takes precedence otherwise. Profiles are included in the writing assistant and the style/beta review prompts.
- **Markdown translation guard:** translated vault files are verified against the original's protected Markdown tokens **before** a new translated note is created. Translation fails safely when these are modified.
- **Uniform UI:** scrollable side-by-side navigation tabs, more consistent native selection controls, and a responsive diff modal.
- **Migration:** the existing v2 data backup is preserved; v3 data.json is backed up once to data.v3-backup.json before the v4 schema is saved. Other settings, project data, variants and snapshots remain in their original locations.

## Using selective revision

1. Open a Markdown note and select a short passage (default limit: 2,800 characters).
2. Run **Basic AI: Revisar seleção com diff**, or open the writing tools' **Diff & profiles** tab.
3. Edit the proposed text or select **Generate with AI** (this action sends the passage to your configured provider).
4. Click **Compare** after editing a proposal; accept desired change groups and click **Apply selected changes**.
5. If the note changed since you opened the modal, applying is blocked and you need to review again.

**Note:** proposals are grouped by changed lines. The Markdown guard is deliberately strict and can reject valid-looking AI output if protected source tokens are altered. The guard can be disabled in settings at the user's discretion, but it is enabled by default. Translation creates a **new** Markdown note and does not overwrite its source.

## Verification before stable v4

- Run **npm run check** for bundle synchronization, syntax, Markdown protection, profile precedence and existing v3 features.
- Test manual flows on Obsidian Desktop and Android: selection persistence, font scaling, horizontal tab scrolling, native dropdown visibility, multiple lines/emoji, undo/redo, interrupted network requests and vault file rename.
- Check existing data.json, Longform indexes, custom prompts, templates, speech engines and v2/v3 migrations.
- Do not call the beta stable until the preview quality workflow passes and hands-on Obsidian tests pass. The preview CI packages the beta ZIP and SHA-256 hashes as workflow artifacts.

## Important technical limits

Interactive diff has a guard on line counts to prevent large UI freezes. This beta does **not** introduce bulk autonomous note editing or unattended agent workflows. It intentionally requires explicit approval of changes.
