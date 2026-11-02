# 7.2.0 — Pre-v8 stability improvements

Maintenance across Typewriter Mode, writing-tools navigation, and LanguageTool compatibility.

## Android Typewriter Mode
Touch and virtual-keyboard input now activate the current-line highlight in the editable CodeMirror view; touch scrolling suspends it. Remember Cursor Position never activates a highlight on automatic restoration. Reading View has no editable cursor and is not covered.

## Writing tools sidebar
Suggestions, Variants, Diff & profiles, Versions and Extras now keep a persistent horizontal tab strip when switching content. Full pane rebuilds still retain the strip offset after buttons are created.

## Built-in LanguageTool
After the initial review, automatic checking on ordinary edits targets just the changed paragraph when a trustworthy previous review is available, retaining unaffected marks and rebasing their offsets. Accepted corrections remain sentence-first. Concurrent changes and oversized paragraphs safely fall back to the existing checking workflow. Inspired by the paragraph-checking approach documented by [Language Tool Advanced](https://github.com/DuckTapeKiller/language-tool-advanced), with independent implementation.

## Optional external LanguageTool
Select [wrenger's LanguageTool](https://github.com/wrenger/obsidian-languagetool) in the Review pane if it is installed and enabled. Basic suspends its own grammar calls and provides sidebar actions for check, clear, next suggestion, auto-check toggle and external settings. The external plugin still owns its underlines and suggestion menus. No external source or credentials are bundled. This best-effort bridge uses Obsidian's internal plugin registry and can require future compatibility fixes; the external plugin may require a newer Obsidian version.

No manuscript, Longform, Pandoc or vault-file format changes. Please test on your actual device after the automated suite passes.

[Português](V7_2_0_RELEASE.pt-BR.md).
