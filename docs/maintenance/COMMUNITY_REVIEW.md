# Community review maintenance — 7.0.1

This maintenance addresses automated Obsidian community scans without hiding required capabilities. / Manutenção dedicada à revisão automatizada da comunidade sem ocultar recursos necessários.

| Finding | Action | Expected result |
| --- | --- | --- |
| Node.js `fs` / `child_process` | Keep integrated desktop Pandoc, validate executable name, keep mobile guard, document permissions | **Warnings may remain** by design |
| Missing lockfile / build verification | Commit `package-lock.json`; use `npm ci` in both CI and release workflow | Reproducible build checks |
| Missing artifact attestations | Attest three release files and convenience ZIP using GitHub Actions OIDC | Provenance for new releases when available |
| Unsupported release attachments | Publish `main.js`, `manifest.json`, `styles.css` only; put ZIP/checksums in Actions artifact | Three supported attachments on new releases |
| Missing contributor instructions | Add bilingual `CONTRIBUTING.md` | Improved repository hygiene |
| Vault enumeration | Required for project and Longform indexing | Informational disclosure remains |
| Clipboard | Used by user-triggered tools; document its use | Informational disclosure may remain |
| Malware/network scan unavailable | Controlled by scan provider, not necessarily the repository | Not guaranteed to turn green |

## Checks before publication

Run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run check` and `node --test tests/css-community-lint.test.cjs`. After merging the validated PR, create a stable tag **7.0.1** (without `v`) on that commit. The tag workflow validates, attests and publishes the release.

The release should expose **exactly three file attachments**. The ZIP and SHA256 checksums are available in the corresponding GitHub Actions workflow run (subject to GitHub's artifact retention). Previous release assets remain unchanged.

## Android

Pandoc is blocked on mobile before Node.js APIs load. Automated tests cover the guard, source/bundle consistency, version alignment and existing mobile behaviors. They do not replace manual testing on a real Android device.
