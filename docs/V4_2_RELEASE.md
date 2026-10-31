# Basic AI Tool for Writers 4.2.0

A mobile-friendly typewriter highlight fix and integrated cursor position memory.

### Fixed: Typewriter line highlight
- The current line receives a CodeMirror line decoration that follows the actual selection on desktop and mobile. The highlight no longer depends solely on Obsidian's native `.cm-activeLine` state.
- Focus mode dims non-active lines while keeping the cursor line fully legible.
- No extra mobile toolbar is introduced.

### New: Remember cursor position
- Locally saves the last cursor (line/column), selection and scroll position for each Markdown note.
- Restores positions on reopening notes and on workspace startup, skipping direct heading/anchor navigation.
- Includes a dedicated **Cursor position** settings tab, independent visibility toggle, selection and scroll controls, a bounded database, a clear button and two commands (restore/forget current note).
- Keeps existing notes and settings intact. No dependency on the third-party Remember cursor position plugin; independent implementation based on the same concept.

### Release validation
- Obsidian 1.11.4+; desktop and mobile.
- Automated syntax, source-bundle synchronization, regression and CSS lint checks.
- The GitHub release tag is exactly **`4.2.0`**, without a `v` prefix.

## Português
Corrige o realce da linha ativa na Máquina de Escrever no Android e no PC, e adiciona a memória local de posição, seleção e rolagem do cursor em cada nota. Configure em **Configurações → Basic AI Tool for Writers → Posição do cursor**.
