# Basic AI Tool for Writers 5.2.0

**Stable maintenance and workflow update** · Obsidian **1.11.4+** · Desktop / mobile · Tag **5.2.0**, without a `v` prefix.

## Longform: remember the last project

The **Writing Projects / Projetos** panel now persists the path of the last selected Longform index in local plugin settings. When reopened, the panel reselects that index rather than resetting to the first project. This also applies when switching linked Longform drafts, creating a draft, or creating a new project. The stored path follows index or parent-folder renames. If the project disappears, the panel falls back to an available Longform index.

## Longform: story identity

Open the **Project / Projeto** tab for a Longform story to manage:

- **Cover / Capa:** choose an existing image in your Obsidian vault. Supported common image formats include PNG, JPG/JPEG, WEBP, GIF, SVG and AVIF. The project shows a preview, and the source image is not moved, copied, or modified. You may remove the cover by choosing **No cover**.
- **Description / Descrição:** write a short synopsis (up to 2,000 characters) using the multiline text field and **Save / Salvar**.
- **Copyright / Direitos autorais:** select a declaration or Creative Commons license, accompanied by a concise explanation of permitted uses. Available options: not specified, All rights reserved, CC BY 4.0, CC BY-SA 4.0, CC BY-NC 4.0, CC BY-ND 4.0, CC BY-NC-SA 4.0, CC BY-NC-ND 4.0, CC0 1.0, and Public domain (verify rights).

These fields live in **`longform.cover`, `longform.description`, and `longform.copyright`** in the project index YAML/frontmatter. They are not stored in a separate, proprietary manuscript database and survive reopening or reloading the plugin. Editing a field uses the existing Longform index backup and frontmatter update workflow.

**Note on rights:** This UI records a license selection; it cannot determine who owns the copyright or whether a public-domain declaration is legally valid. Check the actual license terms before granting reuse rights.

## Settings: six clear groups

Instead of scrolling through more than 30 top-level tabs, settings now have six high-level categories and smaller context tabs:

1. **General / Geral:** global preferences, module visibility, quick profiles and diagnostics.
2. **AI & dictionary / IA e dicionário:** dictionary, translation, assistant, API providers, models and prompts.
3. **Longform:** project options and task settings.
4. **Writing / Escrita:** autocomplete, variants, integrated tools, Keyshots, cursor and view options, abbreviations, and combined **Typing & typography / Digitação e tipografia**.
5. **Markdown:** Extended/Pandoc syntax, templates, Unicode and table of contents.
6. **Review & reading / Revisão e leitura:** grammar, AI review, selective Diff, snapshots and TTS.

**Easy Typing and Smart Typography now share one settings page**, without merging their independent underlying enable/disable options. The search field continues to locate grouped settings categories and options. Navigation is responsive for 720p and phone screens and works with keyboard focus.

## Installation / upgrade

Download **Basic-AI-Tool-for-Writers-5.2.0.zip** and replace only `main.js`, `manifest.json`, and `styles.css` in `.obsidian/plugins/basic-ai-tool-for-writers/`. Keep your existing `data.json`. Back up your vault before updating.

No retired Editing Toolbar was restored; existing dictionaries, projects, AI setup, prompts, syntax tools and custom writing profiles are preserved.

## Testing and known limits

The GitHub release workflow runs automated syntax, bundle consistency, feature regression and Obsidian CSS checks, validates version metadata, and packages ZIP and SHA256 checksums. The new unit tests cover persisted selection, renames, vault image filtering, story metadata edits, copyright labels, grouped settings and translation hooks.

Real-world desktop and Android validation, different themes and complex vault paths are not guaranteed by unit tests. The metadata selector uses existing vault image paths, so a removed/moved image may temporarily show **Cover not found** until another image is chosen.

## Portuguese

Confira também o [README em português](README.pt-BR.md) e o [README principal em inglês](../README.md).
