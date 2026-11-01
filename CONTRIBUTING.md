# Contributing to Basic AI Tool for Writers

Thanks for helping improve this writing workspace. / Obrigado por contribuir com este espaço de escrita.

## Development / Desenvolvimento

1. Use Node.js **22**; run `npm ci --ignore-scripts`.
2. Edit relevant `src/v*/` modules (or `projects.js`), not only the generated `main.js`.
3. Run `npm run build`, `npm run check`, and `node --test tests/css-community-lint.test.cjs`.
4. Test in an isolated vault. For mobile changes, check Android too; Node.js-only desktop APIs require an `app.isMobile` guard **before** use.
5. Keep UI and documentation bilingual (English and pt-BR); add regression tests.
6. For new stable versions update manifest, package, lockfile, versions.json, both READMEs, release notes and pinned tests. Stable tags are `X.Y.Z`, without `v`.

**Release attachments:** only `main.js`, `manifest.json`, `styles.css`. The convenience ZIP and checksums are available as a GitHub Actions workflow artifact.

**Security:** never commit API keys, private vault content or personal data. Describe new network endpoints, clipboard access or OS-level permissions. Report vulnerabilities privately per [SECURITY.md](SECURITY.md).

## Pull requests

Describe the problem, include reproducible steps, add screenshots for UI changes, and ensure automated checks pass. Preserve user settings and manuscripts. Avoid unrelated refactors.

**Português:** use Node 22, `npm ci`, altere os fontes, regenere `main.js` com `npm run build`, execute os testes e confira Android quando aplicável. Consulte [as notas de revisão](docs/maintenance/COMMUNITY_REVIEW.md).
