# Basic V16 — modernization roadmap

Status: in progress. This is a maintenance and reliability release, not a rewrite. The current CSS work lives in PR #176; Timeline PR #175 must be reconciled before release. Targeted JavaScript lifecycle changes started in Phase 7.

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

## Checkpoint — end of independent CSS migration

- CI #1373 validated the preceding 47/53-module layout with 178/178 regression files, bundle synchronization, CSS lint, metadata and package smoke tests.
- The subsequent three content-identical moves leave 50/53 sources categorized. Only the two Timeline modules and Homepage widgets are deferred until PR #175 is reconciled. The current branch manifest matches the complete CSS filesystem inventory and its original basename order; the latest clean CI and visual checks remain pending.
- Do not consider Phase 5 complete until Timeline integration, a clean final CI and real Obsidian desktop/mobile checks are recorded. Read-only JS inventory can begin without changing runtime behavior.

### Preliminary JavaScript baseline (Git tree, 2026-11-27)

The ordered builder references 124 existing source modules, totaling 2,199,898 bytes on disk. The distributed main.js is 3,399,954 bytes, including legacy runtime and bundled code. These are uncompressed source sizes, not measured startup cost or memory usage.

| Source group | Modules | Bytes |
| --- | ---: | ---: |
| v3 | 7 | 147533 |
| v4 | 5 | 99291 |
| v5 | 10 | 135627 |
| v6 | 7 | 86721 |
| v7 | 5 | 109498 |
| v8 | 12 | 229243 |
| v9 | 20 | 477027 |
| v10 | 24 | 333456 |
| v11 | 5 | 67649 |
| v12 | 7 | 110446 |
| v13 | 22 | 403407 |

Largest listed modules: settings-search-index (105613 B), writing-home (85456 B), final-suite (56937 B), explorer-flex (46376 B), smart-spaces (43813 B), context-toolbar (43587 B), longform-studio (40874 B). Size alone is not evidence of duplication or performance problems; generated indexes must be distinguished from handwritten implementation.

Phase 6 next deliverable: a reproducible read-only module/declaration/lifecycle inventory, with source locations and an explicit distinction between lexical duplicates, intentional overrides and unverified candidates. Preserve builder order and runtime files. No dependency upgrades or code deletion as part of the initial inventory.

## Phase 6.1 — syntax-aware read-only inventory

- CI #1377 passed all validation stages on the 50/53 CSS migration checkpoint. The three Timeline-dependent CSS paths still await PR #175 and real Obsidian visual QA.
- New `scripts/js-v16-audit.js` parses the distributed JS with the existing pinned Visual Kit TypeScript development dependency; it never executes the plugin or modifies the bundle. No new dependencies.
- Verify all 124 ordered source slices and the compiled vendor block against the actual bundle before analysis. Map authored sites to source path, source line, bundle line and nearest function owner. Exclude the generated Visual Kit bundle from candidate counting; identify the generated settings search index separately.
- Inventory named top-level function/class/variable declarations, repeated top-level names, prototype assignment targets, literal and dynamic command registration sites, and syntactic lifecycle/data candidates (listeners, observers, timers, registrations, cancellation, data saves).
- Reports are leads for manual review, not proof of leaks, duplicate runtime registrations or dead code. Receiver aliases, indirect calls, conditional execution, computed keys and destructuring are not fully resolved. No cleanup or runtime refactoring has been performed.
- Run `npm run build` then `npm run audit:js` for the summary or `npm run audit:js -- --json` for the full inventory. CI runs the audit and dedicated regression fixture file. Syntax and exact source/bundle mismatches fail validation; candidate repetition does not.
- Next: inspect the real report, prioritize confirmed lifecycle and prototype ownership conflicts, map registrations to disposal paths, and record baseline counts before implementing Phase 7.

## Phase 6.2 — first real audit and review queue

- CI #1379 succeeded with 179/179 regression files. The first real inventory found 1,508 named top-level declarations, 203 command sites (16 dynamic), eight direct prototype writes and 1,940 lifecycle/persistence call sites; no repeated top-level names, literal command IDs or direct prototype targets in recognized patterns.
- [Baseline and prioritized review queue](V16_JS_AUDIT_BASELINE.md) records the evidence, limitations and source locations. Startup callbacks, reading-progress teardown, native menu wrapper ownership and explorer sorting are initial targets.
- Extend the analyzer to report prototype aliases, computed writes, deferred layout callbacks and lifecycle module rankings. Add a regression fixture for aliased/conditional/dynamic writes and shadowed function parameters. New CI must validate this expanded inventory.
- The reading-progress teardown gap is visible in source: outstanding delayed work can recreate DOM after unload. Fix in Phase 7 with cancellation, a stopped guard and deterministic regression tests; no runtime changes in this audit pass.

