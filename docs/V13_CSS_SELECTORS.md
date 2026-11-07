# Basic v13 — Inventário dos seletores CSS reincidentes

Gerado de styles.css, com contexto de regras @media/@supports/@container.
Leitura: duplicidade textual de seletor não prova redundância. O resultado
distingue mudanças condicionais de declarações repetidas no mesmo contexto.
A lista contém seletores para REVISÃO, não autorização automática para remoção.

## Métricas

- rules: **3200**
- selectors: **2798**
- repeatedSelectors: **333**
- acrossContexts: **252**
- sameContext: **115**
- identicalDeclarationOccurrences: **106**
- differingDeclarationOccurrences: **124**
- complementaryGroups: **34**
- exactSameContextBlocks: **0**

## Inventário completo

| Seletor | Repetições | Contextos | Avaliação | Linhas de styles.css |
| --- | ---: | ---: | --- | --- |
| `.dictionary-settings-panel .setting-item` | 5 | 4 | Complementary declarations + conditional | 181, 185, 1620, 5086, 5120 |
| `.writer-project-tabs button` | 5 | 3 | Review repeated declaration + conditional | 223, 246, 273, 747, 773 |
| `.writer-v6-booknav-item` | 5 | 3 | Review repeated declaration + conditional | 1740, 1758, 1760, 1774, 1839 |
| `.dictionary-settings-panel` | 4 | 2 | Review repeated declaration + conditional | 49, 1210, 1617, 10120 |
| `.dictionary-settings-panel .setting-item-control` | 4 | 4 | Adaptive (@media/@supports/@container) | 182, 187, 1630, 10235 |
| `.dictionary-settings-tabs` | 4 | 2 | Review repeated declaration + conditional | 46, 179, 1605, 1621 |
| `.modal.writer-v1042-bookshelf-modal` | 4 | 2 | Intentional cascade override + conditional | 8106, 8139, 8901, 9022 |
| `.writer-v1042-bookshelf-modal .modal-content` | 4 | 2 | Complementary declarations + conditional | 8111, 8140, 8904, 9023 |
| `.writer-v106-drag-handle` | 4 | 2 | Review repeated declaration + conditional | 8765, 9633, 9987, 10295 |
| `.writer-v6-booknav` | 4 | 2 | Review repeated declaration + conditional | 1735, 1757, 1768, 1838 |
| `.writer-v8-home .writer-v8-home-grid.writer-v925-grid` | 4 | 2 | Review repeated declaration + conditional | 7105, 7147, 9657, 9787 |
| `.writer-v8-home-clock` | 4 | 3 | Review repeated declaration + conditional | 4501, 4516, 4521, 4730 |
| `.writer-v8-home-quick-actions>.writer-v8-home-action` | 4 | 3 | Complementary declarations + conditional | 4444, 4478, 5142, 5207 |
| `.writer-v8-home-title-icon` | 4 | 2 | Intentional cascade override + conditional | 4491, 4722, 4734, 5140 |
| `.dictionary-settings-subtabs>button` | 3 | 2 | Review repeated declaration + conditional | 1646, 1696, 10095 |
| `.dictionary-settings-tabs>button` | 3 | 2 | Complementary declarations + conditional | 1622, 1657, 10092 |
| `.dictionary-translation-bar` | 3 | 2 | Complementary declarations + conditional | 36, 51, 58 |
| `.writer-project-root` | 3 | 2 | Intentional cascade override + conditional | 220, 241, 274 |
| `.writer-project-root .writer-project-nav-groups>button` | 3 | 3 | Adaptive (@media/@supports/@container) | 3533, 3651, 3655 |
| `.writer-project-tabs` | 3 | 1 | Review repeated declaration | 222, 245, 746 |
| `.writer-review-actions` | 3 | 2 | Intentional cascade override + conditional | 113, 133, 141 |
| `.writer-review-card` | 3 | 2 | Complementary declarations + conditional | 109, 131, 142 |
| `.writer-review-floating.writer-review-floating` | 3 | 2 | Intentional cascade override + conditional | 328, 418, 8272 |
| `.writer-review-panel` | 3 | 2 | Complementary declarations + conditional | 104, 129, 143 |
| `.writer-tool-root .writer-tool-tabs.writer-tool-tabs` | 3 | 2 | Intentional cascade override + conditional | 462, 688, 923 |
| `.writer-tool-root.writer-tool-root` | 3 | 2 | Review repeated declaration + conditional | 147, 429, 701 |
| `.writer-tool-tabs` | 3 | 1 | Review repeated declaration | 71, 103, 138 |
| `.writer-tool-tabs button` | 3 | 2 | Intentional cascade override + conditional | 72, 116, 139 |
| `.writer-v10-bookshelf .writer-v108-book-fields` | 3 | 2 | Intentional cascade override + conditional | 8987, 9025, 9043 |
| `.writer-v51-search-results button` | 3 | 3 | Adaptive (@media/@supports/@container) | 1600, 1632, 1635 |
| `.writer-v6-booknav-preview-auto` | 3 | 2 | Review repeated declaration + conditional | 1849, 1965, 2581 |
| `.writer-v6-rating-button` | 3 | 3 | Adaptive (@media/@supports/@container) | 1709, 1721, 1724 |
| `.writer-v8-home` | 3 | 2 | Complementary declarations + conditional | 4439, 4475, 5307 |
| `.writer-v8-home .writer-v8-home-heading` | 3 | 2 | Review repeated declaration + conditional | 5311, 5431, 5490 |
| `.writer-v8-home .writer-v8-home-heading h2` | 3 | 2 | Intentional cascade override + conditional | 5433, 5493, 7043 |
| `.writer-v8-home .writer-v8-home-hero` | 3 | 2 | Review repeated declaration + conditional | 5308, 5430, 5489 |
| `.writer-v8-home .writer-v8-home-quick-actions` | 3 | 3 | Adaptive (@media/@supports/@container) | 5315, 5325, 5330 |
| `.writer-v8-home-clock-card` | 3 | 3 | Adaptive (@media/@supports/@container) | 4500, 4515, 4520 |
| `.writer-v8-home-heading` | 3 | 2 | Complementary declarations + conditional | 4490, 4720, 4733 |
| `.writer-v8-home-heading h2` | 3 | 1 | Complementary declarations | 4493, 4721, 5139 |
| `.writer-v8-home-quick-actions` | 3 | 2 | Review repeated declaration + conditional | 4443, 5141, 5206 |
| `.writer-v8-home-top` | 3 | 3 | Adaptive (@media/@supports/@container) | 4494, 4514, 4735 |
| `.writer-v9-calendar-layout.has-sidebar` | 3 | 3 | Adaptive (@media/@supports/@container) | 4810, 4922, 4934 |
| `.writer-v9-calendar-month-day` | 3 | 3 | Adaptive (@media/@supports/@container) | 4836, 4923, 4937 |
| `.writer-v9-calendar-month-day>.writer-v9-calendar-event` | 3 | 3 | Adaptive (@media/@supports/@container) | 4871, 4924, 4939 |
| `.writer-v9-calendar-side` | 3 | 3 | Adaptive (@media/@supports/@container) | 4812, 4935, 5128 |
| `.writer-v901-home-result` | 3 | 3 | Adaptive (@media/@supports/@container) | 5258, 5299, 5303 |
| `.writer-v95-timeline-toolbar .writer-v105-timeline-selector` | 3 | 3 | Adaptive (@media/@supports/@container) | 7458, 7671, 9990 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-event` | 3 | 2 | Review repeated declaration + conditional | 7388, 9867, 9993 |
| `.writer-v95-timeline.is-theme-compact .writer-v95-timeline-event-body` | 3 | 1 | Review repeated declaration | 7435, 7601, 9923 |
| `.writer-v95-timeline.is-theme-compact .writer-v95-timeline-head` | 3 | 2 | Review repeated declaration + conditional | 7605, 7672, 9927 |
| `.writer-v95-timeline.is-theme-editorial .writer-v95-timeline-title` | 3 | 1 | Review repeated declaration | 7418, 7640, 9939 |
| `.cm-editor .writer-cm-review-mark` | 2 | 1 | Intentional cascade override | 119, 710 |
| `.dictionary-controls select:first-child` | 2 | 2 | Adaptive (@media/@supports/@container) | 8, 23 |
| `.dictionary-settings-panel .setting-item-description` | 2 | 1 | Review repeated declaration | 9610, 10142 |
| `.dictionary-settings-panel .setting-item-info` | 2 | 2 | Adaptive (@media/@supports/@container) | 186, 10234 |
| `.dictionary-settings-panel .setting-item-name` | 2 | 2 | Adaptive (@media/@supports/@container) | 1631, 10141 |
| `.dictionary-settings-panel .writer-diagnostic-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 1490, 1516 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings` | 2 | 1 | Complementary declarations | 8411, 9059 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings .writer-v1049-compact-field` | 2 | 2 | Adaptive (@media/@supports/@container) | 8526, 8597 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings .writer-v1049-field-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 8552, 8602 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings .writer-v1049-slider-value` | 2 | 2 | Adaptive (@media/@supports/@container) | 8577, 8610 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings select.writer-v1049-control-select` | 2 | 2 | Adaptive (@media/@supports/@container) | 8560, 8607 |
| `.dictionary-settings-panel .writer-v6-settings-section .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 1808, 1840 |
| `.dictionary-settings-panel .writer-v6-settings-section>h3` | 2 | 2 | Adaptive (@media/@supports/@container) | 1800, 1844 |
| `.dictionary-settings-panel>.setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 10134, 10233 |
| `.dictionary-settings-subtabs` | 2 | 2 | Adaptive (@media/@supports/@container) | 1640, 1695 |
| `.dictionary-settings-tabs button` | 2 | 1 | Review repeated declaration | 47, 180 |
| `.dictionary-settings-tabs,.dictionary-settings-subtabs` | 2 | 1 | Intentional cascade override | 9600, 10062 |
| `.dictionary-settings-tabs>button,.dictionary-settings-subtabs>button` | 2 | 2 | Adaptive (@media/@supports/@container) | 10074, 10240 |
| `.dictionary-translation-bar select` | 2 | 2 | Adaptive (@media/@supports/@container) | 37, 51 |
| `.dictionary-writer-modal` | 2 | 1 | Review repeated declaration | 31, 61 |
| `.dictionary-writer-modal>.dictionary-modal-result` | 2 | 2 | Adaptive (@media/@supports/@container) | 64, 67 |
| `.inline-title.writer-v93-title-icon-host > .writer-v9-inline-title-icon, .inline-title.writer-v93-title-icon-host > .writer-v9215-pretty-icon` | 2 | 1 | Intentional cascade override | 6856, 6971 |
| `.metadata-property .writer-v102-property-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 7877, 7948 |
| `.modal.writer-v102-image-modal-host` | 2 | 2 | Adaptive (@media/@supports/@container) | 7954, 7955 |
| `.modal.writer-v102-spaces-modal` | 2 | 2 | Adaptive (@media/@supports/@container) | 7834, 7938 |
| `.status-bar .writer-v91-sound-status` | 2 | 2 | Adaptive (@media/@supports/@container) | 5505, 5687 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-file > .writer-v92-preview-shell, .workspace-leaf-content[data-type="file-explorer"] .nav-folder > .writer-v92-preview-shell` | 2 | 1 | Intentional cascade override | 6195, 6430 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-file-title .writer-v92-favorite` | 2 | 1 | Review repeated declaration | 5940, 6999 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-file-title.writer-v92-has-preview, .workspace-leaf-content[data-type="file-explorer"] .nav-folder-title.writer-v92-has-preview` | 2 | 1 | Review repeated declaration | 5990, 6186 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-folder > .writer-v92-preview-shell.writer-v93-folder-description:not(.is-expanded) .writer-v92-file-preview` | 2 | 1 | Intentional cascade override | 6887, 6941 |
| `.workspace-leaf-content[data-type="file-explorer"] .writer-v92-preview-shell .writer-v92-file-preview` | 2 | 1 | Complementary declarations | 6469, 6947 |
| `.workspace-leaf-content[data-type="file-explorer"] .writer-v92-preview-shell:not(.is-expanded) .writer-v92-file-preview.writer-v931-truncated::after` | 2 | 1 | Review repeated declaration | 6950, 6985 |
| `.workspace-leaf-content[data-type="file-explorer"] .writer-v921-preview-toggle svg` | 2 | 1 | Complementary declarations | 6065, 6935 |
| `.writer-chat-composer` | 2 | 2 | Adaptive (@media/@supports/@container) | 87, 90 |
| `.writer-chat-composer button` | 2 | 2 | Adaptive (@media/@supports/@container) | 89, 90 |
| `.writer-history-diff` | 2 | 2 | Adaptive (@media/@supports/@container) | 312, 324 |
| `.writer-project-cover-preview img` | 2 | 2 | Adaptive (@media/@supports/@container) | 1684, 1698 |
| `.writer-project-metadata` | 2 | 2 | Adaptive (@media/@supports/@container) | 1658, 1697 |
| `.writer-project-note-row>button:not(.writer-project-note)` | 2 | 2 | Adaptive (@media/@supports/@container) | 255, 275 |
| `.writer-project-notes-folder` | 2 | 1 | Review repeated declaration | 229, 258 |
| `.writer-project-panel .writer-project-scene.writer-project-scene-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 1372, 1418 |
| `.writer-project-panel .writer-project-scene.writer-project-scene-actions>.writer-project-drag-handle` | 2 | 2 | Adaptive (@media/@supports/@container) | 1384, 1421 |
| `.writer-project-panel .writer-project-scene.writer-project-scene-actions>.writer-project-scene-controls>button.writer-project-small-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 1410, 1424 |
| `.writer-project-panel .writer-v11-editor` | 2 | 2 | Adaptive (@media/@supports/@container) | 9557, 9569 |
| `.writer-project-panel .writer-v11-longform-inline` | 2 | 2 | Adaptive (@media/@supports/@container) | 9546, 9568 |
| `.writer-project-root .writer-project-nav-groups` | 2 | 2 | Adaptive (@media/@supports/@container) | 3528, 3650 |
| `.writer-project-root .writer-project-scene-rail` | 2 | 2 | Adaptive (@media/@supports/@container) | 2685, 2716 |
| `.writer-project-root .writer-project-scene-rails` | 2 | 2 | Adaptive (@media/@supports/@container) | 2673, 2712 |
| `.writer-project-root .writer-project-scene.writer-project-scene-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 2314, 2604 |
| `.writer-project-root .writer-project-scene.writer-project-scene-actions .writer-project-scene-controls>button.writer-project-small-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 2364, 2611 |
| `.writer-project-root .writer-project-scene.writer-project-scene-actions>.writer-project-scene-controls` | 2 | 2 | Adaptive (@media/@supports/@container) | 2354, 2608 |
| `.writer-project-root .writer-project-series-row>.writer-v7-stable-series-launch` | 2 | 1 | Review repeated declaration | 3557, 3822 |
| `.writer-project-scene-actions` | 2 | 1 | Review repeated declaration | 233, 247 |
| `.writer-project-scene-actions .writer-project-drag-handle` | 2 | 2 | Adaptive (@media/@supports/@container) | 1298, 1363 |
| `.writer-project-scene-actions.writer-project-dragover` | 2 | 1 | Review repeated declaration | 250, 1307 |
| `.writer-project-scene.writer-project-scene-actions>.writer-project-scene-title` | 2 | 2 | Adaptive (@media/@supports/@container) | 388, 423 |
| `.writer-project-toolbar select` | 2 | 1 | Complementary declarations | 221, 243 |
| `.writer-review-actions button` | 2 | 1 | Intentional cascade override | 114, 134 |
| `.writer-review-actions>button:nth-child(3)` | 2 | 1 | Intentional cascade override | 173, 196 |
| `.writer-review-card p` | 2 | 1 | Complementary declarations | 110, 132 |
| `.writer-review-card select` | 2 | 1 | Complementary declarations | 111, 136 |
| `.writer-review-explanation` | 2 | 1 | Complementary declarations | 115, 174 |
| `.writer-review-floating` | 2 | 2 | Adaptive (@media/@supports/@container) | 200, 217 |
| `.writer-review-results` | 2 | 1 | Complementary declarations | 108, 130 |
| `.writer-task-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 759, 774 |
| `.writer-template-matcher-list .writer-template-matcher .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 855, 871 |
| `.writer-template-matcher-list .writer-template-matcher .setting-item-control>.clickable-icon` | 2 | 2 | Adaptive (@media/@supports/@container) | 867, 878 |
| `.writer-template-matcher-list .writer-template-matcher .setting-item-control>select, .writer-template-matcher-list .writer-template-matcher .setting-item-control>input` | 2 | 2 | Adaptive (@media/@supports/@container) | 860, 875 |
| `.writer-tool-root .writer-review-panel .writer-file-actions.writer-file-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 528, 696 |
| `.writer-tool-root .writer-review-panel.writer-review-panel` | 2 | 1 | Review repeated declaration | 148, 507 |
| `.writer-tool-root .writer-tool-panel .dictionary-translation-bar .dictionary-language-arrow` | 2 | 2 | Adaptive (@media/@supports/@container) | 803, 832 |
| `.writer-tool-root .writer-tool-panel .dictionary-translation-bar.dictionary-translation-bar` | 2 | 2 | Adaptive (@media/@supports/@container) | 778, 823 |
| `.writer-tool-root .writer-tools-launcher.writer-tools-launcher` | 2 | 2 | Adaptive (@media/@supports/@container) | 454, 692 |
| `.writer-tool-root>.writer-tool-panel.writer-tool-panel` | 2 | 2 | Adaptive (@media/@supports/@container) | 491, 702 |
| `.writer-tools-v3` | 2 | 2 | Adaptive (@media/@supports/@container) | 280, 319 |
| `.writer-tools-v3 .writer-tools-v3-tabs.writer-tools-v3-tabs` | 2 | 1 | Complementary declarations | 914, 3863 |
| `.writer-tools-v3-panel` | 2 | 1 | Complementary declarations | 288, 1213 |
| `.writer-tools-v3-tabs` | 2 | 2 | Adaptive (@media/@supports/@container) | 285, 320 |
| `.writer-tools-v3-tabs button` | 2 | 2 | Adaptive (@media/@supports/@container) | 286, 321 |
| `.writer-unicode-entry.writer-unicode-entry` | 2 | 2 | Adaptive (@media/@supports/@container) | 990, 1042 |
| `.writer-unicode-entry>.writer-unicode-insert.writer-unicode-insert` | 2 | 2 | Adaptive (@media/@supports/@container) | 998, 1043 |
| `.writer-unicode-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 771, 774 |
| `.writer-unicode-results button` | 2 | 2 | Adaptive (@media/@supports/@container) | 772, 774 |
| `.writer-unicode-results.writer-unicode-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 981, 1041 |
| `.writer-unicode-search` | 2 | 2 | Adaptive (@media/@supports/@container) | 972, 1040 |
| `.writer-v10-book` | 2 | 2 | Adaptive (@media/@supports/@container) | 7760, 7778 |
| `.writer-v10-book-cover` | 2 | 2 | Adaptive (@media/@supports/@container) | 7763, 7778 |
| `.writer-v10-bookshelf .writer-v10-bookshelf-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 8923, 9024 |
| `.writer-v10-bookshelf .writer-v10-bookshelf-toolbar` | 2 | 1 | Intentional cascade override | 8112, 8908 |
| `.writer-v10-bookshelf-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 7759, 7778 |
| `.writer-v10-discovery-pane` | 2 | 2 | Adaptive (@media/@supports/@container) | 8741, 8758 |
| `.writer-v10-discovery-pane .writer-v10-related-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 8840, 9027 |
| `.writer-v10-discovery-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 8744, 8759 |
| `.writer-v10-related-card .writer-v10-related-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 8861, 9028 |
| `.writer-v101-table-scroll` | 2 | 2 | Adaptive (@media/@supports/@container) | 7803, 7829 |
| `.writer-v1010-sidebar-toolbar` | 2 | 2 | Adaptive (@media/@supports/@container) | 9065, 9121 |
| `.writer-v1010-sidebar-toolbar > .writer-v1010-sidebar-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 9070, 9126 |
| `.writer-v1010-sidebar-toolbar > .writer-v1010-sidebar-filter` | 2 | 2 | Adaptive (@media/@supports/@container) | 9085, 9127 |
| `.writer-v1011-notion-calendar` | 2 | 2 | Adaptive (@media/@supports/@container) | 9373, 9455 |
| `.writer-v1011-notion-day` | 2 | 2 | Adaptive (@media/@supports/@container) | 9376, 9456 |
| `.writer-v1011-notion-timeline-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 9383, 9457 |
| `.writer-v1011-notion-toolbar > input` | 2 | 2 | Adaptive (@media/@supports/@container) | 9343, 9458 |
| `.writer-v1011-study-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 9318, 9459 |
| `.writer-v102-image-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 7924, 7950 |
| `.writer-v102-spaces-manager .writer-v102-space-entry` | 2 | 2 | Adaptive (@media/@supports/@container) | 7858, 7947 |
| `.writer-v102-spaces-manager .writer-v102-spaces-action` | 2 | 2 | Adaptive (@media/@supports/@container) | 7842, 7941 |
| `.writer-v102-spaces-manager .writer-v102-spaces-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 7841, 7940 |
| `.writer-v102-spaces-manager .writer-v102-spaces-header` | 2 | 2 | Adaptive (@media/@supports/@container) | 7836, 7939 |
| `.writer-v102-spaces-manager .writer-v102-spaces-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 7855, 7946 |
| `.writer-v102-spaces-manager .writer-v102-spaces-results.is-cards` | 2 | 2 | Adaptive (@media/@supports/@container) | 7856, 7945 |
| `.writer-v1050-settings-search .writer-v1050-result-group` | 2 | 2 | Adaptive (@media/@supports/@container) | 8661, 8725 |
| `.writer-v1050-settings-search .writer-v1050-result-target` | 2 | 2 | Adaptive (@media/@supports/@container) | 8686, 8734 |
| `.writer-v1050-settings-search .writer-v1050-result-targets` | 2 | 2 | Adaptive (@media/@supports/@container) | 8681, 8731 |
| `.writer-v1050-settings-search .writer-v1050-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 8636, 8721 |
| `.writer-v106-drag-handle:focus-visible` | 2 | 1 | Intentional cascade override | 8767, 10289 |
| `.writer-v106-json-children` | 2 | 2 | Adaptive (@media/@supports/@container) | 8778, 8780 |
| `.writer-v107-columns` | 2 | 2 | Adaptive (@media/@supports/@container) | 8811, 8825 |
| `.writer-v107-db` | 2 | 2 | Adaptive (@media/@supports/@container) | 8783, 8820 |
| `.writer-v107-db-cell` | 2 | 2 | Adaptive (@media/@supports/@container) | 8791, 8822 |
| `.writer-v107-db-scroll th,.writer-v107-db-scroll td` | 2 | 2 | Adaptive (@media/@supports/@container) | 8789, 8821 |
| `.writer-v107-graph` | 2 | 2 | Adaptive (@media/@supports/@container) | 8793, 8823 |
| `.writer-v107-pdf-page iframe` | 2 | 2 | Adaptive (@media/@supports/@container) | 8818, 8824 |
| `.writer-v108-books-widget-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 9006, 9029 |
| `.writer-v11-chapter-body` | 2 | 2 | Adaptive (@media/@supports/@container) | 9472, 9490 |
| `.writer-v11-editor` | 2 | 2 | Adaptive (@media/@supports/@container) | 9473, 9490 |
| `.writer-v11-studio-actions button,.writer-v11-chapter-actions button` | 2 | 2 | Adaptive (@media/@supports/@container) | 9467, 9490 |
| `.writer-v11-studio-modal` | 2 | 2 | Adaptive (@media/@supports/@container) | 9463, 9490 |
| `.writer-v111-db-actions button` | 2 | 2 | Adaptive (@media/@supports/@container) | 9538, 9541 |
| `.writer-v111-db-fields` | 2 | 2 | Adaptive (@media/@supports/@container) | 9529, 9540 |
| `.writer-v111-number-structure` | 2 | 2 | Adaptive (@media/@supports/@container) | 9521, 9542 |
| `.writer-v1203-web-bookmark-open` | 2 | 2 | Adaptive (@media/@supports/@container) | 4575, 4606 |
| `.writer-v1203-web-bookmarks-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4566, 4605 |
| `.writer-v4-actions button` | 2 | 2 | Adaptive (@media/@supports/@container) | 1273, 1292 |
| `.writer-v4-diff-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 1274, 1293 |
| `.writer-v4-profile .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 1289, 1294 |
| `.writer-v6-booknav .writer-v6-booknav-list` | 2 | 2 | Adaptive (@media/@supports/@container) | 2489, 2588 |
| `.writer-v6-booknav .writer-v6-booknav-title` | 2 | 2 | Adaptive (@media/@supports/@container) | 2554, 2617 |
| `.writer-v6-booknav-arrow` | 2 | 1 | Intentional cascade override | 1750, 1783 |
| `.writer-v6-booknav-empty` | 2 | 1 | Review repeated declaration | 1755, 1787 |
| `.writer-v6-booknav-item:hover` | 2 | 1 | Review repeated declaration | 1747, 1780 |
| `.writer-v6-booknav-label` | 2 | 1 | Intentional cascade override | 1752, 1784 |
| `.writer-v6-booknav-sub` | 2 | 1 | Intentional cascade override | 1754, 1786 |
| `.writer-v6-booknav-title` | 2 | 1 | Review repeated declaration | 1753, 1785 |
| `.writer-v6-lint-modal` | 2 | 2 | Adaptive (@media/@supports/@container) | 1715, 1719 |
| `.writer-v6-lint-preview` | 2 | 2 | Adaptive (@media/@supports/@container) | 1716, 1720 |
| `.writer-v6-project-prefs .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 1876, 1957 |
| `.writer-v6-reading-status` | 2 | 2 | Adaptive (@media/@supports/@container) | 1714, 1722 |
| `.writer-v6-smart-insert .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 1930, 1963 |
| `.writer-v6-smart-insert .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 1939, 1964 |
| `.writer-v7-focus-mode .view-header` | 2 | 2 | Adaptive (@media/@supports/@container) | 3024, 3044 |
| `.writer-v7-rc-board-toolbar` | 2 | 2 | Adaptive (@media/@supports/@container) | 3289, 3442 |
| `.writer-v7-rc-card-head` | 2 | 2 | Adaptive (@media/@supports/@container) | 3333, 3447 |
| `.writer-v7-rc-corkboard` | 2 | 2 | Adaptive (@media/@supports/@container) | 3300, 3445 |
| `.writer-v7-rc-kanban` | 2 | 2 | Adaptive (@media/@supports/@container) | 3309, 3446 |
| `.writer-v7-rc-pacing-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3493, 3520 |
| `.writer-v7-rc-plotgrid-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3462, 3521 |
| `.writer-v7-rc-status` | 2 | 2 | Adaptive (@media/@supports/@container) | 3345, 3448 |
| `.writer-v7-stable-dependency-row>button` | 2 | 2 | Adaptive (@media/@supports/@container) | 3628, 3652 |
| `.writer-v7-studio-event` | 2 | 2 | Adaptive (@media/@supports/@container) | 3233, 3265 |
| `.writer-v7-studio-gallery-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 3208, 3267 |
| `.writer-v7-studio-gantt-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3246, 3266 |
| `.writer-v7-studio-graph-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3152, 3268 |
| `.writer-v7-timeline-date` | 2 | 2 | Adaptive (@media/@supports/@container) | 2947, 3039 |
| `.writer-v7-timeline-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 2925, 3038 |
| `.writer-v7-timeline-item::before` | 2 | 2 | Adaptive (@media/@supports/@container) | 2936, 3041 |
| `.writer-v7-timeline-list` | 2 | 2 | Adaptive (@media/@supports/@container) | 2916, 3040 |
| `.writer-v8-chat .writer-v8-chat-fake-audio` | 2 | 1 | Intentional cascade override | 7745, 7915 |
| `.writer-v8-chat .writer-v8-chat-fake-audio .writer-v8-chat-transcript-text` | 2 | 2 | Adaptive (@media/@supports/@container) | 7912, 7949 |
| `.writer-v8-chat-fake-audio.is-animating .writer-v8-chat-wave-bar` | 2 | 2 | Adaptive (@media/@supports/@container) | 4544, 4548 |
| `.writer-v8-home .writer-v8-home-grid.writer-v924-masonry` | 2 | 2 | Adaptive (@media/@supports/@container) | 7081, 7095 |
| `.writer-v8-home .writer-v8-home-quick-actions>.writer-v8-home-action` | 2 | 2 | Adaptive (@media/@supports/@container) | 5319, 5335 |
| `.writer-v8-home .writer-v8-home-search-region` | 2 | 1 | Complementary declarations | 5244, 5314 |
| `.writer-v8-home .writer-v8-home-title-icon` | 2 | 2 | Adaptive (@media/@supports/@container) | 5435, 5491 |
| `.writer-v8-home .writer-v8-home-title-icon svg` | 2 | 2 | Adaptive (@media/@supports/@container) | 5438, 5492 |
| `.writer-v8-home .writer-v903-widget-controls` | 2 | 2 | Adaptive (@media/@supports/@container) | 5368, 5424 |
| `.writer-v8-home .writer-v903-widget-controls>button` | 2 | 2 | Adaptive (@media/@supports/@container) | 5370, 5425 |
| `.writer-v8-home .writer-v905-gallery-frame` | 2 | 2 | Adaptive (@media/@supports/@container) | 5475, 5496 |
| `.writer-v8-home .writer-v905-note-list` | 2 | 2 | Adaptive (@media/@supports/@container) | 5446, 5495 |
| `.writer-v8-home .writer-v905-note-row .writer-v905-note-open` | 2 | 2 | Adaptive (@media/@supports/@container) | 5454, 5494 |
| `.writer-v8-home .writer-v925-grid>[data-section]` | 2 | 2 | Adaptive (@media/@supports/@container) | 9661, 9790 |
| `.writer-v8-home-calendar-days` | 2 | 2 | Adaptive (@media/@supports/@container) | 4509, 4517 |
| `.writer-v8-home-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 4449, 4479 |
| `.writer-v8-home-card-header h3` | 2 | 1 | Complementary declarations | 4451, 5116 |
| `.writer-v8-home-draft-tabs` | 2 | 1 | Intentional cascade override | 4464, 5143 |
| `.writer-v8-home-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4448, 4476 |
| `.writer-v8-home-grid>.writer-v8-home-clock-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 5249, 5297 |
| `.writer-v8-home-hero h2` | 2 | 2 | Adaptive (@media/@supports/@container) | 4441, 4477 |
| `.writer-v8-home-title-icon svg` | 2 | 1 | Intentional cascade override | 4492, 4726 |
| `.writer-v8-overview-header` | 2 | 1 | Complementary declarations | 4177, 4221 |
| `.writer-v8-overview-header strong` | 2 | 1 | Complementary declarations | 4178, 4222 |
| `.writer-v8-overview-items.is-cards` | 2 | 1 | Intentional cascade override | 4181, 4234 |
| `.writer-v8-overview-items.is-list .writer-v8-overview-tile` | 2 | 1 | Intentional cascade override | 4202, 4243 |
| `.writer-v83-cal-day` | 2 | 2 | Adaptive (@media/@supports/@container) | 4618, 4650 |
| `.writer-v83-cal-event` | 2 | 2 | Adaptive (@media/@supports/@container) | 4623, 4651 |
| `.writer-v83-calendar,.writer-v83-study` | 2 | 2 | Adaptive (@media/@supports/@container) | 4610, 4649 |
| `.writer-v83-calendar.writer-v9-calendar` | 2 | 2 | Adaptive (@media/@supports/@container) | 4785, 4927 |
| `.writer-v83-study-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 4638, 4652 |
| `.writer-v83-study-choices` | 2 | 2 | Adaptive (@media/@supports/@container) | 4643, 4653 |
| `.writer-v9-calendar-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 4795, 4931 |
| `.writer-v9-calendar-agenda-day` | 2 | 2 | Adaptive (@media/@supports/@container) | 4877, 4947 |
| `.writer-v9-calendar-header` | 2 | 2 | Adaptive (@media/@supports/@container) | 4789, 4928 |
| `.writer-v9-calendar-heading h2` | 2 | 2 | Adaptive (@media/@supports/@container) | 4793, 5126 |
| `.writer-v9-calendar-layout` | 2 | 2 | Adaptive (@media/@supports/@container) | 4809, 5127 |
| `.writer-v9-calendar-main` | 2 | 2 | Adaptive (@media/@supports/@container) | 4811, 4936 |
| `.writer-v9-calendar-month-day>.writer-v9-calendar-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 4851, 4942 |
| `.writer-v9-calendar-month-dayhead` | 2 | 2 | Adaptive (@media/@supports/@container) | 4843, 4938 |
| `.writer-v9-calendar-subtitle` | 2 | 2 | Adaptive (@media/@supports/@container) | 4794, 4930 |
| `.writer-v9-calendar-time-slot` | 2 | 2 | Adaptive (@media/@supports/@container) | 4897, 4946 |
| `.writer-v9-calendar-timegrid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4885, 4945 |
| `.writer-v9-calendar-view-select` | 2 | 2 | Adaptive (@media/@supports/@container) | 4805, 4933 |
| `.writer-v9-calendar-weekday` | 2 | 2 | Adaptive (@media/@supports/@container) | 4834, 4943 |
| `.writer-v9-event-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4911, 4944 |
| `.writer-v9-format-toolbar` | 2 | 1 | Review repeated declaration | 4659, 5114 |
| `.writer-v9-format-toolbar.writer-v1048-format-toolbar.is-floating` | 2 | 2 | Adaptive (@media/@supports/@container) | 8386, 8392 |
| `.writer-v9-space-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 4701, 4736 |
| `.writer-v9-space-sidebar` | 2 | 1 | Review repeated declaration | 5213, 8038 |
| `.writer-v9-toolbar-list>.setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 4774, 4780 |
| `.writer-v9-toolbar-list>.setting-item .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 4776, 4781 |
| `.writer-v901-home-result .writer-v901-home-result-open` | 2 | 2 | Adaptive (@media/@supports/@container) | 5266, 5300 |
| `.writer-v901-home-search-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 5252, 5298 |
| `.writer-v901-icon-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 5179, 5208 |
| `.writer-v903-gallery-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 5390, 5426 |
| `.writer-v91-ai-chat-row .writer-v8-chat-group` | 2 | 2 | Adaptive (@media/@supports/@container) | 5609, 5691 |
| `.writer-v91-ai-chat-row.is-right .writer-v8-chat-group` | 2 | 1 | Complementary declarations | 5605, 5613 |
| `.writer-v91-ai-settings .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 5660, 5689 |
| `.writer-v91-ai-settings .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 5665, 5690 |
| `.writer-v91-mini-player` | 2 | 2 | Adaptive (@media/@supports/@container) | 5699, 5787 |
| `.writer-v91-mini-video` | 2 | 2 | Adaptive (@media/@supports/@container) | 5748, 5788 |
| `.writer-v91-sound-controls input[type="range"]` | 2 | 2 | Adaptive (@media/@supports/@container) | 5552, 5695 |
| `.writer-v91-sound-preview img` | 2 | 2 | Adaptive (@media/@supports/@container) | 5529, 5694 |
| `.writer-v91-sound-status input[type="range"]` | 2 | 2 | Adaptive (@media/@supports/@container) | 5522, 5688 |
| `.writer-v912-rule-editor :is(input,textarea,select)` | 2 | 2 | Adaptive (@media/@supports/@container) | 5908, 5928 |
| `.writer-v912-rule-editor .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 5902, 5926 |
| `.writer-v912-sidebar` | 2 | 2 | Adaptive (@media/@supports/@container) | 5833, 5929 |
| `.writer-v912-sidebar-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 5859, 5930 |
| `.writer-v912-virtual-block` | 2 | 2 | Adaptive (@media/@supports/@container) | 5807, 5925 |
| `.writer-v92-column` | 2 | 2 | Adaptive (@media/@supports/@container) | 6095, 6179 |
| `.writer-v92-columns` | 2 | 2 | Adaptive (@media/@supports/@container) | 6091, 6178 |
| `.writer-v92-session` | 2 | 2 | Adaptive (@media/@supports/@container) | 6160, 6180 |
| `.writer-v922-iconic-actions .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 6369, 6425 |
| `.writer-v922-iconic-big` | 2 | 2 | Adaptive (@media/@supports/@container) | 6240, 6418 |
| `.writer-v922-iconic-big svg` | 2 | 2 | Adaptive (@media/@supports/@container) | 6250, 6419 |
| `.writer-v922-iconic-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 6319, 6420 |
| `.writer-v922-iconic-preview` | 2 | 2 | Adaptive (@media/@supports/@container) | 6230, 6417 |
| `.writer-v922-iconic-setting` | 2 | 2 | Adaptive (@media/@supports/@container) | 6370, 6424 |
| `.writer-v924-masonry .writer-v924-dragging` | 2 | 2 | Adaptive (@media/@supports/@container) | 7090, 7101 |
| `.writer-v924-masonry>.writer-v924-column` | 2 | 2 | Adaptive (@media/@supports/@container) | 7084, 7096 |
| `.writer-v925-grid .writer-v1205-resize-handle` | 2 | 2 | Adaptive (@media/@supports/@container) | 9677, 9793 |
| `.writer-v925-grid>[data-section][data-widget-size="wide"]` | 2 | 2 | Adaptive (@media/@supports/@container) | 7122, 7151 |
| `.writer-v93-flow-layout-graph .writer-v93-flow-items` | 2 | 2 | Adaptive (@media/@supports/@container) | 7816, 7828 |
| `.writer-v95-timeline` | 2 | 1 | Review repeated declaration | 7255, 9808 |
| `.writer-v95-timeline .writer-v95-timeline-head` | 2 | 1 | Review repeated declaration | 7456, 9889 |
| `.writer-v95-timeline *` | 2 | 2 | Adaptive (@media/@supports/@container) | 7266, 7676 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7406, 9874 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7396, 9878 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-items` | 2 | 1 | Review repeated declaration | 7378, 9858 |
| `.writer-v95-timeline.is-layout-vertical .writer-v95-timeline-event` | 2 | 1 | Complementary declarations | 7366, 9841 |
| `.writer-v95-timeline.is-layout-vertical .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Review repeated declaration | 7369, 9845 |
| `.writer-v95-timeline.is-line-4.is-layout-horizontal .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7495, 9883 |
| `.writer-v95-timeline.is-line-4.is-layout-vertical .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7490, 9850 |
| `.writer-v95-timeline.is-line-5 .writer-v95-timeline-marker` | 2 | 1 | Review repeated declaration | 7500, 9838 |
| `.writer-v95-timeline.is-line-5.is-layout-horizontal .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7509, 9886 |
| `.writer-v95-timeline.is-line-5.is-layout-vertical .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7506, 9854 |
| `.writer-v95-timeline.is-theme-cards .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7630, 9905 |
| `.writer-v95-timeline.is-theme-classic .writer-v95-timeline-event-body` | 2 | 1 | Complementary declarations | 7426, 9902 |
| `.writer-v95-timeline.is-theme-compact .writer-v95-timeline-date` | 2 | 1 | Review repeated declaration | 7611, 9931 |
| `.writer-v95-timeline.is-theme-editorial .writer-v95-timeline-date` | 2 | 1 | Intentional cascade override | 7423, 7643 |
| `.writer-v95-timeline.is-theme-editorial .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7635, 9934 |
| `.writer-v95-timeline.is-theme-glass .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7652, 9957 |
| `.writer-v95-timeline.is-theme-minimal .writer-v95-timeline-event` | 2 | 2 | Adaptive (@media/@supports/@container) | 7571, 7673 |
| `.writer-v95-timeline.is-theme-minimal .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7572, 9916 |
| `.writer-v95-timeline.is-theme-minimal .writer-v95-timeline-head` | 2 | 1 | Review repeated declaration | 7577, 9920 |
| `.writer-v95-timeline.is-theme-poster .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7644, 9942 |
| `.writer-v95-timeline.is-theme-terminal .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7658, 9967 |
| `.writer-variant-option-header button` | 2 | 2 | Adaptive (@media/@supports/@container) | 305, 323 |
| `body.is-mobile .workspace-leaf-content[data-type="file-explorer"] .nav-file-title .writer-v92-favorite` | 2 | 1 | Review repeated declaration | 6069, 7025 |
| `body.is-mobile .writer-v1011-managed-mobile .workspace-leaf-content.writer-v1011-grouped-native-actions .nav-header > .nav-buttons-container` | 2 | 1 | Intentional cascade override | 9214, 9596 |
| `body.is-mobile .writer-v8-home .writer-v8-home-grid.writer-v925-grid` | 2 | 1 | Review repeated declaration | 7153, 9795 |
| `body.is-mobile .writer-v8-overview` | 2 | 1 | Intentional cascade override | 4217, 4300 |
| `body.is-mobile .writer-v8-overview-items.is-cards` | 2 | 1 | Intentional cascade override | 4218, 4301 |
| `body.is-mobile .writer-v8-tab-list>button` | 2 | 1 | Intentional cascade override | 4119, 4390 |

## Regra de limpeza
Só remover regras quando o estilo final for comprovadamente equivalente em todos
os contextos, e quando nenhuma regra antiga tiver papel de fallback para navegadores
sem suporte a valores CSS recentes. Antes de eliminar seletores sem referência textual
no JavaScript, verificar classes criadas dinamicamente e markdown de usuários.
Manter em camadas condicionais os tamanhos mobile, os estilos de tema da timeline
e os estados do dragger; nunca alterar o HeaderBar nativo do Surfing por dentro.
