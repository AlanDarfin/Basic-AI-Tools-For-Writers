# Basic v13 — Inventário dos seletores CSS reincidentes

Gerado de styles.css, com contexto de regras @media/@supports/@container.
Leitura: duplicidade textual de seletor não prova redundância. O resultado
distingue mudanças condicionais de declarações repetidas no mesmo contexto.
A lista contém seletores para REVISÃO, não autorização automática para remoção.

## Métricas

- rules: **3206**
- selectors: **2804**
- repeatedSelectors: **333**
- acrossContexts: **252**
- sameContext: **115**
- identicalDeclarationOccurrences: **110**
- differingDeclarationOccurrences: **124**
- complementaryGroups: **33**
- exactSameContextBlocks: **0**

## Inventário completo

| Seletor | Repetições | Contextos | Avaliação | Linhas de styles.css |
| --- | ---: | ---: | --- | --- |
| `.dictionary-settings-panel .setting-item` | 5 | 4 | Complementary declarations + conditional | 181, 185, 1620, 5105, 5139 |
| `.writer-project-tabs button` | 5 | 3 | Review repeated declaration + conditional | 223, 246, 273, 747, 773 |
| `.writer-v6-booknav-item` | 5 | 3 | Review repeated declaration + conditional | 1740, 1758, 1760, 1774, 1839 |
| `.dictionary-settings-panel` | 4 | 2 | Review repeated declaration + conditional | 49, 1210, 1617, 10139 |
| `.dictionary-settings-panel .setting-item-control` | 4 | 4 | Adaptive (@media/@supports/@container) | 182, 187, 1630, 10254 |
| `.dictionary-settings-tabs` | 4 | 2 | Review repeated declaration + conditional | 46, 179, 1605, 1621 |
| `.modal.writer-v1042-bookshelf-modal` | 4 | 2 | Review repeated declaration + conditional | 8125, 8158, 8920, 9041 |
| `.writer-v1042-bookshelf-modal .modal-content` | 4 | 2 | Review repeated declaration + conditional | 8130, 8159, 8923, 9042 |
| `.writer-v106-drag-handle` | 4 | 2 | Review repeated declaration + conditional | 8784, 9652, 10006, 10314 |
| `.writer-v6-booknav` | 4 | 2 | Review repeated declaration + conditional | 1735, 1757, 1768, 1838 |
| `.writer-v8-home .writer-v8-home-grid.writer-v925-grid` | 4 | 2 | Review repeated declaration + conditional | 7124, 7166, 9676, 9806 |
| `.writer-v8-home-clock` | 4 | 3 | Review repeated declaration + conditional | 4520, 4535, 4540, 4749 |
| `.writer-v8-home-quick-actions>.writer-v8-home-action` | 4 | 3 | Complementary declarations + conditional | 4463, 4497, 5161, 5226 |
| `.writer-v8-home-title-icon` | 4 | 2 | Intentional cascade override + conditional | 4510, 4741, 4753, 5159 |
| `.dictionary-settings-subtabs>button` | 3 | 2 | Review repeated declaration + conditional | 1646, 1696, 10114 |
| `.dictionary-settings-tabs>button` | 3 | 2 | Complementary declarations + conditional | 1622, 1657, 10111 |
| `.dictionary-translation-bar` | 3 | 2 | Complementary declarations + conditional | 36, 51, 58 |
| `.writer-project-root` | 3 | 2 | Intentional cascade override + conditional | 220, 241, 274 |
| `.writer-project-root .writer-project-nav-groups>button` | 3 | 3 | Adaptive (@media/@supports/@container) | 3552, 3670, 3674 |
| `.writer-project-tabs` | 3 | 1 | Review repeated declaration | 222, 245, 746 |
| `.writer-review-actions` | 3 | 2 | Intentional cascade override + conditional | 113, 133, 141 |
| `.writer-review-card` | 3 | 2 | Complementary declarations + conditional | 109, 131, 142 |
| `.writer-review-floating.writer-review-floating` | 3 | 2 | Intentional cascade override + conditional | 328, 418, 8291 |
| `.writer-review-panel` | 3 | 2 | Complementary declarations + conditional | 104, 129, 143 |
| `.writer-tool-root .writer-tool-tabs.writer-tool-tabs` | 3 | 2 | Intentional cascade override + conditional | 462, 688, 923 |
| `.writer-tool-root.writer-tool-root` | 3 | 2 | Review repeated declaration + conditional | 147, 429, 701 |
| `.writer-tool-tabs` | 3 | 1 | Review repeated declaration | 71, 103, 138 |
| `.writer-tool-tabs button` | 3 | 2 | Intentional cascade override + conditional | 72, 116, 139 |
| `.writer-v10-bookshelf .writer-v108-book-fields` | 3 | 2 | Intentional cascade override + conditional | 9006, 9044, 9062 |
| `.writer-v51-search-results button` | 3 | 3 | Adaptive (@media/@supports/@container) | 1600, 1632, 1635 |
| `.writer-v6-booknav-preview-auto` | 3 | 2 | Review repeated declaration + conditional | 1849, 1965, 2581 |
| `.writer-v6-rating-button` | 3 | 3 | Adaptive (@media/@supports/@container) | 1709, 1721, 1724 |
| `.writer-v8-home` | 3 | 2 | Complementary declarations + conditional | 4458, 4494, 5326 |
| `.writer-v8-home .writer-v8-home-heading` | 3 | 2 | Review repeated declaration + conditional | 5330, 5450, 5509 |
| `.writer-v8-home .writer-v8-home-heading h2` | 3 | 2 | Intentional cascade override + conditional | 5452, 5512, 7062 |
| `.writer-v8-home .writer-v8-home-hero` | 3 | 2 | Review repeated declaration + conditional | 5327, 5449, 5508 |
| `.writer-v8-home .writer-v8-home-quick-actions` | 3 | 3 | Adaptive (@media/@supports/@container) | 5334, 5344, 5349 |
| `.writer-v8-home-clock-card` | 3 | 3 | Adaptive (@media/@supports/@container) | 4519, 4534, 4539 |
| `.writer-v8-home-heading` | 3 | 2 | Complementary declarations + conditional | 4509, 4739, 4752 |
| `.writer-v8-home-heading h2` | 3 | 1 | Complementary declarations | 4512, 4740, 5158 |
| `.writer-v8-home-quick-actions` | 3 | 2 | Review repeated declaration + conditional | 4462, 5160, 5225 |
| `.writer-v8-home-top` | 3 | 3 | Adaptive (@media/@supports/@container) | 4513, 4533, 4754 |
| `.writer-v9-calendar-layout.has-sidebar` | 3 | 3 | Adaptive (@media/@supports/@container) | 4829, 4941, 4953 |
| `.writer-v9-calendar-month-day` | 3 | 3 | Adaptive (@media/@supports/@container) | 4855, 4942, 4956 |
| `.writer-v9-calendar-month-day>.writer-v9-calendar-event` | 3 | 3 | Adaptive (@media/@supports/@container) | 4890, 4943, 4958 |
| `.writer-v9-calendar-side` | 3 | 3 | Adaptive (@media/@supports/@container) | 4831, 4954, 5147 |
| `.writer-v901-home-result` | 3 | 3 | Adaptive (@media/@supports/@container) | 5277, 5318, 5322 |
| `.writer-v95-timeline-toolbar .writer-v105-timeline-selector` | 3 | 3 | Adaptive (@media/@supports/@container) | 7477, 7690, 10009 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-event` | 3 | 2 | Review repeated declaration + conditional | 7407, 9886, 10012 |
| `.writer-v95-timeline.is-theme-compact .writer-v95-timeline-event-body` | 3 | 1 | Review repeated declaration | 7454, 7620, 9942 |
| `.writer-v95-timeline.is-theme-compact .writer-v95-timeline-head` | 3 | 2 | Review repeated declaration + conditional | 7624, 7691, 9946 |
| `.writer-v95-timeline.is-theme-editorial .writer-v95-timeline-title` | 3 | 1 | Review repeated declaration | 7437, 7659, 9958 |
| `.cm-editor .writer-cm-review-mark` | 2 | 1 | Intentional cascade override | 119, 710 |
| `.dictionary-controls select:first-child` | 2 | 2 | Adaptive (@media/@supports/@container) | 8, 23 |
| `.dictionary-settings-panel .setting-item-description` | 2 | 1 | Review repeated declaration | 9629, 10161 |
| `.dictionary-settings-panel .setting-item-info` | 2 | 2 | Adaptive (@media/@supports/@container) | 186, 10253 |
| `.dictionary-settings-panel .setting-item-name` | 2 | 2 | Adaptive (@media/@supports/@container) | 1631, 10160 |
| `.dictionary-settings-panel .writer-diagnostic-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 1490, 1516 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings` | 2 | 1 | Complementary declarations | 8430, 9078 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings .writer-v1049-compact-field` | 2 | 2 | Adaptive (@media/@supports/@container) | 8545, 8616 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings .writer-v1049-field-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 8571, 8621 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings .writer-v1049-slider-value` | 2 | 2 | Adaptive (@media/@supports/@container) | 8596, 8629 |
| `.dictionary-settings-panel .writer-v1048-toolbar-settings select.writer-v1049-control-select` | 2 | 2 | Adaptive (@media/@supports/@container) | 8579, 8626 |
| `.dictionary-settings-panel .writer-v6-settings-section .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 1808, 1840 |
| `.dictionary-settings-panel .writer-v6-settings-section>h3` | 2 | 2 | Adaptive (@media/@supports/@container) | 1800, 1844 |
| `.dictionary-settings-panel>.setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 10153, 10252 |
| `.dictionary-settings-subtabs` | 2 | 2 | Adaptive (@media/@supports/@container) | 1640, 1695 |
| `.dictionary-settings-tabs button` | 2 | 1 | Review repeated declaration | 47, 180 |
| `.dictionary-settings-tabs,.dictionary-settings-subtabs` | 2 | 1 | Intentional cascade override | 9619, 10081 |
| `.dictionary-settings-tabs>button,.dictionary-settings-subtabs>button` | 2 | 2 | Adaptive (@media/@supports/@container) | 10093, 10259 |
| `.dictionary-translation-bar select` | 2 | 2 | Adaptive (@media/@supports/@container) | 37, 51 |
| `.dictionary-writer-modal` | 2 | 1 | Review repeated declaration | 31, 61 |
| `.dictionary-writer-modal>.dictionary-modal-result` | 2 | 2 | Adaptive (@media/@supports/@container) | 64, 67 |
| `.inline-title.writer-v93-title-icon-host > .writer-v9-inline-title-icon, .inline-title.writer-v93-title-icon-host > .writer-v9215-pretty-icon` | 2 | 1 | Intentional cascade override | 6875, 6990 |
| `.metadata-property .writer-v102-property-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 7896, 7967 |
| `.modal.writer-v102-image-modal-host` | 2 | 2 | Adaptive (@media/@supports/@container) | 7973, 7974 |
| `.modal.writer-v102-spaces-modal` | 2 | 2 | Adaptive (@media/@supports/@container) | 7853, 7957 |
| `.status-bar .writer-v91-sound-status` | 2 | 2 | Adaptive (@media/@supports/@container) | 5524, 5706 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-file > .writer-v92-preview-shell, .workspace-leaf-content[data-type="file-explorer"] .nav-folder > .writer-v92-preview-shell` | 2 | 1 | Intentional cascade override | 6214, 6449 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-file-title .writer-v92-favorite` | 2 | 1 | Review repeated declaration | 5959, 7018 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-file-title.writer-v92-has-preview, .workspace-leaf-content[data-type="file-explorer"] .nav-folder-title.writer-v92-has-preview` | 2 | 1 | Review repeated declaration | 6009, 6205 |
| `.workspace-leaf-content[data-type="file-explorer"] .nav-folder > .writer-v92-preview-shell.writer-v93-folder-description:not(.is-expanded) .writer-v92-file-preview` | 2 | 1 | Intentional cascade override | 6906, 6960 |
| `.workspace-leaf-content[data-type="file-explorer"] .writer-v92-preview-shell .writer-v92-file-preview` | 2 | 1 | Complementary declarations | 6488, 6966 |
| `.workspace-leaf-content[data-type="file-explorer"] .writer-v92-preview-shell:not(.is-expanded) .writer-v92-file-preview.writer-v931-truncated::after` | 2 | 1 | Review repeated declaration | 6969, 7004 |
| `.workspace-leaf-content[data-type="file-explorer"] .writer-v921-preview-toggle svg` | 2 | 1 | Complementary declarations | 6084, 6954 |
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
| `.writer-project-panel .writer-v11-editor` | 2 | 2 | Adaptive (@media/@supports/@container) | 9576, 9588 |
| `.writer-project-panel .writer-v11-longform-inline` | 2 | 2 | Adaptive (@media/@supports/@container) | 9565, 9587 |
| `.writer-project-root .writer-project-nav-groups` | 2 | 2 | Adaptive (@media/@supports/@container) | 3547, 3669 |
| `.writer-project-root .writer-project-scene-rail` | 2 | 2 | Adaptive (@media/@supports/@container) | 2685, 2716 |
| `.writer-project-root .writer-project-scene-rails` | 2 | 2 | Adaptive (@media/@supports/@container) | 2673, 2712 |
| `.writer-project-root .writer-project-scene.writer-project-scene-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 2314, 2604 |
| `.writer-project-root .writer-project-scene.writer-project-scene-actions .writer-project-scene-controls>button.writer-project-small-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 2364, 2611 |
| `.writer-project-root .writer-project-scene.writer-project-scene-actions>.writer-project-scene-controls` | 2 | 2 | Adaptive (@media/@supports/@container) | 2354, 2608 |
| `.writer-project-root .writer-project-series-row>.writer-v7-stable-series-launch` | 2 | 1 | Review repeated declaration | 3576, 3841 |
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
| `.writer-tools-v3 .writer-tools-v3-tabs.writer-tools-v3-tabs` | 2 | 1 | Complementary declarations | 914, 3882 |
| `.writer-tools-v3-panel` | 2 | 1 | Complementary declarations | 288, 1213 |
| `.writer-tools-v3-tabs` | 2 | 2 | Adaptive (@media/@supports/@container) | 285, 320 |
| `.writer-tools-v3-tabs button` | 2 | 2 | Adaptive (@media/@supports/@container) | 286, 321 |
| `.writer-unicode-entry.writer-unicode-entry` | 2 | 2 | Adaptive (@media/@supports/@container) | 990, 1042 |
| `.writer-unicode-entry>.writer-unicode-insert.writer-unicode-insert` | 2 | 2 | Adaptive (@media/@supports/@container) | 998, 1043 |
| `.writer-unicode-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 771, 774 |
| `.writer-unicode-results button` | 2 | 2 | Adaptive (@media/@supports/@container) | 772, 774 |
| `.writer-unicode-results.writer-unicode-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 981, 1041 |
| `.writer-unicode-search` | 2 | 2 | Adaptive (@media/@supports/@container) | 972, 1040 |
| `.writer-v10-book` | 2 | 2 | Adaptive (@media/@supports/@container) | 7779, 7797 |
| `.writer-v10-book-cover` | 2 | 2 | Adaptive (@media/@supports/@container) | 7782, 7797 |
| `.writer-v10-bookshelf .writer-v10-bookshelf-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 8942, 9043 |
| `.writer-v10-bookshelf .writer-v10-bookshelf-toolbar` | 2 | 1 | Review repeated declaration | 8131, 8927 |
| `.writer-v10-bookshelf-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 7778, 7797 |
| `.writer-v10-discovery-pane` | 2 | 2 | Adaptive (@media/@supports/@container) | 8760, 8777 |
| `.writer-v10-discovery-pane .writer-v10-related-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 8859, 9046 |
| `.writer-v10-discovery-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 8763, 8778 |
| `.writer-v10-related-card .writer-v10-related-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 8880, 9047 |
| `.writer-v101-table-scroll` | 2 | 2 | Adaptive (@media/@supports/@container) | 7822, 7848 |
| `.writer-v1010-sidebar-toolbar` | 2 | 2 | Adaptive (@media/@supports/@container) | 9084, 9140 |
| `.writer-v1010-sidebar-toolbar > .writer-v1010-sidebar-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 9089, 9145 |
| `.writer-v1010-sidebar-toolbar > .writer-v1010-sidebar-filter` | 2 | 2 | Adaptive (@media/@supports/@container) | 9104, 9146 |
| `.writer-v1011-notion-calendar` | 2 | 2 | Adaptive (@media/@supports/@container) | 9392, 9474 |
| `.writer-v1011-notion-day` | 2 | 2 | Adaptive (@media/@supports/@container) | 9395, 9475 |
| `.writer-v1011-notion-timeline-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 9402, 9476 |
| `.writer-v1011-notion-toolbar > input` | 2 | 2 | Adaptive (@media/@supports/@container) | 9362, 9477 |
| `.writer-v1011-study-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 9337, 9478 |
| `.writer-v102-image-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 7943, 7969 |
| `.writer-v102-spaces-manager .writer-v102-space-entry` | 2 | 2 | Adaptive (@media/@supports/@container) | 7877, 7966 |
| `.writer-v102-spaces-manager .writer-v102-spaces-action` | 2 | 2 | Adaptive (@media/@supports/@container) | 7861, 7960 |
| `.writer-v102-spaces-manager .writer-v102-spaces-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 7860, 7959 |
| `.writer-v102-spaces-manager .writer-v102-spaces-header` | 2 | 2 | Adaptive (@media/@supports/@container) | 7855, 7958 |
| `.writer-v102-spaces-manager .writer-v102-spaces-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 7874, 7965 |
| `.writer-v102-spaces-manager .writer-v102-spaces-results.is-cards` | 2 | 2 | Adaptive (@media/@supports/@container) | 7875, 7964 |
| `.writer-v1050-settings-search .writer-v1050-result-group` | 2 | 2 | Adaptive (@media/@supports/@container) | 8680, 8744 |
| `.writer-v1050-settings-search .writer-v1050-result-target` | 2 | 2 | Adaptive (@media/@supports/@container) | 8705, 8753 |
| `.writer-v1050-settings-search .writer-v1050-result-targets` | 2 | 2 | Adaptive (@media/@supports/@container) | 8700, 8750 |
| `.writer-v1050-settings-search .writer-v1050-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 8655, 8740 |
| `.writer-v106-drag-handle:focus-visible` | 2 | 1 | Intentional cascade override | 8786, 10308 |
| `.writer-v106-json-children` | 2 | 2 | Adaptive (@media/@supports/@container) | 8797, 8799 |
| `.writer-v107-columns` | 2 | 2 | Adaptive (@media/@supports/@container) | 8830, 8844 |
| `.writer-v107-db` | 2 | 2 | Adaptive (@media/@supports/@container) | 8802, 8839 |
| `.writer-v107-db-cell` | 2 | 2 | Adaptive (@media/@supports/@container) | 8810, 8841 |
| `.writer-v107-db-scroll th,.writer-v107-db-scroll td` | 2 | 2 | Adaptive (@media/@supports/@container) | 8808, 8840 |
| `.writer-v107-graph` | 2 | 2 | Adaptive (@media/@supports/@container) | 8812, 8842 |
| `.writer-v107-pdf-page iframe` | 2 | 2 | Adaptive (@media/@supports/@container) | 8837, 8843 |
| `.writer-v108-books-widget-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 9025, 9048 |
| `.writer-v11-chapter-body` | 2 | 2 | Adaptive (@media/@supports/@container) | 9491, 9509 |
| `.writer-v11-editor` | 2 | 2 | Adaptive (@media/@supports/@container) | 9492, 9509 |
| `.writer-v11-studio-actions button,.writer-v11-chapter-actions button` | 2 | 2 | Adaptive (@media/@supports/@container) | 9486, 9509 |
| `.writer-v11-studio-modal` | 2 | 2 | Adaptive (@media/@supports/@container) | 9482, 9509 |
| `.writer-v111-db-actions button` | 2 | 2 | Adaptive (@media/@supports/@container) | 9557, 9560 |
| `.writer-v111-db-fields` | 2 | 2 | Adaptive (@media/@supports/@container) | 9548, 9559 |
| `.writer-v111-number-structure` | 2 | 2 | Adaptive (@media/@supports/@container) | 9540, 9561 |
| `.writer-v1203-web-bookmark-open` | 2 | 2 | Adaptive (@media/@supports/@container) | 4594, 4625 |
| `.writer-v1203-web-bookmarks-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4585, 4624 |
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
| `.writer-v7-focus-mode .view-header` | 2 | 2 | Adaptive (@media/@supports/@container) | 3034, 3054 |
| `.writer-v7-rc-board-toolbar` | 2 | 2 | Adaptive (@media/@supports/@container) | 3299, 3461 |
| `.writer-v7-rc-card-head` | 2 | 2 | Adaptive (@media/@supports/@container) | 3343, 3466 |
| `.writer-v7-rc-corkboard` | 2 | 2 | Adaptive (@media/@supports/@container) | 3310, 3464 |
| `.writer-v7-rc-kanban` | 2 | 2 | Adaptive (@media/@supports/@container) | 3319, 3465 |
| `.writer-v7-rc-pacing-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3512, 3539 |
| `.writer-v7-rc-plotgrid-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3481, 3540 |
| `.writer-v7-rc-status` | 2 | 2 | Adaptive (@media/@supports/@container) | 3355, 3467 |
| `.writer-v7-stable-dependency-row>button` | 2 | 2 | Adaptive (@media/@supports/@container) | 3647, 3671 |
| `.writer-v7-studio-event` | 2 | 2 | Adaptive (@media/@supports/@container) | 3243, 3275 |
| `.writer-v7-studio-gallery-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 3218, 3277 |
| `.writer-v7-studio-gantt-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3256, 3276 |
| `.writer-v7-studio-graph-row` | 2 | 2 | Adaptive (@media/@supports/@container) | 3162, 3278 |
| `.writer-v7-timeline-date` | 2 | 2 | Adaptive (@media/@supports/@container) | 2947, 3049 |
| `.writer-v7-timeline-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 2925, 3048 |
| `.writer-v7-timeline-item::before` | 2 | 2 | Adaptive (@media/@supports/@container) | 2936, 3051 |
| `.writer-v7-timeline-list` | 2 | 2 | Adaptive (@media/@supports/@container) | 2916, 3050 |
| `.writer-v8-chat .writer-v8-chat-fake-audio` | 2 | 1 | Intentional cascade override | 7764, 7934 |
| `.writer-v8-chat .writer-v8-chat-fake-audio .writer-v8-chat-transcript-text` | 2 | 2 | Adaptive (@media/@supports/@container) | 7931, 7968 |
| `.writer-v8-chat-fake-audio.is-animating .writer-v8-chat-wave-bar` | 2 | 2 | Adaptive (@media/@supports/@container) | 4563, 4567 |
| `.writer-v8-home .writer-v8-home-grid.writer-v924-masonry` | 2 | 2 | Adaptive (@media/@supports/@container) | 7100, 7114 |
| `.writer-v8-home .writer-v8-home-quick-actions>.writer-v8-home-action` | 2 | 2 | Adaptive (@media/@supports/@container) | 5338, 5354 |
| `.writer-v8-home .writer-v8-home-search-region` | 2 | 1 | Complementary declarations | 5263, 5333 |
| `.writer-v8-home .writer-v8-home-title-icon` | 2 | 2 | Adaptive (@media/@supports/@container) | 5454, 5510 |
| `.writer-v8-home .writer-v8-home-title-icon svg` | 2 | 2 | Adaptive (@media/@supports/@container) | 5457, 5511 |
| `.writer-v8-home .writer-v903-widget-controls` | 2 | 2 | Adaptive (@media/@supports/@container) | 5387, 5443 |
| `.writer-v8-home .writer-v903-widget-controls>button` | 2 | 2 | Adaptive (@media/@supports/@container) | 5389, 5444 |
| `.writer-v8-home .writer-v905-gallery-frame` | 2 | 2 | Adaptive (@media/@supports/@container) | 5494, 5515 |
| `.writer-v8-home .writer-v905-note-list` | 2 | 2 | Adaptive (@media/@supports/@container) | 5465, 5514 |
| `.writer-v8-home .writer-v905-note-row .writer-v905-note-open` | 2 | 2 | Adaptive (@media/@supports/@container) | 5473, 5513 |
| `.writer-v8-home .writer-v925-grid>[data-section]` | 2 | 2 | Adaptive (@media/@supports/@container) | 9680, 9809 |
| `.writer-v8-home-calendar-days` | 2 | 2 | Adaptive (@media/@supports/@container) | 4528, 4536 |
| `.writer-v8-home-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 4468, 4498 |
| `.writer-v8-home-card-header h3` | 2 | 1 | Complementary declarations | 4470, 5135 |
| `.writer-v8-home-draft-tabs` | 2 | 1 | Intentional cascade override | 4483, 5162 |
| `.writer-v8-home-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4467, 4495 |
| `.writer-v8-home-grid>.writer-v8-home-clock-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 5268, 5316 |
| `.writer-v8-home-hero h2` | 2 | 2 | Adaptive (@media/@supports/@container) | 4460, 4496 |
| `.writer-v8-home-title-icon svg` | 2 | 1 | Intentional cascade override | 4511, 4745 |
| `.writer-v8-overview-header` | 2 | 1 | Complementary declarations | 4196, 4240 |
| `.writer-v8-overview-header strong` | 2 | 1 | Complementary declarations | 4197, 4241 |
| `.writer-v8-overview-items.is-cards` | 2 | 1 | Intentional cascade override | 4200, 4253 |
| `.writer-v8-overview-items.is-list .writer-v8-overview-tile` | 2 | 1 | Intentional cascade override | 4221, 4262 |
| `.writer-v83-cal-day` | 2 | 2 | Adaptive (@media/@supports/@container) | 4637, 4669 |
| `.writer-v83-cal-event` | 2 | 2 | Adaptive (@media/@supports/@container) | 4642, 4670 |
| `.writer-v83-calendar,.writer-v83-study` | 2 | 2 | Adaptive (@media/@supports/@container) | 4629, 4668 |
| `.writer-v83-calendar.writer-v9-calendar` | 2 | 2 | Adaptive (@media/@supports/@container) | 4804, 4946 |
| `.writer-v83-study-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 4657, 4671 |
| `.writer-v83-study-choices` | 2 | 2 | Adaptive (@media/@supports/@container) | 4662, 4672 |
| `.writer-v9-calendar-actions` | 2 | 2 | Adaptive (@media/@supports/@container) | 4814, 4950 |
| `.writer-v9-calendar-agenda-day` | 2 | 2 | Adaptive (@media/@supports/@container) | 4896, 4966 |
| `.writer-v9-calendar-header` | 2 | 2 | Adaptive (@media/@supports/@container) | 4808, 4947 |
| `.writer-v9-calendar-heading h2` | 2 | 2 | Adaptive (@media/@supports/@container) | 4812, 5145 |
| `.writer-v9-calendar-layout` | 2 | 2 | Adaptive (@media/@supports/@container) | 4828, 5146 |
| `.writer-v9-calendar-main` | 2 | 2 | Adaptive (@media/@supports/@container) | 4830, 4955 |
| `.writer-v9-calendar-month-day>.writer-v9-calendar-button` | 2 | 2 | Adaptive (@media/@supports/@container) | 4870, 4961 |
| `.writer-v9-calendar-month-dayhead` | 2 | 2 | Adaptive (@media/@supports/@container) | 4862, 4957 |
| `.writer-v9-calendar-subtitle` | 2 | 2 | Adaptive (@media/@supports/@container) | 4813, 4949 |
| `.writer-v9-calendar-time-slot` | 2 | 2 | Adaptive (@media/@supports/@container) | 4916, 4965 |
| `.writer-v9-calendar-timegrid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4904, 4964 |
| `.writer-v9-calendar-view-select` | 2 | 2 | Adaptive (@media/@supports/@container) | 4824, 4952 |
| `.writer-v9-calendar-weekday` | 2 | 2 | Adaptive (@media/@supports/@container) | 4853, 4962 |
| `.writer-v9-event-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 4930, 4963 |
| `.writer-v9-format-toolbar` | 2 | 1 | Review repeated declaration | 4678, 5133 |
| `.writer-v9-format-toolbar.writer-v1048-format-toolbar.is-floating` | 2 | 2 | Adaptive (@media/@supports/@container) | 8405, 8411 |
| `.writer-v9-space-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 4720, 4755 |
| `.writer-v9-space-sidebar` | 2 | 1 | Review repeated declaration | 5232, 8057 |
| `.writer-v9-toolbar-list>.setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 4793, 4799 |
| `.writer-v9-toolbar-list>.setting-item .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 4795, 4800 |
| `.writer-v901-home-result .writer-v901-home-result-open` | 2 | 2 | Adaptive (@media/@supports/@container) | 5285, 5319 |
| `.writer-v901-home-search-results` | 2 | 2 | Adaptive (@media/@supports/@container) | 5271, 5317 |
| `.writer-v901-icon-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 5198, 5227 |
| `.writer-v903-gallery-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 5409, 5445 |
| `.writer-v91-ai-chat-row .writer-v8-chat-group` | 2 | 2 | Adaptive (@media/@supports/@container) | 5628, 5710 |
| `.writer-v91-ai-chat-row.is-right .writer-v8-chat-group` | 2 | 1 | Complementary declarations | 5624, 5632 |
| `.writer-v91-ai-settings .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 5679, 5708 |
| `.writer-v91-ai-settings .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 5684, 5709 |
| `.writer-v91-mini-player` | 2 | 2 | Adaptive (@media/@supports/@container) | 5718, 5806 |
| `.writer-v91-mini-video` | 2 | 2 | Adaptive (@media/@supports/@container) | 5767, 5807 |
| `.writer-v91-sound-controls input[type="range"]` | 2 | 2 | Adaptive (@media/@supports/@container) | 5571, 5714 |
| `.writer-v91-sound-preview img` | 2 | 2 | Adaptive (@media/@supports/@container) | 5548, 5713 |
| `.writer-v91-sound-status input[type="range"]` | 2 | 2 | Adaptive (@media/@supports/@container) | 5541, 5707 |
| `.writer-v912-rule-editor :is(input,textarea,select)` | 2 | 2 | Adaptive (@media/@supports/@container) | 5927, 5947 |
| `.writer-v912-rule-editor .setting-item` | 2 | 2 | Adaptive (@media/@supports/@container) | 5921, 5945 |
| `.writer-v912-sidebar` | 2 | 2 | Adaptive (@media/@supports/@container) | 5852, 5948 |
| `.writer-v912-sidebar-card` | 2 | 2 | Adaptive (@media/@supports/@container) | 5878, 5949 |
| `.writer-v912-virtual-block` | 2 | 2 | Adaptive (@media/@supports/@container) | 5826, 5944 |
| `.writer-v92-column` | 2 | 2 | Adaptive (@media/@supports/@container) | 6114, 6198 |
| `.writer-v92-columns` | 2 | 2 | Adaptive (@media/@supports/@container) | 6110, 6197 |
| `.writer-v92-session` | 2 | 2 | Adaptive (@media/@supports/@container) | 6179, 6199 |
| `.writer-v922-iconic-actions .setting-item-control` | 2 | 2 | Adaptive (@media/@supports/@container) | 6388, 6444 |
| `.writer-v922-iconic-big` | 2 | 2 | Adaptive (@media/@supports/@container) | 6259, 6437 |
| `.writer-v922-iconic-big svg` | 2 | 2 | Adaptive (@media/@supports/@container) | 6269, 6438 |
| `.writer-v922-iconic-grid` | 2 | 2 | Adaptive (@media/@supports/@container) | 6338, 6439 |
| `.writer-v922-iconic-preview` | 2 | 2 | Adaptive (@media/@supports/@container) | 6249, 6436 |
| `.writer-v922-iconic-setting` | 2 | 2 | Adaptive (@media/@supports/@container) | 6389, 6443 |
| `.writer-v924-masonry .writer-v924-dragging` | 2 | 2 | Adaptive (@media/@supports/@container) | 7109, 7120 |
| `.writer-v924-masonry>.writer-v924-column` | 2 | 2 | Adaptive (@media/@supports/@container) | 7103, 7115 |
| `.writer-v925-grid .writer-v1205-resize-handle` | 2 | 2 | Adaptive (@media/@supports/@container) | 9696, 9812 |
| `.writer-v925-grid>[data-section][data-widget-size="wide"]` | 2 | 2 | Adaptive (@media/@supports/@container) | 7141, 7170 |
| `.writer-v93-flow-layout-graph .writer-v93-flow-items` | 2 | 2 | Adaptive (@media/@supports/@container) | 7835, 7847 |
| `.writer-v95-timeline` | 2 | 1 | Review repeated declaration | 7274, 9827 |
| `.writer-v95-timeline .writer-v95-timeline-head` | 2 | 1 | Review repeated declaration | 7475, 9908 |
| `.writer-v95-timeline *` | 2 | 2 | Adaptive (@media/@supports/@container) | 7285, 7695 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7425, 9893 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7415, 9897 |
| `.writer-v95-timeline.is-layout-horizontal .writer-v95-timeline-items` | 2 | 1 | Review repeated declaration | 7397, 9877 |
| `.writer-v95-timeline.is-layout-vertical .writer-v95-timeline-event` | 2 | 1 | Complementary declarations | 7385, 9860 |
| `.writer-v95-timeline.is-layout-vertical .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Review repeated declaration | 7388, 9864 |
| `.writer-v95-timeline.is-line-4.is-layout-horizontal .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7514, 9902 |
| `.writer-v95-timeline.is-line-4.is-layout-vertical .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7509, 9869 |
| `.writer-v95-timeline.is-line-5 .writer-v95-timeline-marker` | 2 | 1 | Review repeated declaration | 7519, 9857 |
| `.writer-v95-timeline.is-line-5.is-layout-horizontal .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7528, 9905 |
| `.writer-v95-timeline.is-line-5.is-layout-vertical .writer-v95-timeline-event:not(:last-child)::before` | 2 | 1 | Intentional cascade override | 7525, 9873 |
| `.writer-v95-timeline.is-theme-cards .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7649, 9924 |
| `.writer-v95-timeline.is-theme-classic .writer-v95-timeline-event-body` | 2 | 1 | Complementary declarations | 7445, 9921 |
| `.writer-v95-timeline.is-theme-compact .writer-v95-timeline-date` | 2 | 1 | Review repeated declaration | 7630, 9950 |
| `.writer-v95-timeline.is-theme-editorial .writer-v95-timeline-date` | 2 | 1 | Intentional cascade override | 7442, 7662 |
| `.writer-v95-timeline.is-theme-editorial .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7654, 9953 |
| `.writer-v95-timeline.is-theme-glass .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7671, 9976 |
| `.writer-v95-timeline.is-theme-minimal .writer-v95-timeline-event` | 2 | 2 | Adaptive (@media/@supports/@container) | 7590, 7692 |
| `.writer-v95-timeline.is-theme-minimal .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7591, 9935 |
| `.writer-v95-timeline.is-theme-minimal .writer-v95-timeline-head` | 2 | 1 | Review repeated declaration | 7596, 9939 |
| `.writer-v95-timeline.is-theme-poster .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7663, 9961 |
| `.writer-v95-timeline.is-theme-terminal .writer-v95-timeline-event-body` | 2 | 1 | Review repeated declaration | 7677, 9986 |
| `.writer-variant-option-header button` | 2 | 2 | Adaptive (@media/@supports/@container) | 305, 323 |
| `body.is-mobile .workspace-leaf-content[data-type="file-explorer"] .nav-file-title .writer-v92-favorite` | 2 | 1 | Review repeated declaration | 6088, 7044 |
| `body.is-mobile .writer-v1011-managed-mobile .workspace-leaf-content.writer-v1011-grouped-native-actions .nav-header > .nav-buttons-container` | 2 | 1 | Intentional cascade override | 9233, 9615 |
| `body.is-mobile .writer-v8-home .writer-v8-home-grid.writer-v925-grid` | 2 | 1 | Review repeated declaration | 7172, 9814 |
| `body.is-mobile .writer-v8-overview` | 2 | 1 | Intentional cascade override | 4236, 4319 |
| `body.is-mobile .writer-v8-overview-items.is-cards` | 2 | 1 | Intentional cascade override | 4237, 4320 |
| `body.is-mobile .writer-v8-tab-list>button` | 2 | 1 | Intentional cascade override | 4138, 4409 |

## Regra de limpeza
Só remover regras quando o estilo final for comprovadamente equivalente em todos
os contextos, e quando nenhuma regra antiga tiver papel de fallback para navegadores
sem suporte a valores CSS recentes. Antes de eliminar seletores sem referência textual
no JavaScript, verificar classes criadas dinamicamente e markdown de usuários.
Manter em camadas condicionais os tamanhos mobile, os estilos de tema da timeline
e os estados do dragger; nunca alterar o HeaderBar nativo do Surfing por dentro.
