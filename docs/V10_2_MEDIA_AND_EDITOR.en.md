# Version 10.2.0 features

## Mobile Spaces

The collection manager now shows left-aligned icon/name/path cards, single-column on small mobile screens, with search, Cards/List/Table/Board toggles and 24-note pages. The header contains Create, Edit and ⋯ actions; deleting a Space never deletes notes.

## Native property actions

Each property row has a ⋯ menu: Hide in this note; Hide in all notes; Pick property icon; Reveal concealed fields. The eye control in native metadata toggles hidden fields. Underlying YAML is not changed.

## Chat styles and transcription

~~~~markdown
~~~chat
title: Example
background: transparent
bubble-color: blue
density: compact
[Me=green, Me=bubble:cyan]
[Maria=purple, Maria=bubble:orange]

> | Me | Hello | 14:30
< | Maria | Hi | 14:31
> | Me | [audio:0:02:test test test] | 14:34
~~~
~~~~

background: transparent removes the conversation panel. bubble-color sets a default bubble color; per-speaker bubble options override it separately from name colors. The voice transcript is fictional, author-supplied text, not microphone audio.

## Explorer thumbnails

Priority: banner, cover, image, thumbnail, embedded local pictures, and explicitly linked HTTPS image URLs. Direct links with www. become HTTPS. Loading external images may share your IP address with the image host; disable external thumbnails in the Explorer settings for vault-only behavior.

## Integrated image finder

Commands: Images: search and insert into editor; Images: search and set banner/property. Wikimedia Commons requires no key. Pexels, Pixabay and Unsplash require personal API keys. Requests go directly to the providers, never through the upstream Image Inserter proxy. Choose orientation, save to vault or insert an HTTPS URL. Downloads accept JPEG/PNG/GIF/WebP up to 8 MiB.

Respect photo licenses and attribution. Queries and thumbnails use your network connection. API keys stay in unencrypted local plugin data. This is a photo finder, not AI image generation.

## Lightweight non-codeblock alignment

Markers must occupy their own line. Short aliases or full names work.

~~~~markdown
::l[Left]
::c[**Centered**]
::r[*Right*]
~~~~

Reading mode hides the markers; Live Preview aligns text and hides delimiters when the line is not active. The syntax avoids ambiguity with table pipes, URLs and Markdown escaping.

## Compatibility

No forced vault migration or destruction of Markdown frontmatter. Test appearance with custom themes and Android WebViews.
