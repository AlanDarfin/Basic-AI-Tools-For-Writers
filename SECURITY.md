# Security and privacy / Segurança e privacidade

Basic AI Tool for Writers uses the Obsidian vault APIs to read and write notes for writing, Longform projects, local snapshots and search. Vault enumeration is needed to build these indexes.

## Pandoc (integrated and optional)

Pandoc remains part of the main plugin and is **disabled by default**. On desktop only, it uses Node.js `child_process.spawn` with `shell: false` to run a local Pandoc executable and `node:fs` for temporary conversion files. Its executable setting must point to `pandoc` or `pandoc.exe`; no other executable name is permitted. It checks `app.isMobile` before loading Node APIs, creates the exported output via the vault API, and cleans up temporary files.

**Important:** this still grants the locally installed Pandoc process its normal operating-system permissions. A Pandoc conversion may access files or retrieve resources referenced by Markdown, depending on the input and Pandoc installation. Avoid using untrusted executables or exporting untrusted documents.

Community scanners can continue to report **Direct Filesystem Access** and **Shell Execution** because they detect Node APIs, even though the plugin does not invoke a system shell. These APIs are not hidden or obfuscated.

## Optional online tools / Ferramentas online opcionais

AI, translation, grammar, online dictionaries and neural text-to-speech may transmit text you deliberately submit to their configured providers. Review each provider's privacy policy before sending sensitive manuscripts. Local notes and snapshots stay in your vault unless shared through a configured feature. User-invoked copy/paste tools may access the system clipboard.

IA, gramática, tradução, dicionários e TTS online podem transmitir o texto selecionado aos provedores configurados. O Pandoc integrado usa recursos de arquivos e processos somente no computador e pode acessar recursos locais/remotos durante a exportação. Acesse apenas serviços e executáveis confiáveis.

## Network disclosures (four `requestUrl` call sites)

The four network request call sites reported by the community scanner are distinct capabilities, **not four automatic requests when Obsidian opens**. Their execution depends on the relevant feature. This inventory is based on the shipped 7.0.1 source:

| Feature / request | When it runs | Destination | Information sent |
| --- | --- | --- | --- |
| Unicode index download (`GET`) | User explicitly downloads the optional Unicode database | `www.unicode.org` | Download request; no manuscript text in the request |
| LanguageTool grammar check (`POST`) | Manual review, or after editing **while the Review tab is open in Grammar mode and auto-check is enabled** | Default `api.languagetool.org/v2/check`, or a custom HTTPS endpoint | The text/window being checked, language and optional LanguageTool API key |
| AI model discovery (`GET`) | User requests or refreshes the list of available models | Selected provider's models endpoint, or local Ollama | Authorization key when configured; no manuscript text |
| AI requests (`POST`) | User invokes dictionary, translation, writing, assistant, proofreading or related AI features | Selected cloud provider, a custom HTTPS endpoint, or local Ollama | Word/text being processed, prompts, optional contextual manuscript/project information, and provider credentials |

**Additional transport:** the optional online speech synthesizer sends the requested reading text via a **WebSocket** connection to `speech.platform.bing.com` only after the user opts into that TTS option. WebSocket usage may not be counted among the four `requestUrl` sites.

A configured AI or grammar provider may record transmitted text according to its own policies. The auto-grammar check is enabled by default **inside the active Review/Grammar workflow** and uses a debounced editor-change trigger; it does not submit every note simply because a vault is opened. Turn off automatic grammar checks in the Review settings to avoid those background-on-edit submissions. For sensitive material, use local features and avoid enabling remote providers. These disclosures describe the current code paths, not a guarantee about external services or future code changes.

### Avisos de rede em português

As quatro chamadas identificadas são: **download do índice Unicode** (solicitado pelo usuário; não envia o manuscrito), **verificação gramatical pelo LanguageTool** (envia o trecho analisado e pode acontecer automaticamente enquanto a aba Revisão/Gramática está ativa), **listagem de modelos de IA** (pode enviar a chave do provedor, mas não o manuscrito) e **solicitações à IA** (enviam texto, prompts e eventualmente contexto de notas/projetos ao provedor escolhido). O **TTS online** também envia o texto de leitura ao serviço da Microsoft por WebSocket, após autorização.

A revisão automática está ativada por padrão dentro do fluxo de Revisão/Gramática; você pode desativá-la nas configurações. Os provedores remotos podem armazenar os dados conforme suas políticas. Não ative essas funções para textos confidenciais sem avaliar os riscos.

## Vulnerability reporting / Reporte de vulnerabilidades

Use GitHub's private vulnerability reporting option, **if available**. Otherwise open a minimal issue requesting a private contact channel, without any exploit details, secrets or manuscript content. Never post personal vault data in public issues.

Não publique informações sensíveis ou detalhes de exploração em issues públicas.
