# Basic AI 8.0.1 — Personal dictionary, full index coverage and Longform cleanup

Maintenance update based on Android reports.

- **LanguageTool:** remove `Go to error` from the desktop and Android suggestion popup and add `Add to dictionary` for individual words. The Basic AI spelling allowance list is stored locally, requires no premium LanguageTool account, and suppresses accepted-word findings in current and subsequent checks. You can edit or remove the words in review settings. No manuscript text is changed.
- **Longform:** remove the nonfunctional `Continuity` tab and setting. Existing manuscript and settings data are preserved.
- **Autocomplete:** no longer stop scanning when the shared vocabulary budget is exhausted. Every eligible Markdown note receives a share of indexed terms. Large notes use opening/closing samples to keep memory bounded; not every term of a very large note is necessarily indexed.
- **UI:** move the reindex action to plugin autocomplete settings only; show eligible, indexed, failed and partially sampled note counts. Writing-tools sidebar has fewer buttons.

The index includes Markdown notes, excluding user-configured folders; counts are not expected to match all vault files including attachments. The personal dictionary is local to Basic AI, not a remote LanguageTool account dictionary.

[Português](V8_0_1_RELEASE.pt-BR.md). Install `main.js`, `manifest.json` and `styles.css` together.
