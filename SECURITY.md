# Security and permissions

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature if it is enabled. Otherwise contact the maintainer privately rather than sharing exploit details in a public issue. Do not include vault contents, API keys or personal information.

## What the plugin accesses

- **Vault files:** Chapter navigation, Longform projects, search, snapshots, grammar tools and other writing features may enumerate, read and write files inside the vault using Obsidian's API. Review a tool's settings before enabling it.
- **Clipboard:** Copy and paste tools can access the system clipboard only when a user invokes the relevant functionality. Avoid copying secrets when using clipboard features.
- **Network:** AI and optional translation, grammar and speech services may send selected text or requests to configured remote providers. Check provider settings and privacy policies before enabling these modules. The plugin does not guarantee that third-party services retain no data.
- **Desktop Pandoc:** The optional exporter is disabled by default and unavailable on Android. On desktop, it uses Node.js `fs` to manage temporary files and `child_process.spawn` to launch the locally installed Pandoc executable. It passes fixed argument arrays with `shell: false`, uses a timeout and cleans its temporary directory. The output is imported back into the vault. A user-configurable executable path remains a powerful setting: only choose an executable that you trust. The plugin manifest remains `isDesktopOnly: false` because all other features support mobile.

## Limitations

Automated scanner notices for filesystem access and process execution are expected while Pandoc remains integrated, even though those operations are guarded by a desktop-only, opt-in path. A scanner warning is not proof of malicious behavior; neither is a passing scan proof of complete safety.

The community package consists of `main.js`, `manifest.json` and `styles.css`; GitHub Actions builds and attests these assets. Build attestation confirms provenance, not the absence of vulnerabilities.

Back up your vault and plugin settings before upgrading.
