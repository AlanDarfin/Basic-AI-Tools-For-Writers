# Basic AI Tool for Writers 4.1.1

Maintenance release focused on Obsidian community-plugin CSS validation.

- Replaced partially supported text-decoration variants with a theme-aware zigzag underline for LanguageTool highlights.
- Removed 227 `!important` declarations while increasing specificity of selected control rules.
- Replaced 12 costly `:has()` selectors with class-marked setting rows, retaining compact mobile layouts.
- Changed the multi-column warning-causing `column-gap` property to grid `gap`.
- Added regression tests and synchronized version metadata to `4.1.1`.
- Preserved desktop/mobile support for Obsidian 1.11.4+ and existing settings.

**Release tag: `4.1.1` (no `v` prefix).**

## Português

Correções de CSS para revisão na comunidade do Obsidian, preservando os destaques, os controles compactos e os dados do usuário.
