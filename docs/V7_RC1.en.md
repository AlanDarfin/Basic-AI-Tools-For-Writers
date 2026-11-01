# Basic AI Tool for Writers — 7.0.0-rc.1

**Release candidate (not stable).** The last stable release is **6.0.1**. This candidate consolidates v7's Compendium, Folder Notes, Timeline, wiki-style sheets, story board, relationships, image maps, gallery, session journal, continuity checks and the existing native writing/export tools.

## What StoryLine contributed to the Longform design

The StoryLine 1.11.8 Obsidian plugin supplied *feature references only*: scene corkboard, Kanban, plotlines/plot grid, structure templates, scene inspector and emotion/intensity analytics. We did **not** copy or include StoryLine's JavaScript or CSS and do not require it to be installed. We implemented the following within **Basic AI's existing Longform scene index**:

- **Scene board:** `Quadro / Board` now offers **Cards**, **Kanban** (by scene status), and **List**. Search and filters for status, POV, story act and plotline work on the same chapter order. Kanban is a planning *view*, not a separate drag-and-drop ordering system; reorganize scenes in **Scenes**.
- **One scene inspector:** the native sheet editor can now modify scene `status`, `act`, `sequence`, `pov`, `characters`, `location`, `sceneDate`, `plotlines`, `storyBeat`, `emotion`, `intensity`, `conflict`, `setup_scenes`, `payoff_scenes`, `target_wordcount`, and `summary` through Obsidian's frontmatter API. Access via a scene's **… → Inspect scene** or the Board card's **Edit sheet**. The manuscript body is preserved.
- **Structure tab:** one compact tab containing subviews **Plotlines**, **Story beats** and **Pacing**, instead of three extra crowded tabs.
  - **Plotlines:** group scenes by the `plotlines` YAML property, or view an **act-by-plotline matrix**, with buttons opening the underlying chapter files. Assign a plotline directly to an existing scene.
  - **Beat sheets:** three-act, five-act, and Hero's Journey *planning* templates. Assign `storyBeat` codes to scenes; the template indicates matched/unmatched beats and can show custom beats. No template generates chapters or changes Longform order.
  - **Pacing:** an intensity bar for each scene (0–10), ordered as in Longform and optionally filtered by act. Missing values stay undefined and are never guessed; average and counts only use entered values.
- **Continuity:** extends the existing local checker with unresolved `setup_scenes` and `payoff_scenes` references. This is a structural check, not an AI-generated claim of plot contradictions.
- **Native Longform features remain intact:** parent/subchapter depth rails, collapsed branches, touch-aware move controls, drafts, compile workflows, chapter navigation and manual navigation.

### Example scene metadata

```yaml
---
status: draft
act: "2"
pov: Akira
plotlines:
  - main
  - friendship
storyBeat:
  - midpoint
intensity: 7
emotion: hopeful
characters: [Akira, Lucas]
location: Bonfire
conflict: "A difficult decision"
setup_scenes: ["[[Chapter 8]]"]
payoff_scenes: ["[[Chapter 14]]"]
target_wordcount: 1200
summary: "The group starts questioning its choices."
---
```

This metadata is optional. Existing chapters work without it. User-defined values are permitted for arcs, characters, emotions and status; beat template codes are offered as presets, and the original scene Markdown is still the source of truth.

## Other v7 modules retained

The previous beta's **tag-based Compendium**, Folder Notes, editable world sheets, relationship explorer, linked image gallery, local image maps, Timeline (branches, tracks and simple Gantt), sessions, project analytics and focus mode are all retained. The existing desktop **Pandoc export** remains the only DOCX/EPUB/PDF export engine. Optional narrative memory stays disabled by default and only sends earlier chapter excerpts during a user-requested AI review.

## Compatibility and readiness

- Obsidian **1.11.4+**, Windows/Linux/macOS and Android, with compact theme-aware styles and scrollable narrow layouts.
- The RC is **not** the final stable v7. Please back up your vault and plugin data before installing, particularly if you already use customized YAML properties.
- The StoryLine features **not yet incorporated** include interactive multi-book series management, full drag-reorder of a plot grid, graphically linked setup/payoff dependency arrows, custom fictional calendars, semantic contradiction detection, and a fully interactive relationship canvas. They require distinct projects, extra UI complexity or deeper validation, and are intentionally excluded from this RC rather than shipped half-finished.
- Local scans and no automatic file migrations are maintained. The scene inspector updates only the selected note's frontmatter.
- Automated tests cover the old and new modules, bundle synchronization, CSS lint, and bilingual documentation. **Visual and gesture testing in real Obsidian Android and desktop sessions is still recommended before stable v7.**

## Install

Download the `Basic-AI-Tool-for-Writers-7.0.0-rc.1.zip` or replace `main.js`, `manifest.json`, and `styles.css` under `.obsidian/plugins/basic-ai-tool-for-writers/`. Reload the plugin. This release uses the tag **7.0.0-rc.1**, without a `v` prefix.

[Português](V7_RC1.pt-BR.md) · [Beta 2](V7_BETA2.en.md).
