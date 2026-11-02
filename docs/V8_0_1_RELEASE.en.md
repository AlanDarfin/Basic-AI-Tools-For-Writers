# 8.0.1 — Dictionary, vault indexing and Longform polish

Maintenance update for v8. Existing manuscript files, Pandoc and writing features remain unchanged.

## LanguageTool
- Removes **Go to error** from correction popups. Spelling findings show **Add to dictionary** on Android and desktop.
- This dictionary is **local to Basic AI**, stored in plugin settings. It does not upload words to the LanguageTool service. Matching is Unicode-normalized and case-insensitive.
- Added words stop producing spelling alerts and immediately disappear from existing results. Non-spelling rules and non-word spans do not expose this action.
- **Settings → Review** includes an editable list (one word per line). Books are never edited by this action.

## Longform
- Removes the unreliable **Continuity** page and its configuration toggle.
- Manuscript files and preexisting metadata are preserved. Other structural analysis tools remain.
- The Project group still contains Project, Tasks and Comments (when enabled).

## Autocomplete
- Fixes a 12,000-term budget that prematurely stopped traversing the vault.
- Shares that budget across **all eligible Markdown notes**, rather than privileging the first files. Explicit folder exclusions still apply.
- Very long notes supply a bounded text sample instead of being silently skipped. The settings counter separates eligible, indexed, failed and partially scanned notes.
- **Reindex vault**, index budget and progress now live under **Settings → Writing → Complements**, not in the sidebar.
- The number of suggestions returned remains bounded by the configured display limit.

## Validation
Regression tests cover indexing 592 notes, local dictionary persistence, mobile/desktop popup actions and removal of Continuity. Distribution remains `main.js`, `manifest.json` and `styles.css`.

[Português](V8_0_1_RELEASE.pt-BR.md).
