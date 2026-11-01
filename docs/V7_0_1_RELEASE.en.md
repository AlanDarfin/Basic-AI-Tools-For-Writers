# 7.0.1 — Community review, security and release hygiene

Maintenance update to Basic AI Tool for Writers 7.0.0. No writing tools, project data or Pandoc capability are removed.

- Keep Pandoc **integrated**, optional on desktop, with executable-name validation, mobile guard and transparent permissions disclosure.
- Add reproducible `package-lock.json` and `npm ci` steps to the validation and release workflows.
- Publish only the three officially supported plugin files as GitHub release assets. Keep the ZIP and checksums as a workflow artifact.
- Produce GitHub provenance attestations for release assets when supported by the repository.
- Add security/privacy guidance, contributor instructions and regression tests for Pandoc and Android.
- Preserve Longform, series management, worldbuilding, writing tools, optional AI, translation, dictionary and stored preferences.

**Expected disclosure:** filesystem and process warnings may remain because desktop Pandoc still requires Node.js APIs. The scanner also controls whether network/malware checks can run.

Install/update using `main.js`, `manifest.json` and `styles.css` from the [7.0.1 release](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/tag/7.0.1). Make a backup of your vault and plugin settings before upgrading.
