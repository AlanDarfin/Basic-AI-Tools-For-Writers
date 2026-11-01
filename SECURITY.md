# Security and privacy / Segurança e privacidade

Basic AI Tool for Writers uses the Obsidian vault APIs to read and write notes for writing, Longform projects, local snapshots and search. Vault enumeration is needed to build these indexes.

## Pandoc (integrated and optional)

Pandoc remains part of the main plugin and is **disabled by default**. On desktop only, it uses Node.js `child_process.spawn` with `shell: false` to run a local Pandoc executable and `node:fs` for temporary conversion files. Its executable setting must point to `pandoc` or `pandoc.exe`; no other executable name is permitted. It checks `app.isMobile` before loading Node APIs, creates the exported output via the vault API, and cleans up temporary files.

**Important:** this still grants the locally installed Pandoc process its normal operating-system permissions. A Pandoc conversion may access files or retrieve resources referenced by Markdown, depending on the input and Pandoc installation. Avoid using untrusted executables or exporting untrusted documents.

Community scanners can continue to report **Direct Filesystem Access** and **Shell Execution** because they detect Node APIs, even though the plugin does not invoke a system shell. These APIs are not hidden or obfuscated.

## Optional online tools / Ferramentas online opcionais

AI, translation, grammar, online dictionaries and neural text-to-speech may transmit text you deliberately submit to their configured providers. Review each provider's privacy policy before sending sensitive manuscripts. Local notes and snapshots stay in your vault unless shared through a configured feature. User-invoked copy/paste tools may access the system clipboard.

IA, gramática, tradução, dicionários e TTS online podem transmitir o texto selecionado aos provedores configurados. O Pandoc integrado usa recursos de arquivos e processos somente no computador e pode acessar recursos locais/remotos durante a exportação. Acesse apenas serviços e executáveis confiáveis.

## Vulnerability reporting / Reporte de vulnerabilidades

Use GitHub's private vulnerability reporting option, **if available**. Otherwise open a minimal issue requesting a private contact channel, without any exploit details, secrets or manuscript content. Never post personal vault data in public issues.

Não publique informações sensíveis ou detalhes de exploração em issues públicas.
