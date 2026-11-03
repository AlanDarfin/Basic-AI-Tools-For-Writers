# Basic AI Tool for Writers 9.2.2

## AI chat bubbles
- Fixes the user bubble alignment to the **right** while assistant messages remain on the left.
- Prevents the fictional-chat `row-reverse` rule from overriding the AI chat alignment.
- No changes to API keys, AI providers or model generation.

## Explorer previews
- Descriptions are now placed as **siblings below** the native file/folder title row.
- Prevents concatenation like `WorkTest` on mobile.
- Preserves Folder Notes actions, note favorites, nested-folder indentation and local image thumbnails.
- Retains the show/hide preview toolbar control and the existing preview scope settings.

## Unified Iconic-style customization
- Reusable icon gallery for homepage icon, favorite symbol and per-file/per-folder icons.
- Searches all Lucide icons available in Obsidian, with large selected-icon preview and highlighted selection.
- All/Favorites/Recent tabs; pin preferred icons for reuse.
- HEX color customization and restore-to-theme behavior.
- Existing icon settings and choices remain intact.

## Verification
Regression tests and synchronized standalone `main.js` and `styles.css`. Real Android/desktop Obsidian visual testing is recommended.
