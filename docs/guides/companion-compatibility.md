# Connected plugins

[Português](companion-compatibility.pt-BR.md)

Basic connects to separately installed community plugins. Install and enable the original plugin first, then open **Settings → Basic → General → Integrations & sync** or **Connected plugins** from the command palette. The center shows the running plugin, its available commands and its original settings.

You can turn all integrations off, disable the bridge for one plugin, hide the Basic launcher or choose where panels open. Disabling a bridge keeps both plugins' data and preferences. It does not disable the external plugin or change its automatic jobs.

## Panels and settings

A panel opens in the chosen sidebar or a new tab, and an existing panel is reused. Commands that open a dialog continue to use that dialog. Disabled modules, unregistered commands and desktop-only features stay unavailable. Basic does not move another plugin's interface into its own DOM.

| Companion | Connection |
| --- | --- |
| **Ultimate Toolkit** | Native tools and settings; optional speech provider; mobile player/button layout; explorer icon priority. |
| **Visual Kit** | Native image annotation, clipboard/image actions, HTML notes and settings. Desktop only. |
| **Snailkit** | Native Workbench; Basic writing tab through its public Tasks API; task previews and explicit completion; section-specific settings. |
| **dropit** | Native receive/send commands and settings. Desktop processing rules remain separate explicit actions. |
| **Syncthing Integration** | Original conflict, note-difference and configuration dialogs. It does not expose a manual synchronization engine. |
| **Syncthing Manager** | Native dashboard, current status, note versions and explicit connection/scan actions. |
| **Obsidian Git** | Registered source-control/history views and explicit Git commands, subject to its backend being ready. |
| **FIT** | Explicit synchronization and remote status explanation. No separate native panel. |
| **LanguageTool** | External checker, editor suggestions, navigation and selected native preferences, alongside Basic's independent built-in checker. |

Selected simple Toolkit/Visual Kit preferences are saved through the original plugin's settings writer. Reload requirements remain visible. Accounts, tokens, repositories, pairing and processing rules stay in each plugin's original settings. A plugin update may change a private method; Basic checks capabilities at use time and leaves unavailable actions disabled.

## Choose a speech provider

**Basic** remains the default. Installing Toolkit does not change your voices. Choose **Ultimate Toolkit** under **Speech provider** to send Basic's selected/current text to its own player. Toolkit must be installed with speech enabled. Its voices and languages come from its original settings. Pause/resume/stop in Basic apply to playback started through this connection.

**Allow Toolkit online speech** is a separate permission, initially off. The audited Toolkit version labels its online engine as Edge but actually requests Google Translate speech, with language choices limited by its implementation. Basic does not describe that engine as offline or reuse Basic's Edge settings. Device voices also depend on the system and may require network access. An unavailable chosen provider does not silently fall back to another one.

## Grammar and LanguageTool

Basic's built-in LanguageTool client works without the external plugin. Choose the **external checker** when you want the installed LanguageTool plugin to check the note in its native editor and present its own underlines and notices. Open that note in an editor first. The bridge restores the appropriate editor when starting a check from Basic.

External automatic checking, language and picky mode can be configured through the bridge; the account, endpoint, dictionaries and full configuration remain in LanguageTool. Its note properties `lt-language`, `lt-autoCheck` and `lt-picky` can override global choices. Its automatic checks can run with the Basic pane closed. Turn automatic checking off in that plugin if you want it to stop; disabling Basic's bridge alone does not change it.

A manual check can send the current note or selection to the external plugin's configured server. Basic's own endpoint and credentials remain independent. Changing the note, configuration or selected checker invalidates obsolete Basic review results. A request already sent can still complete at the service.

## Mobile buttons and the explorer

**Arrange mobile buttons** adjusts supported Toolkit and Snailkit controls around the visible viewport, native bars and other detected controls. It responds to viewport/keyboard resizing and keeps pane-owned controls inside their pane. The original handlers and settings remain intact. Disable it to restore their original styling. The layout can only reposition a control where enough space exists.

Use Snailkit's native **Note rail** settings for its left/right position and enabled buttons. Visual Kit is unavailable on mobile. Obsidian Git's availability depends on the installed version, repository and initialized mobile backend; the bridge does not add desktop Git to Android.

When both Basic and Toolkit add an explorer icon, choose **Ultimate Toolkit**, **Custom Basic** or **Both**. This controls the duplicate decoration without deleting folder/file styling preferences. Changing icon priority does not recolor notes or rewrite Toolkit's folder map.

## Synchronization

Choose one **Manual synchronization provider** to enable its effectful actions. Selecting it does not transfer files. Every sync, remote inspection, receive, send or processing action requires a click. Opening a native panel may use the external plugin's own refresh behavior.

Git's **Commit and sync** can create a commit and transfer changes; **Push** is a separate action. FIT's status explanation can contact its remote. Syncthing itself and the other plugins' schedules continue to run according to their own settings. Basic reports command dispatch and available native state; dispatch does not certify a completed transfer.

For inspected revisions, licenses, API boundaries and platform requirements, see the [source audit](../maintenance/COMPANION_SOURCE_AUDIT.md). Basic's minimum Obsidian version does not override an external plugin's newer requirements.
