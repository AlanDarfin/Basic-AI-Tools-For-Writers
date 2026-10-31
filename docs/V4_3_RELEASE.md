# Basic AI Tool for Writers 4.3.0

## Editing Toolbar retired

- Removed the experimental Editing Toolbar on desktop and mobile.
- Removed the six extra Markdown formatting commands (bold, italic, heading H2, blockquote, list, link) and the toolbar-opening command from the command palette.
- Removed the formatting dialog, floating selection listeners, toolbar settings and obsolete CSS.
- Discards saved settings from the retired toolbar on upgrade without changing other preferences or notes.

**Use Obsidian's built-in formatting commands and native mobile toolbar instead.** Dedicated Basic AI writing/AI commands, LanguageTool, selective diff, the typewriter current-line highlight and cursor position memory remain available.

## Maintenance

- Updated English and Portuguese READMEs and installation links.
- Updated `manifest.json`, `package.json` and `versions.json`.
- Rebuilt the distributed `main.js` from the updated v4 integration.
- Updated regression tests to confirm removed UI and commands do not return.
- Automated release checks: syntax, source/bundle synchronization, regression tests and community CSS lint.
- Requires Obsidian 1.11.4+; desktop and mobile.
- GitHub release tag: **`4.3.0`**, without the `v` prefix.

## Português

A **Editing Toolbar** foi removida do PC e do celular, incluindo a interface flutuante, os comandos extras de formatação, as opções e os estilos. Para formatar texto, utilize a barra e os comandos nativos do Obsidian. As ações de IA, o LanguageTool, o modo Máquina de Escrever e a memória de posição do cursor continuam disponíveis.
