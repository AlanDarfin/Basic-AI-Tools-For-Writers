# Companion source audit / Auditoria dos plugins conectados

Initially inspected on 2026-11-12 for Basic 13.8.0; the supplied Snailkit/Toolkit files were rechecked for 13.9.0 below. Revisions below identify the original source that informed each adapter. They are not minimum supported versions or a promise that every future release preserves private methods. Basic ships its own bridge code and references the installed plugin at runtime; these upstream implementations are not bundled.

Inspeção inicial de 12/11/2026 para o Basic 13.8.0; os arquivos fornecidos do Snailkit/Toolkit foram reconferidos para a 13.9.0 abaixo. As revisões abaixo identificam os fontes consultados; não representam versões mínimas nem garantem estabilidade futura de métodos privados. O Basic distribui seu próprio código de conexão e consulta o plugin instalado em tempo de execução; não inclui essas implementações externas.

| Plugin / manifest ID | Original revision / Revisão original | Manifest version; minimum Obsidian | License |
| --- | --- | --- | --- |
| Ultimate Toolkit / `ahmed-toolkit` | [ahmdmusa/obsidian-toolkit · 70506a95a9059aa86da1c7688ea24f8df3dd4899](https://github.com/ahmdmusa/obsidian-toolkit/tree/70506a95a9059aa86da1c7688ea24f8df3dd4899) | 2.9.17; 0.15.0+ | MIT |
| Visual Kit / `visual-kit` | [pedrohf-dev/visual-kit · e5766c85a36c7895bf775ae597ec05f8edb88217](https://github.com/pedrohf-dev/visual-kit/tree/e5766c85a36c7895bf775ae597ec05f8edb88217) | 0.9.0; 1.8.0+ | MIT |
| Snailkit / `snailkit` | [arnaudgastelblum/snailkit · ef857e50f501dc7cfa9cda47b63919259e1b06ed](https://github.com/arnaudgastelblum/snailkit/tree/ef857e50f501dc7cfa9cda47b63919259e1b06ed) | 0.2.9; 1.8.7+ | MIT |
| dropit / `dropit` | [smart-kits/dropit-obsidian · 00d5e59ec23d90571da51f9eb460f7c9f45256d8](https://github.com/smart-kits/dropit-obsidian/tree/00d5e59ec23d90571da51f9eb460f7c9f45256d8) | 3.3.1; 1.5.7+ | MIT |
| Syncthing Integration / `syncthing-integration` | [LBF38/obsidian-syncthing-integration · 12ca9b8bdb60a5d6527894aec802be11da06e3c8](https://github.com/LBF38/obsidian-syncthing-integration/tree/12ca9b8bdb60a5d6527894aec802be11da06e3c8) | 2.4.0; 1.0.0+ | MIT |
| Syncthing Manager / `syncthing-manager` | [gustjose/obsidian-syncthing-manager · 0e1e612982b21a27323e2f62a228689cdcdc6a13](https://github.com/gustjose/obsidian-syncthing-manager/tree/0e1e612982b21a27323e2f62a228689cdcdc6a13) | 1.4.5; 1.11.4+ | MIT |
| Obsidian Git / `obsidian-git` | [Vinzent03/obsidian-git · 8d1144aef2d41ffca6245a60199656e7a0c5ab17](https://github.com/Vinzent03/obsidian-git/tree/8d1144aef2d41ffca6245a60199656e7a0c5ab17) | 2.43.0; 1.13.0+ | MIT |
| FIT / `fit` | [joshuakto/fit · e0b7af61393ef9cb973fc01d431b24fd2e9877fc](https://github.com/joshuakto/fit/tree/e0b7af61393ef9cb973fc01d431b24fd2e9877fc) | 1.5.0; 1.11.4+ | MIT |
| LanguageTool / `languagetool` | [wrenger/obsidian-languagetool · 0d663b6c713ee88eeee35cc128a23c0277c72a69](https://github.com/wrenger/obsidian-languagetool/tree/0d663b6c713ee88eeee35cc128a23c0277c72a69) | 1.6.0; 1.13.6+ | AGPL-3.0 |

## Observed contracts / Contratos observados

| Companion | Capability used / Capacidade usada | Boundary / Limite |
| --- | --- | --- |
| Toolkit | `ttsMgr.playText`, pause/resume/stop and live state; exact commands; selected preferences through `saveSettings()`; `.fk-tts-player`, `.fs-float-btn`, `.ft-icon`. | Source-verified implementation methods, not a versioned public API. Speech provider is explicit. The audited online engine sends text to `translate.google.com/translate_tts`, despite its Edge label; Basic requires separate opt-in. Folder decoration remains owned by Toolkit. |
| Visual Kit | `visual-kit-html-note`; native annotation, image/clipboard/HTML commands; preference writes through `persist()`. | Desktop only. Annotation is a Modal, not an ItemView. `persist()` preserves its `{settings,index}` envelope; Basic never calls `saveData(settings)`. HTML registration/extension changes require reload. |
| Snailkit | Public `plugin.api.version===1`, `service('tasks')`, module availability; public Tasks version 1 reads and `setDone`; `addViewTab` cleanup; `snailkit:services-changed`; `openSettings(section)`. | Resolve the active service each time. Task completion retains expected path/line/raw and delegates concurrent-edit checks to Snailkit. One `snailkit-tasks` view contains multiple tabs. The note rail has no public arbitrary-coordinate setter. |
| dropit | Exact `sync`, `send-note`, `send-selection`, `process-note`, `rerun-last` commands; original settings. | No native ItemView or public transfer API was found. Send/receive are explicit; process/rerun are desktop-only and may invoke user-configured programs. Credentials, pairing and rules stay native. |
| Syncthing Integration | Original conflicts, note-diff and configuration dialogs. | No own manual sync engine or ItemView; configuration may contact Syncthing. Native editor requirements are preserved. |
| Syncthing Manager | `syncthing-view`, explicit scan/test/version commands; redacted values from already-maintained status; `syncthing:status-changed`. | Reading status makes no new request. Opening native views/actions may trigger their own refresh. A scan command is a request, not proof of completed synchronization. |
| Obsidian Git | Exact source-control/history/current-note-diff commands and registered views; read-only native readiness. | Mobile requires the plugin's own initialized backend, not only `isDesktopOnly:false`. Native `push` means commit-and-sync; `push2` means push. Generic view factories requiring a file/state cannot be opened as empty panels. |
| FIT | `fit-sync`, `fit-explain-status`. | No native ItemView; even status explanation can contact the remote and is an explicit action. |
| LanguageTool | Exact `check`, `clear`, `next`, `toggle-auto-check`; source-verified `runDetection(cm)`; `settings.update()` patches to four allowed preferences. | Restore the selected Markdown editor first: upstream reads active-note frontmatter. Its own underlines/notices own the result. Accounts, endpoint and dictionaries remain separate. Completion does not establish transport success because upstream handles some errors internally. |

The shared bridge checks plugin identity, module switches and the actual command/view/API before use. It does not install plugins, start synchronization, receive/send notes or run processors on registration. Native commands retain their own checks and behavior. Disabling a Basic bridge removes its UI connection and cleanup hooks; external jobs remain independent.

A conexão comum verifica a instância do plugin, interruptores e o comando/painel/API disponível antes do uso. Registrar a conexão não instala plugins, inicia sincronização, recebe/envia notas nem executa processadores. Comandos nativos conservam suas próprias verificações. Desligar a conexão no Basic remove sua UI e seus vínculos; rotinas externas continuam independentes.

## Mobile and explorer / Mobile e explorador

Toolkit's audited mobile fullscreen button uses `.fs-float-btn`; speech uses `.fk-tts-player`. Snailkit's rail uses `.sk-note-rail`, its adjacent panel `.sk-note-rail-panel`, and Tasks uses `.sk-tasks-fab`. Snailkit computes its rail coordinates from the pane header and safe area; Basic preserves anchored native geometry and confines any compatibility offset to the visible owning pane. Viewport resizing covers keyboard/rotation changes. Native text-positioned session controls are outside this layout bridge.

Duplicate explorer handling is scoped to native file/folder rows that contain both Toolkit's `.ft-icon` and Basic's `.writer-v9-explorer-icon`. Priority changes visibility of the duplicate decoration only, retaining both plugins' stored preferences. Basic-created classes/styles are restored on disable/unload.

No mobile, o Toolkit usa `.fs-float-btn` e `.fk-tts-player`; o Snailkit usa `.sk-note-rail`, `.sk-note-rail-panel` e `.sk-tasks-fab`. O posicionamento mantém o painel dono, a área visível e a geometria das janelas ancoradas. Controles de sessão associados à posição do texto ficam fora dessa conexão. Ícones duplicados só são tratados nas linhas reais do explorador que contêm as decorações dos dois plugins; desligar restaura os estilos.

## Reviewed pull requests / PRs revisados

- [#136](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/136), source head `838e726e6a88e927a55390fdf9f465344f4600da`: visual-only Longform arc dividers, draft-specific preferences and mobile pickup. Integration fixes retain the prompt's original draft, refuse a deleted draft, reanchor by chapter identity/surviving original order and apply preference changes only after a successful native index write.
- [#137](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/137), source head `51a98dba637aeed9bda808aa6fbf929d4cb905f2`: stable en/em dash conversion, immediate/Space-triggered replacements and Backspace restoration. Integration additionally leaves active IME composition and multi-cursor deletion to the native editor. Existing explicitly saved dash preferences are retained.

- [#138](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/pull/138), source head `776f14bf015e37c556541dd5610eb08566f9d539`: homepage title/icon group centering, narrow-pane/mobile stacking and fixed SVG/image slot alignment. Verified with native Obsidian geometry measurements at desktop, narrow and tablet widths, including a long title and local custom image. No homepage settings or stored content changed.

Tests exercise these contracts with synthetic plugin instances, including unavailable commands, disable/reload, stale editors, setting persistence and explicit actions. They do not establish live remote service availability or physical Android/iOS compatibility. Actual verification results belong in the release notes and QA artifact; do not infer them from this source audit.

Os testes usam instâncias sintéticas e cobrem capacidades ausentes, desligamento/recarregamento, editores antigos, persistência e ações explícitas. Eles não comprovam disponibilidade de serviços remotos nem compatibilidade física Android/iOS. Os resultados de verificação ficam nas notas da versão e no artefato de QA.

## Supplied files rechecked for 13.9.0 / Arquivos fornecidos reconferidos

The user supplied the Snailkit 0.2.9 and Ultimate Toolkit 2.9.17 manifests and styles, plus Snailkit's JavaScript. Both manifests and both stylesheets are byte-identical to the official release assets used in the original audit. The supplied Snailkit JavaScript differs from the official release only by the 18-byte trailing `\n/* nosourcemap */` comment; the executable implementation is unchanged. No Toolkit JavaScript was attached; its previously audited official 2.9.17 implementation remains the reference.

O usuário forneceu os manifests e estilos do Snailkit 0.2.9 e do Ultimate Toolkit 2.9.17, além do JavaScript do Snailkit. Manifests e estilos são idênticos, byte a byte, aos arquivos oficiais usados na auditoria inicial. O JavaScript fornecido do Snailkit difere apenas pelo comentário final de 18 bytes `\n/* nosourcemap */`; a implementação executável é a mesma. Não foi anexado JavaScript do Toolkit; sua implementação oficial 2.9.17 já auditada continua como referência.

| Supplied file / Arquivo fornecido | SHA-256 |
| --- | --- |
| Snailkit `manifest.json` | `f8cc7a3ad8f3177fee6fa3d34fabd2ca807346544958bb2251b6be9ef745ca1d` |
| Snailkit `styles.css` | `c6388128b950140e6e064e4cad1423ff0488e231b85ac1f5ebe6c8b257421614` |
| Snailkit `main.js` | `d8bcec0389ca0af53c0c822a252c40b1648e724f99895f733b8f3acfe70f2799` |
| Toolkit `manifest.json` | `0dcf4608d637d96d43b9241113eaed86e97202326831286dd4f69c7174110fe4` |
| Toolkit `styles.css` | `6bca050c2dfd11eb6b8f26d67900a9d7d98fdb73875c3f66c49ab3dedbb70d86` |

The follow-up mobile audit includes Snailkit's rail and anchored panels, task button/tag fan, tag/table/done-task/slash popups and native popover behavior. Toolkit selection/image toolbars and their child pickers must be treated as anchored groups; its lightbox and speech player can compete with Basic dialogs. Snailkit's pins popup can use the browser top layer through `showPopover()`, so increasing a z-index alone does not establish correct ordering. The new layout preserves native DOM/anchors and temporarily suspends secondary controls when needed rather than invoking undocumented close functions or dropping obstacles.

A revisão móvel inclui a barra e os painéis ancorados do Snailkit, botão/leque de tarefas, popups de etiquetas/tabelas/concluídas/slash e popovers nativos. Barras de seleção/imagem do Toolkit e seus seletores filhos precisam ser tratados como grupos ancorados; lightbox e player podem competir com diálogos do Basic. O popup de favoritos do Snailkit pode usar a camada superior do navegador com `showPopover()`, portanto aumentar apenas o z-index não resolve a ordenação. O novo posicionamento preserva DOM/âncoras e suspende controles secundários temporariamente, sem chamar fechamentos privados presumidos nem descartar obstáculos.

Basic's task date filters/quick capture, read-from-cursor and explorer folder-focus additions use independent native implementations and existing Basic feature switches. Their behavior was informed by the original plugins; no original implementation was copied into the distributable. The MIT upstream credits and source revisions above remain unchanged. Final behavior and device-specific verification belong in the 13.9.0 release/QA record.

Filtros de prazo/captura de tarefas, leitura pelo cursor e foco de pastas usam implementações próprias e os interruptores nativos já existentes do Basic. O comportamento foi estudado nos plugins originais, sem copiar suas implementações para o pacote. Créditos MIT e revisões dos fontes acima permanecem preservados. O comportamento final e as verificações por dispositivo pertencem ao registro de versão/QA da 13.9.0.