## Phase 7.1 — lifecycle protection for startup and reading progress

- CI #1381 passed the expanded static audit. Add explicit per-registration session ownership for Homepage startup and reading progress, preventing duplicate setup on one live plugin instance.
- Startup callbacks now refuse stale work before layout and after awaited Homepage activation; no further restored tabs are detached after unload. An already dispatched view activation cannot be undone. Manual confirmation also checks the active session.
- Reading progress now coalesces delayed file-open updates and animation frames, cancels both on unload, clears its owned refresh hook, and ignores stale callbacks even if dispatched despite cancellation. Use the owning window for animation frame methods; remove stale pane marker when disabled or no scroller.
- Add deterministic regression cases for duplicate registration, cancellation, late callbacks, reload and normal startup. Update the authored modules and their exact generated main.js sections in the same commit. No CSS or dependency changes.
- Runtime Obsidian visual/interaction checks and new CI remain pending; other deferred initialization, native menu wrappers, explorer and Homepage rendering remain future review areas.

## Phase 7.2 — native menu wrapper ownership

- CI #1382 passed Phase 7.1. Shared disposable method patches now cover the editor and explorer permanent native menu interceptors. Preserve installation order, native receiver, arguments, return values and errors.
- Out-of-order cleanup skips inactive Basic layers. A third-party wrapper retaining an old Basic wrapper is preserved; the inactive wrapper forwards without running Basic logic.
- Editor registration is idempotent per live session and stale listeners cannot tag menus. Temporary mobile relay hooks retain their existing synchronous ownership-checked finally restoration.
- Add four lifecycle regressions and synchronize both source edits in main.js. No CSS, dependency, command ID or settings changes. Explorer sort adapters and deferred refresh callbacks remain a separate follow-up. Full new CI and real Obsidian visual/runtime QA pending.

## Phase 7.3 — explorer lifecycle

- CI #1383 passed Phase 7.2. Use disposable native sorting adapters and deduplicate sort setters by actual owner, not folder-list owner. Native sorting passes through when disabled.
- Guard registration, late layout callbacks, stale observer notifications, timers and vault rename/delete callbacks with live session ownership. Coalesce refreshes without dropping a pending native sort. Cancel timers, observer and drag state on unload.
- Restore explorer concealment and draggable attributes, clear owned visibility classes, pin indicators and Space markers. Restore prior inline display only when Basic still owns the hidden value. Existing CSS fallback ordering cleanup remains.
- Add three regression fixtures and synchronize main.js. Full new CI, live Obsidian QA and broader stale asynchronous menu-action review remain pending.

## Phase 7.4 — Homepage lifecycle

- CI #1386 completed successfully on the previous Homepage lifecycle checkpoint. Real Obsidian desktop/Android and integration QA remain pending.

## Phase 7.5 — asynchronous draft export (first pass)

- Quick drafts previously cleared the currently selected slot after an awaited vault write. Capture the original slot and text, keep the note creation explicit, and clear only an unchanged snapshot owned by the live render. Switching tabs, editing or closing the view retains the draft. A failed settings save restores the owned snapshot without overriding newer edits. Stale renders do not update controls or navigate.
- Four focused deterministic async fixtures cover normal export, tab switching, newer edits/closed view and failed persistence. No CSS, settings schema, command ID or dependencies changed. Full CI, native navigation and third-party integration review remain pending.

## Phase 7.5 — navigation continuation and regression repair

- CI #1387 rebuilt successfully and passed 179/180 regression files; the sole failed file was a historical quick-draft static assertion requiring the old explicit vault receiver. Update both path-creation assertions to match the extracted helper, retaining their behavioral intent. The lifecycle tests passed in CI.
- Native slash search and the Surfing/Web Viewer/external fallback chain now accept an optional live-render predicate. After an awaited view activation, stale callers cannot focus, start another fallback or surface a stale notice. Already-dispatched native activation cannot be cancelled. Existing callers without a predicate retain their behavior.
- Homepage search and bookmark buttons reject stale/repeated in-flight actions. Three async regression fixtures cover late success/failure and normal external fallback. No CSS, dependency or settings changes; third-party private header lifecycle and real visual QA remain pending.

### Phase 7.5.2 — CI fixture follow-up
- CI #1388 rebuilt the bundle but reported 178/180 regression files passing. The bookmark DOM mock now models `isConnected` and awaits its asynchronous click handler; a detached-widget and duplicate-click regression fixture exercises the new guard. The native slash-search static contract now matches the explicit live-render predicate. Production sources and shipping bundle are unchanged in this follow-up. Full CI and real Obsidian QA remain pending.

