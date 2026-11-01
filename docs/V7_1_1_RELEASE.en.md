# 7.1.1 — LanguageTool suggestion menus on hover or caret

Improved triggers for the existing grammar suggestion popup.

- **Desktop hover:** briefly hover over LanguageTool-highlighted text to open its correction menu, even if the text caret is elsewhere.
- **Text caret:** clicking an error or navigating into it with arrow, Home or End keys also opens the menu.
- **Mobile:** tapping highlighted text remains supported, without relying on hover.
- **Stability:** short hover delay prevents accidental opens, canceled timers prevent a popup after leaving the editor, and an already open menu for the same finding is reused rather than recreated.
- **Network usage:** the trigger only displays already cached LanguageTool suggestions; it sends no new API requests.
- **Settings:** still controlled by the existing floating suggestion toggle in Review settings.

Compatible with incremental LanguageTool rechecks from 7.1.0, ignored rules, Remember Cursor Position, Longform and integrated Pandoc.

Update the official `main.js`, `manifest.json` and `styles.css` together.

[Português](V7_1_1_RELEASE.pt-BR.md).
