# Basic v12.0.0 — Cobertura real e compatibilidade

Esta versão acrescenta ferramentas originais inspiradas em oito plugins comunitários, sem incorporar integralmente os respectivos projetos. A integração externa depende dos plugins originais estarem instalados e ativados.

## O que foi implementado

| Origem | Funcionalidades v12 | O que continua externo ou pendente |
| --- | --- | --- |
| [Ultimate Toolkit](https://github.com/ahmdmusa/obsidian-toolkit) | Paleta de 65 ações; seleção contextual com leitura e cópia; reaproveitamento do TTS e IA já existentes; foco temporário em pastas; notas criptografadas individualmente com AES-256-GCM e PBKDF2-SHA256 | Criptografia de pastas inteiras, proteção do índice de busca e nomes, TTS bilíngue com parsing completo de PDF/HTML, HUD completo do Live Preview e bloqueio geral de emergência |
| [Visual Kit](https://github.com/pedrohf-dev/visual-kit) | Visualizador, tamanho de embeds com prévia e confirmação, anotador PNG local com caneta/seta/retângulo/texto/cobertura | Editor HTML completo, rich paste/copy com imagens, deduplicação binária e edição de camadas do projeto original; ele é exclusivo de desktop |
| [Snailkit](https://github.com/arnaudgastelblum/snailkit) | Workbench de tarefas agrupadas por etiqueta e com alternância atômica, brainstorm e extração de texto para nota vinculada | Workbench original completo, exportação PPTX, seleção de coluna e gesto de mouse próprio |
| [dropit](https://github.com/smart-kits/dropit-obsidian) | Captura rápida na Inbox e botão de comando externo quando instalado | Pareamento QR, aplicativo/servidor remoto, push/pull, recebimento automático e processamento por agente/CLI |
| [Syncthing Integration](https://github.com/LBF38/obsidian-syncthing-integration) | Ponte para comandos do plugin externo e inspeção de conflitos locais | API Syncthing embutida, dados de conexão, dispositivos, ignorados e transportes |
| [Syncthing Manager](https://github.com/gustjose/obsidian-syncthing-manager) | Central manual, seleção de provedor e comparação textual somente leitura de conflitos | Controle completo de pastas/dispositivos, versionamento e mescla de conflitos pelo motor original |
| [Obsidian Git](https://github.com/Vinzent03/obsidian-git) | Executar comandos fornecidos pelo plugin instalado (somente mediante ação do usuário) | Git nativo, autenticação, stage, push/pull, diff e histórico próprios |
| [FIT](https://github.com/joshuakto/fit) | Mesma ponte manual e mecanismo de escolha de provedor do Basic | API GitHub, geração de tokens, sincronização e resolução de conflitos próprios |

## Arquitetura e dados

- Arquivos nativos: `src/v12/unified-toolkit.js`, `secure-notes.js`, `task-workbench.js`, `image-annotations.js`, `selection-reader.js`.
- Nenhum código-fonte dos oito projetos foi copiado. Os direitos e licenças continuam com seus autores; ver `THIRD_PARTY_NOTICES.md`.
- Os módulos já existentes de IA, TTS, barra de edição, pesquisa, calendário, Spaces e Longform não foram duplicados.
- Os scripts de sincronização são **exclusivamente os dos plugins externos**; escolher um provedor na central do Basic não desliga jobs automáticos dos demais.
- O plugin não guarda chave de GitHub, Syncthing, FIT ou dropit. A rede é acessada pelo próprio plugin externo, conforme a configuração dele.

## Segurança

As notas criptografadas devem ser **criadas diretamente** pelo comando do Basic. O programa não converte nem exclui o arquivo original e não fornece criptografia de pastas. A senha precisa ter ao menos 12 caracteres; nunca é armazenada pelo Basic. O formato usa AES-256-GCM, salt aleatório, IV aleatório e PBKDF2-SHA256 (310 mil iterações). Títulos, nomes, tamanhos, pastas e existência dos arquivos permanecem visíveis. Uma senha perdida não pode ser recuperada.

O Workbench de tarefas recusa gravação se o conteúdo mudou entre a leitura e a operação. O editor de imagens salva um **novo PNG**, deixando o original visível; uma região coberta no PNG exportado não remove a imagem de origem. A extração de texto escreve a nota nova antes de substituir a seleção. O foco em pastas só muda a aparência do explorador.

## Comandos adicionais

- Formatar: paleta unificada (65 opções).
- TTS: ler seleção em documentos, com a voz local do Basic e texto selecionável.
- Privacidade: criar nota criptografada; Privacidade: abrir nota criptografada.
- Imagens: anotar nova cópia PNG; Imagens: padronizar largura.
- Tarefas: Workbench com etiquetas; Tarefas: localizar em notas.
- Captura: guardar na Inbox; Ideias: criar brainstorm local.
- Notas: separar trecho em nova nota vinculada; Modelos: inserir estrutura pronta.
- Explorador: focar pasta / mostrar todas; Toolkit: central de integrações; Sincronização: abrir central.

## Validação e limitações de plataforma

- [x] Build modular e arquivo distribuível sincronizados.
- [x] Testes para autenticação de nota criptografada, senha incorreta, adulteração, parser de tarefas e concorrência de escrita.
- [x] Suíte de testes, sintaxe, CSS, metadados e empacotamento em GitHub Actions (branch de desenvolvimento).
- [ ] Testes manuais completos no Obsidian para PC e Android, com diferentes temas.
- [ ] Auditoria de segurança de implementação e testes externos de sincronização.

O leitor não faz OCR nem analisa integralmente PDFs: exige texto selecionável na interface. O anotador do Basic é próprio; o Visual Kit original continua restrito a desktop. Esta v12 não deve ser anunciada como uma cópia completa de nenhum dos oito plugins.