### Phase 7.5.3 — deferred optional integrations (first pass)
- The v10.7 integration startup now owns a cancellable timer and one session token. Repeated layout-ready events coalesce; pending registration is cancelled on unload and stale callbacks cannot register modules in a later startup session. A layout-ready exception cannot enqueue a duplicate registration. Already-registered integrations are not registered again.
- Added three deterministic lifecycle fixtures for repeated readiness, unload/requeue and readiness exceptions. The generated main.js contains the exact updated source region. No CSS, settings schema, dependencies or command IDs changed. Full CI, real desktop/Android QA and private Surfing header teardown remain pending; this pass does not claim cancellation of already-started external requests or teardown of every registered integration.

### Phase 7.5.3 — native Surfing header ownership
- CI #1390 passed the deferred integration startup checkpoint. Home now owns its native Surfing host, detaches its own input listener, blurs the input before removing the host and rejects stale input callbacks. Disposal runs before a full render, on view close and after partial mount failures. Replacing the enabled Surfing instance also triggers a remount.
- Upstream inspected at PKM-er/Obsidian-Surfing@1bf883852e2e068dc74deec97a3b76a64849e8e0: the private `addHeaderAndSearchBar` does not return a HeaderBar disposer; its TextInputSuggest closes on blur. Basic deliberately does not patch global keymaps, delete other suggestion containers or claim complete disposal of private upstream internals. Real Obsidian desktop QA and external request lifecycle remain pending.
- Four focused regression fixtures cover remount/query preservation, partial failure, provider replacement and view close. Source and generated bundle updated together; full CI pending.

### Phase 7.5.4 — Zotero and iCalendar continuations

- CI #1391 passed the native Surfing header checkpoint. Zotero now drops late responses after a modal closes, the plugin unloads or its library settings change. Pagination, import and CSL export check their current session before dispatching more work. Closing a prompt clears the temporary credential from the input. Startup commands retained from earlier sessions are inert.
- Manual and automatic calendar sync share an in-flight run. Feed edits, disabling subscriptions or unloading the plugin stop further imports and suppress stale notices. The automatic timer is cleared on its original window. Network requests and vault writes already dispatched can finish, and existing imported notes are preserved.
- Six Zotero and five calendar regression cases exercise overlapping requests, restored configuration, close, reload, and partial imports. The runtime bundle was rebuilt from the updated source files.

## Phase 8 — Longform and Spaces ownership

- Longform renders arc dividers directly from the scene view and applies anchor changes after successful native frontmatter writes. Local variants save scene and anchor edits together. Removed two prototype wrappers, retaining chapter hierarchy, divider positions, controls, and draft-local preferences.
- The shared selection controller updates Spaces UI after a switch or rollback. Sidebar and dock actions reuse that refresh. Selecting the current Space in the sidebar still clears its search locally.
- Focused coverage passed for scene ordering, failed saves, concurrent divider moves, variant edits, and mobile Space switching. Broader component review remains open for Homepage, LanguageTool, Toolbar, Timeline and block renderers.

## Phase 9 — connection persistence and task scans

- Scope LanguageTool connection writes to one active save per plugin instance. A rebuilt settings panel waits for the pending write. Failed writes restore only the fields still owned by that operation and leave newer values intact.
- Superseded task dashboard scans finish the current batch of reads and skip the remaining obsolete batches. A single replacement scan reads the latest limits and publishes current results. A regression fixture with 37 notes and a 13-note replacement observed 25 reads instead of 50 for that case.

## Phase 10 — ordered JavaScript manifest and extraction pilot

- The build and audit share `scripts/js-manifest.js`. The manifest preserves the 124 module markers and their order. Stable marker IDs resolve to physical paths and domain metadata independently.
- Moved Pandoc compatibility into `src/compat/` and extracted the 40-line legacy dictionary section into `src/writing/`. A rebuild against the same sources produced byte-identical `main.js`. The remaining legacy runtime and source relocations can move incrementally with the same equivalence checks.

## Phase 11 — pre-release verification

- Rebuilding the Phase 7.5.3 checkpoint restored three Homepage layout declarations in `styles.css` from the existing CSS sources. CI compares tracked build artifacts immediately after compilation so a stale distributable fails the check.
- Draft bilingual notes and the 15.2.0 upgrade and rollback procedure are in [the release draft](V16_RELEASE_DRAFT.md). The package version remains 15.2.0 throughout this work.
- An isolated vault on Obsidian Desktop 1.15.1 for Linux passed the 15.2.0 upgrade and rollback. Settings, a recoverable Longform draft, and the original Markdown survived restart and two disable/re-enable cycles on each build. On the candidate, a renamed Longform chapter kept its divider, and light and dark narrow splits stayed within bounds at 1280×720.
- An isolated combination with Timeline PR #175 built cleanly. Moving the three deferred CSS files there preserved their source bytes, cascade order, and both generated bundles. Timeline remains a separate PR. Android devices, live external integrations, and the rest of the desktop theme and interaction matrix still need verification for the release gate.
