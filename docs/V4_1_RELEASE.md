# Basic AI Tool for Writers — v4.1.0

**Stable release · English localization and documentation**

## English

Version 4.1.0 completes the English localization pass for the plugin's built-in writing interface. The work covers Longform scenes and nested chapters, project creation, compilation workflows, notebook management and goals; variant dialogs; local snapshot/history operations; autocomplete settings; selective Diff prompts; and user-visible status and error messages.

### Highlights

- **Consistent English controls** when Obsidian is set to English, with Brazilian Portuguese retained when the application language starts with `pt`. English remains the fallback for other locales.
- **Longform compatibility:** legacy internal names such as `Principal`, `Padrão` and `Índice.md` are retained to avoid breaking project indexes, but the built-in draft and workflow selector labels now show the English names *Main* and *Default*.
- **Revision and history:** English actions and confirmation dialogs for variants, selective Diff, snapshots and compilation.
- **Regression tests:** locale switching, localized dialogs and persisted identifiers are checked automatically alongside the existing suite.
- **Manifest and documentation:** updated to 4.1.0, with current feature coverage in the [English README](../README.md) and [Portuguese guide](README.pt-BR.md).

### Core functionality carried forward from v4.0.0

All 17 optional UI module categories, LanguageTool auto-checks, note mentions, project comments, text-to-speech, Unicode, typewriter focus mode, writing variants, local snapshots, AI editing tools and native Android formatting commands remain available.

### Installation and upgrade

1. Make a backup of your Obsidian vault and plugin folder.
2. Download the installable ZIP from this release.
3. Replace **main.js**, **manifest.json** and **styles.css** inside `.obsidian/plugins/basic-ai-tool-for-writers/`.
4. **Do not overwrite or delete `data.json`**; it stores saved prompts, settings and API credentials.
5. Reload Obsidian and test LanguageTool, existing Longform projects and any custom AI providers you use.

### Known operational limitations

- Project names, user-authored notes, imported snippets and custom prompts are user data and are not translated automatically.
- Online LanguageTool, AI models and neural TTS send text to their configured third-party services when enabled. Native Android TTS requires the WebView to expose the Web Speech APIs and may remain unavailable on some devices.
- Translation of manuscript text is a separate feature; its supported languages depend on the selected AI provider and model.

## Português (Brasil)

A **v4.1.0** conclui a revisão da localização inglesa dos textos integrados do Basic AI, incluindo os controles do Longform, criação e organização de capítulos, workflows de compilação, variantes, snapshots, Diff, configurações de autocomplete e mensagens de erro.

Os identificadores internos de projetos existentes — por exemplo, `Padrão` e `Principal` — continuam intactos por compatibilidade. Somente os rótulos de interface exibidos ao usuário são traduzidos. A versão mantém todos os recursos da 4.0.0.

Para atualizar, faça backup do cofre e substitua os três arquivos do plugin, **mantendo seu `data.json`**.

**License:** MIT. Source and [third-party notices](../THIRD_PARTY_NOTICES.md) remain available in the repository.
