# Plugin support

[Português](companion-compatibility.pt-BR.md)

Basic's writing tools work without external plugins. Support for an installed plugin helps its available controls, panels and commands coexist with Basic. It does not install that plugin, replace its engine or copy its credentials. The [README support table](../../README.md#supported-plugins) describes each of the nine supported plugins.

There is no dedicated **Integrations** settings page. Each external plugin keeps its full configuration in its own settings. Existing panel commands and saved compatibility preferences remain available for established workflows. A saved shortcut to the former page now opens **Advanced editing**, where Basic's native mentions and AI writing actions remain configurable.

## Native tools: no companion required

### Tasks with dates and quick capture

Open Basic's task dashboard to filter **All**, **Today**, **Overdue**, **Next seven days** or **Undated** tasks. Dates use your local calendar day. Completed tasks have a separate visibility switch. Task text can contain a due date such as `📅 2026-11-20` or `[due:: 2026-11-20]`, and priority tags `#high`, `#medium` or `#low`.

Choose **New task** to append a task to an **existing Markdown note**. Select the destination, enter the description and optional date, priority and tags, then generate the preview. Review the destination and exact Markdown line before adding it. Editing a field invalidates the old preview. A changed, moved or deleted note, unsaved editor changes or an unfinished code/properties block can block the write; refresh the preview or save the note before retrying. Capture does not silently create a new inbox or overwrite concurrent edits.

Task dashboard, capture and date filters use Basic's existing task feature switch. They do not require Snailkit or its task database.

### Read from the cursor

Open a Markdown note in edit mode, place the cursor and run **Read from cursor**, or use the corresponding button under **Read aloud**. Basic reads from that position using the current editor buffer, including unsaved text. It honors the character limit, speech feature switch and selected provider; Markdown regions already excluded from reading remain excluded. The command does not save the note.

**Basic** remains the default provider. Installing Toolkit does not switch voices. If you explicitly select **Ultimate Toolkit** under **Speech provider**, it must be installed with its speech feature enabled. Its own settings choose its voices and languages. Basic's pause/resume/stop controls apply to playback it initiated through Toolkit.

**Allow Toolkit online speech** is a separate permission, initially off. The audited Toolkit 2.9.17 labels its online engine as Edge but sends passages to Google Translate; supported languages depend on its implementation. This is independent of Basic's Edge engine and Microsoft permission. Device voices also depend on the system and may use network access. An unavailable selected provider does not silently switch to another.

### Focus a folder in the explorer

Use **Focus this folder** from a folder's native explorer context menu. Basic shows an inline path and **Show all** action in the explorer, rather than adding another floating panel. The existing focus command for the current note's folder remains available. **Show all** restores the complete tree, and disabling folder focus removes its temporary presentation.

Folder focus is visual. It does not encrypt files, block access, move notes or rewrite the original explorer icons. The folder-focus feature switch remains under **Quick actions**.

## Where options live

| Option | Basic settings |
| --- | --- |
| Task scanning and task dashboard switch | **Tasks & capture** |
| Speech provider, voices, online permission and cursor reading | **Read aloud** |
| Folder-focus switch | **Quick actions** |
| Duplicate icon priority | **File explorer** |
| Arrange floating controls on mobile | **Files & tools** |
| Native note mentions and AI writing actions | **Advanced editing** |
| External LanguageTool checker | **Grammar** |

## Mobile controls and the explorer

**Arrange floating controls on mobile** coordinates supported Toolkit and Snailkit controls with the visible pane, bars, open menus and dialogs. Attached popups retain their native anchors. When a safe position does not exist, secondary controls can be temporarily hidden instead of being placed over an obstruction; they return when the obstruction closes or space becomes available. This coordination does not change the external plugin's stored coordinates, notes or feature settings.

The passive layout support operates independently of Basic's quick-actions master switch. Earlier explicit layout/plugin opt-outs are retained. Turning the layout option off restores the styling managed by Basic. Choose the rail side and enabled Snailkit buttons in Snailkit's native **Note rail** settings.

Under **File explorer**, choose **Ultimate Toolkit**, **Custom Basic icon** or **Show both** when both plugins decorate the same row. The choice changes the duplicate decoration's visibility and retains both plugins' preferences and elements.

Visual Kit remains desktop-only. Obsidian Git on mobile requires its own available, initialized backend. Basic does not add desktop Git to Android. Viewport/CSS emulation does not replace testing native navigation, device keyboards or floating panels on physical Android/iOS hardware.

## Grammar, panels and synchronization

Basic's built-in LanguageTool client works without the external plugin. Select the external checker in **Grammar** to use the installed plugin's editor underlines, notices and native actions. Basic restores the relevant editor and checks available capabilities. The external plugin retains its account, endpoint, dictionaries and note overrides (`lt-language`, `lt-autoCheck`, `lt-picky`). Its automatic checking can continue with the Basic pane closed; disable it in that plugin when you want it to stop.

Existing companion-panel commands reuse registered native views. Commands that open dialogs continue to open native dialogs. Disabled modules, missing commands and unsupported platform features remain unavailable. Full plugin configuration belongs to the original plugin, including repositories, pairing, processing rules and automatic schedules.

Basic does not start transfers or synchronize files when recognizing a companion. Legacy manual synchronization actions still require an explicit provider selection and click. Git's **Commit and sync** can create commits and transfer changes; FIT's status command can contact its remote when the installed release offers it. Opening a native panel can trigger that plugin's own refresh. Command dispatch does not certify a completed transfer.

See the [source audit](../maintenance/COMPANION_SOURCE_AUDIT.md) for inspected versions, licenses, API boundaries and the original files supplied for the mobile review. An external plugin's newer Obsidian requirement still applies.
