# Sync companion source audit

Reviewed on 2026-11-12 against the original repositories. This record describes observed contracts; it does not embed upstream engines or source code. The inspected revisions identify the research baseline, not a runtime version allowlist.

**Português:** o Basic apresenta comandos e telas originais dos plugins instalados e ativos. Ler o resumo de estado não inicia sincronização, rede ou processos. Configuração, credenciais, confirmação e transporte continuam sob responsabilidade do plugin original. A seleção de provedor do Basic limita as ações de sincronização do Basic; ela não altera a agenda automática configurada em cada plugin externo.

**English:** Basic exposes original commands and screens from installed, active plugins. Reading the status summary starts no sync, network request or process. Configuration, credentials, confirmation and transport remain owned by the original plugin. Basic’s provider selection limits sync actions initiated from Basic; it does not change automatic schedules configured in external plugins.

## Source baseline

| Original project / manifest ID | Revision | Version / minimum Obsidian | License | Mobile metadata |
| --- | --- | --- | --- | --- |
| [LBF38/obsidian-syncthing-integration](https://github.com/LBF38/obsidian-syncthing-integration) / `syncthing-integration` | `12ca9b8bdb60a5d6527894aec802be11da06e3c8` | 2.4.0 / 1.0.0 | MIT | `isDesktopOnly: false` |
| [gustjose/obsidian-syncthing-manager](https://github.com/gustjose/obsidian-syncthing-manager) / `syncthing-manager` | `0e1e612982b21a27323e2f62a228689cdcdc6a13` | 1.4.5 / 1.11.4 | MIT | `isDesktopOnly: false` |
| [Vinzent03/obsidian-git](https://github.com/Vinzent03/obsidian-git) / `obsidian-git` | `8d1144aef2d41ffca6245a60199656e7a0c5ab17` | 2.43.0 / **1.13.0** | MIT | `isDesktopOnly: false` |
| [joshuakto/fit](https://github.com/joshuakto/fit) / `fit` | `e0b7af61393ef9cb973fc01d431b24fd2e9877fc` | 1.5.0 / 1.11.4 | MIT | `isDesktopOnly: false` |

Manifest and license evidence:

- Syncthing Integration: [manifest, lines 2–10](https://github.com/LBF38/obsidian-syncthing-integration/blob/12ca9b8bdb60a5d6527894aec802be11da06e3c8/manifest.json#L2-L10), [license](https://github.com/LBF38/obsidian-syncthing-integration/blob/12ca9b8bdb60a5d6527894aec802be11da06e3c8/LICENSE).
- Syncthing Manager: [manifest, lines 2–9](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/manifest.json#L2-L9), [license](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/LICENSE).
- Obsidian Git: [manifest, lines 4–10](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/manifest.json#L4-L10), [license](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/LICENSE).
- FIT: [manifest, lines 2–10](https://github.com/joshuakto/fit/blob/e0b7af61393ef9cb973fc01d431b24fd2e9877fc/manifest.json#L2-L10), [license](https://github.com/joshuakto/fit/blob/e0b7af61393ef9cb973fc01d431b24fd2e9877fc/LICENSE).

## Native commands and screens

Each command below is prefixed with the manifest ID when dispatched by Obsidian. Basic resolves the registered command again at the moment of use, preserving native checks and file-specific view state. A native panel can contain its own controls; Basic does not operate those controls automatically.

### Syncthing Integration

[Command registration, `src/main.ts`, lines 145–225](https://github.com/LBF38/obsidian-syncthing-integration/blob/12ca9b8bdb60a5d6527894aec802be11da06e3c8/src/main.ts#L145-L225):

| Command suffix | Basic action | Effect |
| --- | --- | --- |
| `syncthing-conflicts-modal` | Open native conflict dialog | Inspect local conflict files |
| `syncthing-diff-modal` | Compare the current note | Inspect; requires editor/file context |
| `syncthing-configuration-modal` | Open native Syncthing configuration | Explicit network inspection |
| `syncthing-plugin-settings` | Open native integration settings | Native settings screen |

The source registers dialogs, not an `ItemView`, and exposes **no manual sync command**. Basic does not invent one. Conflict/diff lookup uses vault files ([controller, lines 108–220](https://github.com/LBF38/obsidian-syncthing-integration/blob/12ca9b8bdb60a5d6527894aec802be11da06e3c8/src/controllers/main_controller.ts#L108-L220)). The configuration dialog loads devices and folders on mount ([component, lines 22–28](https://github.com/LBF38/obsidian-syncthing-integration/blob/12ca9b8bdb60a5d6527894aec802be11da06e3c8/src/components/configuration_table.svelte#L22-L28)); its own source warns that some controls/data are incomplete. Basic provides the native route without promising additional controls or reading its controller for passive status.

### Syncthing Manager

[Command registration, `src/main.ts`, lines 336–386](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/main.ts#L336-L386):

| Command suffix | Basic action | Effect |
| --- | --- | --- |
| `open-syncthing-view` | Open native dashboard | Panel `syncthing-view` |
| `view-file-versions` | Show current note versions | Explicit network inspection; requires editor/file context |
| `syncthing-force-scan` | Request sync now | Manual sync |
| `test-syncthing-connection` | Test connection | Explicit network request |
| `copy-debug-info` | Open connection diagnostics | Native report dialog; explicit network inspection |

The view type is [declared at `src/ui/view.ts:10`](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/ui/view.ts#L10), and [native activation reuses/reveals its leaf](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/main.ts#L770-L788). Versions [query the Syncthing API](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/ui/version-modal.ts#L19-L55). Diagnostics [fetch the server version when opened](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/ui/debug-report-modal.ts#L19-L43); despite its command ID, opening the dialog does not immediately copy to the clipboard.

Native settings remain at `app.setting.openTabById('syncthing-manager')`. Basic reads only the public cached fields [declared at `src/main.ts:51–54`](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/main.ts#L51-L54): `currentStatus`, `isPaused`, `connectedDevices`, `lastSyncTime`. Status values are [enumerated in `src/types.ts:33–44`](https://github.com/gustjose/obsidian-syncthing-manager/blob/0e1e612982b21a27323e2f62a228689cdcdc6a13/src/types.ts#L33-L44). The native `syncthing:status-changed` workspace event can refresh Basic’s cached summary without polling any API. Device names/maps and connection settings are excluded.

### Obsidian Git

[Commands, `src/commands.ts`](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/src/commands.ts):

| Command suffix | Source lines | Basic action | Effect |
| --- | --- | --- | --- |
| `open-git-view` | 29–52 | Source control | Native panel `git-view` |
| `open-history-view` | 54–78 | History | Native panel `git-history-view` |
| `open-diff-view` | 80–99 | Compare current note | Inspect; requires editor/file context and initialized Git |
| `list-changed-files` | 371–375 | List changed files | Local inspection; requires initialized Git |
| `fetch` | 128–133 | Fetch remote references | Network; changes Git references |
| `pull` | 119–126 | Pull remote changes | Sync; can change vault files |
| `push2` | 284–289 | Push existing commits | Sync; publishes commits |
| `push` | 163–170 | **Commit and sync** | Sync; creates a commit and synchronizes |

The `push`/`push2` distinction is intentional. Basic does not expose repository deletion, discard/reset, raw Git commands or automatic-scheduler toggles. Native diff commands prepare their own file/ref state; Basic does not construct a bare diff view.

Native configuration remains at `app.setting.openTabById('obsidian-git')`. [Cached readiness and state fields](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/src/main.ts#L54-L84) and the [operation enum](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/src/types.ts#L394-L399) ([values](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/src/types.ts#L427-L435)) provide a redacted activity summary. No file status entries, repository identity or credentials are copied.

**Mobile:** this inspected release supports mobile and requires Obsidian 1.13.0. The original plugin selects SimpleGit on desktop and IsomorphicGit elsewhere, then runs its own requirement checks ([`src/main.ts:540–572`](https://github.com/Vinzent03/obsidian-git/blob/8d1144aef2d41ffca6245a60199656e7a0c5ab17/src/main.ts#L540-L572)). Basic therefore detects registered commands and `gitReady`/`repositoryMissing` at runtime for operations; a mobile flag alone is insufficient. Native panels and settings remain useful for setup when operations are unavailable. Basic does not invoke those requirement checks, shell commands, `reloadSettings()` or backend initialization itself.

### FIT

[Command registration, `src/fitPlugin.ts:557–570`](https://github.com/joshuakto/fit/blob/e0b7af61393ef9cb973fc01d431b24fd2e9877fc/src/fitPlugin.ts#L557-L570):

| Command suffix | Basic action | Effect |
| --- | --- | --- |
| `fit-explain-status` | Inspect and explain status | Explicit network inspection; opens native `FitStatusModal` |
| `fit-sync` | Sync with FIT | Manual sync |

There is no registered native `ItemView`. The native [status command reloads local state and calls `fitSync.explainStatus()`](https://github.com/joshuakto/fit/blob/e0b7af61393ef9cb973fc01d431b24fd2e9877fc/src/fitPlugin.ts#L408-L433); Basic never calls it for a passive badge. Instead it reads the [cached `fitSync.isActive` getter](https://github.com/joshuakto/fit/blob/e0b7af61393ef9cb973fc01d431b24fd2e9877fc/src/fitSync.ts#L169) and `localStore.lastSyncedAt`, [written after successful sync](https://github.com/joshuakto/fit/blob/e0b7af61393ef9cb973fc01d431b24fd2e9877fc/src/fitPlugin.ts#L346-L355). Native settings remain at `app.setting.openTabById('fit')`; repository and PAT settings are never duplicated into Basic.

## Adapter contract and checks

`src/v13/companion-sync.js` exports bundle-local descriptors, `writerCompanionSyncActionAvailable(plugin,id,actionId)` and `writerCompanionSyncStatus(plugin,id)`. Availability inspects registered commands and required cached readiness only. It does not execute native check callbacks while rendering. The common manager owns Basic’s module/integration preferences, selected-provider gate and editor context validation immediately before explicit dispatch.

The detached snapshot contains only `status` and, where proven by the original contract, `paused`, `connectedDevicesCount`, `lastSync`. Manager’s last-sync value is its native time label; FIT’s is epoch milliseconds. Unknown contracts/values stay unknown. Unloaded or disabled integrations invalidate availability and status immediately. No API key, host, user/device name, repository path, raw settings object or file list is returned.

`tests/v13-companion-sync.test.cjs` covers command semantics, bilingual metadata, runtime mobile backend availability, disabled/unloaded integrations, redaction, unknown values and zero native command/transport execution during discovery and snapshots. These isolated tests do not claim a real transfer or physical Android device test.
