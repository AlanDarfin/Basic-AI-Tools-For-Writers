# Visual Kit embedded in Basic

Source: [Visual Kit 0.9.1 by pedrof](https://github.com/pedrohf-dev/visual-kit/tree/ff4274caa4669aa0f95b05c4246bb5ce26abf9e3). MIT, see LICENSE. The upstream npm lockfile pins the dedicated build. Fonts, images, templates and annotations use the vault. The build is included in Basic’s main.js, not loaded from the network in Obsidian.

Local changes: Basic owns the lifecycle and settings persistence, with namespaced commands and HTML view. The original enabled plugin takes precedence. Automatic HTML association, automatic rich copy, and remote clipboard image downloads are off by default. Pasting enforces per-image and per-batch limits. Native browser/Electron features remain on desktop.

For capabilities and formats see the [upstream HTML notes guide](https://github.com/pedrohf-dev/visual-kit/blob/ff4274caa4669aa0f95b05c4246bb5ce26abf9e3/docs/html-notes.md). Run `npm run build` from Basic's root to build the installable files.
