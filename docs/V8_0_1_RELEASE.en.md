# Basic AI Tool for Writers 8.0.1 — Review dictionary and complete vault coverage

This patch follows 8.0.0 and focuses on the Android review popup, Longform navigation and a less crowded writing sidebar.

- **LanguageTool popup (desktop and Android):** remove the redundant **Go to error** action inside the popup. A mark already identifies the finding. For a single word, add **Add to dictionary**. The word is normalized, stored in the plugin's **local personal proofreading list**, hidden immediately from the active review and filtered from later full or incremental checks. It does not edit Markdown, the AI definition dictionary `Dicionario.md`, or the LanguageTool server's dictionary.
- **Manage ignored words:** edit the list under **Settings → Review → Proofreader personal dictionary** (one word per line). This supports removing previously added words.
- **Longform:** remove the ineffective **Continuity** page and its toggle. Leave plot structure, independent dependency checks and other project tools intact.
- **Vault indexing:** fix the previous early stop caused by a single global 12k-word cap and the omission of oversized notes. Every nonexcluded Markdown note now receives a bounded share of the term budget; large notes contribute a bounded prefix. Previously saved default caps are migrated to 120k total terms.
- **Cleaner tool sidebar:** move reindexing, word budget, per-note text limit and a coverage summary to **Settings → Writing → Complements**. The command palette reindex shortcut remains available.
- **Performance:** bound retained token caches and avoid allocating full vocabulary maps for many files.

Limitations: ignored folders are intentionally omitted; per-note sampling does not guarantee that every unique word deep in very long manuscripts is included. Test UI changes on physical Android devices.

Download `main.js`, `manifest.json` and `styles.css` from this release together.

[Português](V8_0_1_RELEASE.pt-BR.md).
