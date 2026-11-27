# Basic V16 — modernization roadmap

Status: in progress. This is a maintenance and reliability release, not a rewrite. The current CSS work lives in PR #176; Timeline PR #175 must be reconciled before release. JavaScript behavior changes have not started.

## Baseline and non-negotiable contracts

- Preserve existing settings keys, vault data, Markdown syntax, command IDs, translations, public integrations, export semantics and native Obsidian behavior.
- Keep one shipped `main.js` and `styles.css`. Treat generated portions as build products, not independent sources. The legacy prefixes outside the build markers must eventually be extracted without changing behavior.
- The current JS builder concatenates 124 listed source modules in fixed order, followed by the compiled Visual Kit bundle. It shares lexical scope and can depend on declaration order and prototype override order. Do not mechanically reorder it or convert everything to ES modules in one PR.
- No automatic deletion based on text search. Commands, dynamic renderers, settings, saved notes and external integrations may reference names indirectly.
- Separate structural moves, functional fixes and behavior changes. Keep reversible commits and document intentional differences.

## Delivery phases

| Phase | Focus | Exit criteria |
| --- | --- | --- |
| 1 | CSS foundation | Scoped tokens and native geometry; width/typography ownership |
| 2 | CSS native/mobile | Status clearance, toolbar and explorer; keyboard/unload checks |
| 3 | CSS components | Longform, Homepage, Spaces, LanguageTool; reconcile Timeline |
| 4 | CSS architecture | Ordered manifest, ownership categories, incremental file moves with byte-identical generated output |
| 5 | CSS verification gate | Full build and tests, 720p desktop/Android, themes and split panes; establish baseline |
| 6 | JS inventory and dependency audit | Module/function inventory, duplicate declarations and prototype writes, load order, commands, settings, event/observer/timer ownership; report candidates with call sites and confidence |
| 7 | JS foundation and lifecycle | Common disposal, registration, error reporting and cancellation contracts; repeated enable/disable and reload tests |
| 8 | JS component consolidation | Longform, Homepage/Spaces, LanguageTool, Toolbar, Timeline and block renderers; remove overlapping owners only with regression coverage |
| 9 | JS data and performance | Settings migration/persistence, vault scanning/indexes, debouncing, cancellation, stale async responses, bounded caches, render invalidation and mobile memory |
| 10 | JS architecture and integration | Explicit ordered source manifest, domain folders, incremental extraction of legacy runtime prefix, narrow interfaces; preserve generated order and stable source identifiers or migrate tests intentionally |
| 11 | Unified verification and release | Full clean build, syntax, static audits, regression suite, visual/runtime smoke tests, data recovery and upgrade from V15; release notes and rollback instructions |

## JavaScript workstreams

### Inventory before cleanup
- Establish baseline metrics: source/bundle size, module count, command registrations, duplicate functions/prototype assignments, top-level side effects, DOM listener/observer/timer locations, and startup/interaction measurements where available.
- Prefer a syntax-aware parser for static analysis; distinguish same-name functions in separate scopes from true collisions, and intentional overrides from accidental ones.
- Map modules to core/lifecycle, platform, editor, blocks, writing, projects, workspace, integrations, settings, persistence and compatibility. Keep this metadata independent of load order.
- Inventory build and test path consumers; do not move code solely to make folders look clean.

### Lifecycle, native UI and component contracts
- Make initialization idempotent; unregister events, DOM observers, intervals, timeouts, editor extensions, injected nodes/classes and keyboard handlers on disable/unload. Use Obsidian registration APIs where supported.
- Establish one owner for each native toolbar/status/sidebar surface and each component's rendering state; verify pane switching, active file changes, keyboard visibility, and theme changes.
- Replace competing prototype wrappers only after understanding wrapper order and preserving feature-specific hooks. Prefer small shared helpers with explicit ownership over another global monkey patch.
- Use cancellation or generation IDs for requests and asynchronous renders; stale results must not update a different note or overwrite newer state.
- Preserve accessible focus, keyboard navigation and mobile touch targets. Keep CSS/DOM contract tests in sync.

### Data safety and performance
- Centralize settings defaults/normalization/migrations progressively; preserve unknown fields, user overrides and backward-compatible keys. Serialize writes where needed, test failure and recovery.
- Keep destructive note edits explicit; preserve cursor/selection, snapshot and recovery guarantees, and user-authored data.
- Profile startup, layout changes, large vault scans, grammar review, homepage widget rendering and Longform project navigation before optimizing. Prefer incremental invalidation and bounded caches over repeated full scans.
- Avoid redundant network calls, timers, renders and observers. Respect API quotas, offline operation and cancellation. Keep sensitive provider data out of logs.
- Verify Markdown/HTML/Pandoc export parity, grammar offsets, custom block rendering and external companion integrations.

## Testing and release gates
- Build from a clean checkout and compare committed artifacts: `npm run build`, `npm run check:bundle`, `npm run check:css`, `npm run check`, `npm test`. Do not claim passes without observed output.
- Every bug fix gets a focused regression; structural-only moves require equivalence or a documented intentionally changed source marker. Add lifecycle and async-race tests.
- Test real Obsidian desktop (1280×720 and narrow splits) and Android (portrait, landscape, keyboard, native panels), light/dark and compatible third-party themes. Verify install, upgrade, disable, re-enable and unload.
- Test large vaults, settings persistence, Longform scene manipulation, Spaces switching, Homepage resize/grid, grammar suggestions and correction, exports, and external integrations independently and combined.
- Track baseline versus final metrics, but do not optimize bundle size at the cost of correctness. No feature removals or version bump without evidence and release review.
- Keep PRs small enough to bisect; merge only after relevant checks are green and integration conflicts are resolved. Tag V16 only after both gates pass.
