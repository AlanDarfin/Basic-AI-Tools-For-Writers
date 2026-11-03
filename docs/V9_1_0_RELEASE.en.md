# Basic AI Tool for Writers 9.1.0

## Integrations

- **Desktop Soundscapes:** a radio catalogue based on the original project's stations, custom YouTube playlists, a vault audio library, bottom status-bar controls, volume, skip controls and a homepage widget with station selector and visual preview. The homepage stays modular; both controls share playback state.
- **Click Clack:** desktop-only keyboard sounds with locally synthesized click defaults, volume controls and support for locally installed WAV packs using the upstream scheme manifest. Settings are under writing.
- **Flexplorer:** per-folder sorting, Alt + drag custom order, pinned and hidden items, hide globs and extended native Explorer context menus with no duplicated sidebar.

## Interface and maintenance

- Assistant messages follow Basic's own fictional dialogue style, with aligned bubbles, compact header, composer and Markdown responses.
- Provider, model and prompt settings use consistent theme-aware layouts, including narrow windows.
- English and Portuguese READMEs present current features and practical examples. Release history remains in separate documents.
- Manifest and distributed JavaScript/CSS updated; new 9.1 integration tests added.

## Compatibility and limitations

Typing audio and radio playback work on desktop only. Other features remain available on mobile. Video radios are provided through YouTube and require an internet connection; availability depends on the external player. No third-party media ships with Basic. The original File Explorer remains in place and hidden items are never deleted. All integrations are independent implementations inspired by their cited projects.

Back up your vault and plugin settings before upgrading. Verify the desktop player and WAV schemes on your own system.