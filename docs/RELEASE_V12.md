# Basic 12.0.0 · Toolkit unificado

**Requisitos:** Obsidian 1.11.4+ · Desktop e Android · Plugin ID inalterado: `basic-ai-tool-for-writers`.

Esta versão adiciona uma camada de ferramentas de escrita e compatibilidade com oito projetos comunitários. Ela reutiliza os módulos existentes do Basic em vez de clonar sistemas de IA, TTS ou sincronização.

## Novidades / Highlights

- Paleta com **65 ações de Markdown**, callouts, listas, estrutura e inserções.
- **Notas criptografadas opcionais:** novos arquivos locais com AES-256-GCM e PBKDF2-SHA256. A senha não é armazenada; nomes e pastas não são protegidos. Recurso desligado por padrão.
- **Anotação local de imagens:** caneta, setas, retângulos, texto e cobertura de região, exportando um PNG separado, sem substituir a imagem de origem.
- **Workbench de tarefas:** grupo por tag, filtro e marcar/desmarcar com checagem de alterações simultâneas.
- **Leitura contextual de texto selecionado** usando a voz do dispositivo configurada no Basic. Requer seleção de texto disponível, inclusive em PDFs cuja camada de texto esteja acessível.
- **Captura rápida e brainstorm**, extração de texto para nota vinculada, seis modelos de nota e foco temporário no explorador.
- **Central de integrações:** Ultimate Toolkit, Visual Kit, Snailkit, dropit, Syncthing Integration, Syncthing Manager, Obsidian Git e FIT, com execução manual dos comandos expostos pelos plugins instalados.
- **Central de sincronização:** seleção de provedor externo, inspeção de cópias locais de conflito e nenhum novo serviço automático.

## Install / Instalação

Baixe `main.js`, `manifest.json` e `styles.css` desta release e coloque os arquivos em `<cofre>/.obsidian/plugins/basic-ai-tool-for-writers/`. Reinicie ou recarregue o Obsidian e ative o Basic. Antes de atualizar, faça um backup do cofre.

## Limitações importantes / Important limitations

**Esta versão não incorpora integralmente os oito plugins.** Criptografia de pasta inteira, proteção de nomes/índices, edição HTML completa, colagem rica de imagens, transporte dropit, APIs Syncthing, integração Git/FIT independente e TTS bilíngue de PDF completo **continuam dependentes dos projetos originais**. No celular, suporte a vozes e imagem depende do WebView/Android e precisa de validação por dispositivo.

Evite usar Git, FIT e Syncthing com agendamentos simultâneos no mesmo cofre. O seletor do Basic controla apenas seus próprios botões manuais, não os sincronizadores já ativos.

Leia [a matriz de cobertura](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/docs/V12_SCOPE.pt-BR.md) e [a política de segurança](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/blob/main/SECURITY.md).

---

**English:** The release adds a 65-action writing palette, opt-in per-note encryption, non-destructive image annotation, tag-grouped tasks with concurrency guards, selection-based read-aloud, local capture, and optional command bridges to eight installed community plugins. Upstream folder encryption, whole-PDF bilingual TTS, full HTML editor, dropit transport, and Git/Syncthing engines are **not** bundled. Back up your vault before updating.
