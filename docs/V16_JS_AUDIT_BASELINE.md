# V16 JavaScript audit — first baseline and review queue

Source: CI run [#1379](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/actions/runs/46047979264), commit `ed86243bfc086cb250ad92b95bfaa7dcfa357118`, 2026-11-27.

## Measured baseline (syntax inventory)

| Metric | Count |
| --- | ---: |
| Source modules | 124 |
| Named top-level declarations | 1508 |
| Repeated top-level names | 0 |
| Direct prototype writes | 8 |
| Repeated direct prototype targets | 0 |
| Command registration sites | 203 |
| Dynamic command IDs | 16 |
| Repeated literal command IDs | 0 |
| Lifecycle/persistence call sites | 1940 |
| Syntax errors | 0 |
| Regression files passed | 179/179 |

Selected lifecycle categories: 568 listener-add, 30 listener-remove, 29 managed-dom-event, 106 managed-event, 111 event-subscribe-candidate, 78 managed-registration, 66 timeout-create, 101 timeout-clear, 9 interval-create, 8 interval-clear, 5 managed-interval, 10 mutation-observer, 2 resize-observer, 1 intersection-observer, 28 disconnect-candidate, 7 frame-create, 2 frame-cancel, 475 settings-save.

These are static call sites, not live objects or execution counts. DOM listeners attached to temporary elements can be garbage collected with their elements; one teardown may clean multiple resources. Do not subtract creation and removal counts to estimate leaks. No performance measurements yet.

## Manual review: evidence and order of work

| Priority | Area | Evidence | Status / acceptance |
| --- | --- | --- | --- |
| P0 | Startup callbacks | `src/v10/startup-cleanup.js:52-74` queues an async layout-ready action without an explicit unload guard; cleanup can close restored root leaves after awaiting activation. | Review disable-before-layout and disable-while-awaiting scenarios; test that stale callback cannot close tabs. |
| P1 | Reading progress | `src/v10/enhancements.js:128-175` schedules an untracked 140 ms timeout and animation frame, but unload only removes existing DOM. The callback has no stopped guard and can rebuild the track after removal if settings remain enabled. | Confirmed code-level teardown gap, runtime reproduction pending. Track/cancel outstanding work, clear refresh handle if owned, verify disable/re-enable with controlled timer/frame fixtures. |
| P1 | Native menu ownership | `src/v9/context-toolbar.js:365-382` wraps three Menu methods by computed key; `src/v9/explorer-flex.js:571-579` also wraps showAtMouseEvent; `src/v12/mobile-ux-1201.js:165-209` temporarily wraps showAtPosition and setParentElement and restores in finally. | Overlapping ownership confirmed, functional conflict not established. Preserve native menu ordering, synchronous restoration, third-party changes and cleanup; test both installation orders and nested invocation before consolidation. |
| P1 | Explorer native sorting | `src/v9/explorer-flex.js:537-569` discovers method owners using Object.getPrototypeOf and installs wrappers through aliases. | Review restoration and repeated activation with owner changes, including native fallback. |
| P2 | Homepage rendering | `src/v8/writing-home.js:376-381` schedules frames in ResizeObserver callbacks; the class clears its observer on rerender and close. | Review coalescing and old render generation invalidation; measure before optimizing. |
| P2 | Settings persistence | 475 syntactic settings-save call sites. | Trace actual write queue and settings migration; do not add a global debounce without testing ordered persistence, failures and flush. |

The first three areas are the initial lifecycle work queue. The review separates confirmed source patterns from proven runtime failures. Existing guards in other features (for example Toolbar teardown) should be preserved, not rewritten solely for consistency.

## Audit coverage improvements (phase 6.2)

The original direct prototype count missed aliases, computed keys and Object.getPrototypeOf. The analyzer now lists possible function-scope alias bindings and writes, origin, property if statically known, source and bundle locations, and repeated resolved alias targets. It also inventories onLayoutReady callbacks and ranks modules by lifecycle call sites. The alias analysis is conservative and not full lexical/data-flow analysis; assignments in different block scopes can be conflated and dynamic keys are unresolved. A repeated alias target may be a patch and its restoration, not a conflict.

Next gate: validate new AST fixture and real report in CI, then implement targeted lifecycle fixes in Phase 7 with mocked cleanup/reload tests and synchronized distributables. No runtime changes in Phase 6.2.
