# Basic AI Tool for Writers — 9.2.3

## Fixed

- **Homepage title:** an incorrectly escaped regular expression in the settings input accidentally stripped lowercase `r` and `n` characters. Title normalization is now shared between settings and initialization and preserves all letters, accents, symbols, and emoji; only actual line separators and control characters are sanitized. Previously damaged saved titles must be entered again once.
- **File Explorer:** favorite icons now align vertically using the real item-row height rather than a fixed top offset. Android maintains a generous touch target.
- **Desktop homepage:** Lucide and custom-image icons are larger relative to the heading text. Letter spacing, line height, and overflow are adjusted for reliable glyph rendering without changing the mobile column layout.

## Verification

Regression coverage tests uppercase and lowercase alphabets, accented letters, Unicode text, numbers, symbols, line breaks, and distribution asset synchronization.

Source audit found one incorrect title-input regular expression. Other escaped character classes are intentional for path handling and Markdown syntax and remain unchanged.
