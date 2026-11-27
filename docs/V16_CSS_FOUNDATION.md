# Basic v16 — CSS foundation (working plan)

Status: second implementation phase; version remains unchanged until integration and release.

## Design contracts
- Native theme tokens remain authoritative. No global reset, no !important escalation and no changes to third-party DOM without a feature-specific host.
- Keep the existing build order during the migration. Move styles by responsibility only after equivalence is verified.
- Width precedence: explicit Editor Width Slider (including its per-note and temporary values), then StyleMate, then Focus Mode's fallback, then native defaults. Focus must never constrain the whole reading scroll container.
- StyleMate reading-mode typography is restricted to native prose wrappers. Live Preview uses CodeMirror metrics; its embedded widgets need dedicated visual QA before additional overrides.
- Desktop status positioning has one owner. Mobile status must reserve space in actual Markdown scroll surfaces, without moving native nodes unnecessarily or adding clearance when the keyboard is visible.
- Preserve existing CSS class names, Markdown formats, settings and exports.

## Migration stages
1. Foundation (this PR): remove obsolete centered desktop dock and contradictory breakpoint; scope property positioning; isolate reading typography; establish width precedence; gate Typewriter padding by actual editor engagement.
2. Native/mobile: audit explorer controls, mobile toolbar and status geometry; test keyboard and split-pane resizing; ensure cleanup on disable.
3. Components: reconcile repeated style rules for Timeline (separate PR), Longform, Spaces, Homepage and LanguageTool; use scoped component tokens.
4. Organize source modules by core/native/editor/blocks/features/mobile/compat, using an explicit build manifest and checking generated CSS equivalence at each move.
5. Regression and release: static cascade audit; full build and regression suite; 720p desktop and Android, light/dark, narrow split panes, both Markdown modes, native themes and third-party themes. No version bump before QA.

## Verification
Run npm run build:css, npm run check:css, npm test. Test editor width with each feature alone and all combinations; test StyleMate with a timeline, callout, embedded note and chat block; compare native property and status layouts before and after disabling Basic. Validate native mobile scrolling with and without virtual keyboard. Static tests are not substitutes for real rendering.

## Phase 2 — native/mobile implementation

- Measured overlap is now applied to visible top-level Markdown reading and CodeMirror scroll surfaces, including horizontal pane intersection. Embedded notes and non-Markdown plugin editors are excluded.
- Existing native bottom padding is preserved when larger; the measured override is removed for keyboard, hidden bars, nonoverlapping panes and plugin unload. Turning only the custom status row off still compensates for an overlapping native floating navbar.
- Explorer control sizing is limited to Basic's preview and Spaces actions. Reorder titles alone receive truncation rules. Other native/third-party action buttons and titles retain theme sizing.
- Runtime main.js and shipping CSS were synchronized by verified source replacement. Full build/CI and visual Android verification are still required; mock geometry tests cannot prove actual WebView layout.
- Follow-up visual QA: confirm CodeMirror scroll extent, real keyboard open/close, landscape/split panes, toolbar with themes and external plugins, end-of-note reachability, native status row restore and hit targets.
