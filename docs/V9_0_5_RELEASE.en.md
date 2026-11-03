# Basic AI Tool for Writers 9.0.5

**Homepage, new widgets and Markdown blocks · Obsidian 1.11.4+**

## Readable recent notes

**Recent notes**, **Favorites**, and **Edited today** now present compact full-width rows with a Lucide icon, title, vault path and clear selected-note indicator. A local search filter appears when five or more files are listed. Use **Up / Down** to navigate, **Enter** to open, and **Escape** to clear the filter. Lists scroll within their widgets instead of stretching the dashboard vertically.

## Optional widgets

- **Vault gallery:** selects a random local vault image (PNG, JPEG, WEBP, GIF or AVIF), with open and reshuffle buttons. Images are loaded through Obsidian's local resource URL, not a remote service.
- **Random quote:** picks an original Basic writing quote whenever the homepage opens. Customize quotes from Settings → Homepage, one line each, optionally as `Quote text | Author`. Shuffle on demand. No external API.
- **Edited today:** compact list of Markdown notes modified since local midnight.

All three widgets are **hidden until enabled**, including in customized dashboards. Use **Add widgets** to show them.

## Larger heading

The homepage title and icon are more prominent on both desktop and mobile. Existing independent accent color options are unchanged.

## Short fenced block names

New Markdown code fence names are the function alone, without `writer-`:

| New | Legacy (still supported) |
| --- | --- |
| `tabs` | `writer-tabs` |
| `avatar` | `writer-avatar` |
| `wiki` | `writer-wiki` |
| `post` | `writer-post` |
| `chat` | `writer-chat` |
| `media-gallery` | `writer-media-gallery` |
| `folder-overview` | `writer-folder-overview` |

Already-short `longform-nav` and `insta-toc` stay the same. Gallery and folder-overview insertion commands use short names. Inline edits preserve the original fence name, so **existing notes require no conversion**.

Example:

````markdown
```wiki
title: Bonfire
type: Book
---
A story.
```
````

## Update

Back up the plugin's `data.json` file. Replace `main.js`, `manifest.json`, and `styles.css` with release **9.0.5**, then reload. Automated checks cover both new and old block names, widget migration, and bundled-file synchronization.
