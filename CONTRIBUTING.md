# Contributing to Basic AI Tool for Writers

Thanks for helping improve the project. Please open an issue before starting major changes.

## Setup

- Use Node.js 22 (or a compatible maintained release).
- Run `npm ci --ignore-scripts` to install from the committed lockfile.
- Run `npm run check` and `node --test tests/css-community-lint.test.cjs tests/community-release.test.cjs` before submitting a PR.
- Run `npm run build` if you changed a source module. Commit any generated `main.js` or `projects.js` changes alongside the source changes.
- Test both desktop and Android where applicable; include manual test steps for UI work.

## Release process

Change `package.json`, `package-lock.json`, `manifest.json`, and `versions.json` together. Update English and Portuguese release notes. Never include a `v` prefix in the manifest version or release tag. Stable Git tags trigger validation and upload exactly three official plugin assets: `main.js`, `manifest.json`, `styles.css`. Additional development files belong in the source repository, not the release assets. GitHub build provenance attestations are generated separately.

## Security and privacy

See [SECURITY.md](SECURITY.md). Do not log API keys, complete manuscripts, or clipboard contents. Prefer Obsidian's vault APIs over direct filesystem access. The optional Pandoc export is the single documented desktop-specific case; never run external commands from untrusted input. Do not add new network endpoints without documenting their purpose, consent and scope. Preserve non-destructive behavior and backwards compatibility with existing vault data.

Please keep changes focused and provide reproduction steps when fixing bugs.
