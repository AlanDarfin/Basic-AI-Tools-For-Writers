# Auditoria histórica 10.6.0 — Basic AI Tool for Writers

**Escopo:** pedidos da v1 à 10.6 recuperados do histórico, documentação do repositório, módulos ativos e regressões. Data: 05/11/2026. A presença no código não comprova funcionamento em todos os dispositivos. Não há garantia de paridade integral com plugins externos.

## Correções e funcionalidades entregues nesta atualização

| Origem | Nova implementação | Observação |
| --- | --- | --- |
| Homepage / Harbor / Genkan (v8–10) | Início de sessão limpa: converte UMA aba principal em homepage e fecha as outras abas principais restauradas; mantém painéis laterais; desliga restauração automática de múltiplas homes durante a carga; guarda de sessão impede limpeza em atualização/hot reload; comando manual com confirmação | Funciona ao iniciar o Obsidian com o plugin carregado antes do layout ficar pronto. No primeiro carregamento tardio de um plugin recém-instalado, por segurança não fecha abas já abertas |
| Dragger (Ariestar) | Alça para blocos; parágrafos, títulos, listas, tarefas, citações/callouts, tabelas, código cercado; mover bloco ou seleção; recuo de listas, indicação da posição; toque prolongado no Android; comandos de teclado e conversão de tipo; personalização de alça | Adaptação própria. O Dragger original pode coexistir: a alça Basic fica desabilitada se ele estiver ativo |
| Enhancement Suite (v10) | Explorador de JSON hierárquico **somente leitura**, em modal, com limites de profundidade e tamanho | Não é substituição entre arquivos nem edição JSON em massa |
| Alan's Offline Dictionary (v1) | Assistente opcional para procurar `.obsidian/plugins/alans-offline-dictionary/data.json` e associar somente caminho válido de nota Markdown à integração de dicionários | **Não copia API keys**, não apaga notas nem configurações e não muda o ID do Basic |

## Verificação de integrações antigas

| Período | Referência(s) pedida(s) | Status do Basic | Lacuna conhecida / validação |
| --- | --- | --- | --- |
| **v1–2** | Alan's Offline Dictionary; IA/dicionários; traduções | Dicionário Markdown, consulta local, provedores e tradução; assistente de caminho nesta versão | Migração integral do `data.json` antigo **não** existe; evitar migrar segredos automaticamente |
| **v3–4** | Various Complements; VariantEditor; Note Snapshots | Sugestões locais/contextuais, variantes e snapshots próprios presentes | Ainda não equivale à cobertura de gatilhos/fontes do Various Complements, formatos nativos de snapshots ou ao UI do VariantEditor |
| **v4** | LanguageTool, LanguageTool Advanced, Remember Cursor, Typewriter, TTS | Funcionalidades centrais presentes; controle de hover, dicionário, rolagem/cursor e vozes opcionais | Posicionamento de popover no Android, restauração do scroll em várias WebViews e TTS de qualidade uniforme precisam de validação real. **Grammarly explicitamente excluído** |
| **v5–6** | Keyshots, Easy Typing, Smart Typography, Extended Syntax, Pandoc; Longform + BookNav/NoteChain | Comandos, sintaxes, navegação, hierarquia, cenas e exportação opcional presentes | Pandoc depende do binário no PC; round-trip com formatos binários não é garantido; drag de capítulos aninhados requer teste |
| **v7** | StoryLine, Storyteller Suite, Folder Notes, compêndio, Timeline, StoryLine e cenas | Tags, notas e dependências de história, série, calendário fictício e timeline presentes | Canvas visual totalmente editável de relações e análise semântica profunda das cenas ausentes |
| **v8** | Harbor, Genkan, Full Calendar Remastered, Spaced Repetition, Media Gallery, Chat, Widgets | Homepage, pesquisa, relógio, calendário, galeria, chat fictício, widgets, estudos e blocos presentes | Áudio no chat é transcrição **simulada**, sem capturar/transcrever áudio real; FSRS e agenda remota ausentes |
| **v9** | Make.md/Spaces/Flow, Flexplorer, Custom Sorting, Iconic, cMenu, Editing Toolbar, Pretty Properties, Click Clack, Soundscapes, Pomodoro | Spaces e ordenação personalizada parciais; toolbar, explorador, ícones e propriedades próprios; música/foco no PC | Editor completo de banco de dados e fórmulas/rollups Make.md, gramática integral sorting-spec e operações de Flow avançadas ausentes. Compatibilidade de UI Android não comprovada |
| **v9–10** | Zotero, Meta Bind, Progressbar, Virtual Content, Session Notes, Media Gallery | Blocos e fontes Markdown locais, citações importadas, notas de sessão e widgets presentes | Zotero não possui OAuth/sync direto/CSL; PDF multipágina sem miniaturas personalizadas |
| **v10** | Bookshelf, Workspace Plus, UNITADE.md, Enhancement Suite, DoubleShift, Image Inserter | Biblioteca/progresso manual, histórico de Spaces, editor de texto, YAML, tabelas, atalhos, inserção de imagens presentes | Sem editar DOCX/EPUB binários, sem todas ferramentas Enhancement Suite, sem sincronização externa; no Android há limitações de gesto |
| **v10.5** | Related Notes, Trash Explorer, progresso de leitura, novos widgets e Zotero | Notas relacionadas locais, lixeira interna, progresso no editor/leitura, quatro novos widgets e citações presentes | Busca não é semantic embedding; lixeira do sistema não está disponível; Zotero trabalha apenas com notas já importadas |
| **v10.6** | Dragger; homepage limpa; retorno a recursos históricos | Implementações novas descritas acima | Gestos na WebView/temas precisam de teste manual; movimentação entre diferentes notas e colunas estilo Notion não integra esta versão |

## Lacunas concretas ainda não implementadas integralmente

- Make.md: databases relacionais, fórmulas, rollups, editor gráfico avançado Flow e gramática completa de Custom Sorting.
- Zotero: conexão direta e sincronização bidirecional de biblioteca/attachments; processamento de PDF com anotações nativas e exportação CSL.
- Full Calendar: OAuth/CalDAV e sincronização em tempo real com Google Agenda/Outlook.
- Estudios: algoritmo FSRS/compatibilidade completa Anki (apenas repetição local estilo SM-2).
- Media Gallery: geração própria e multiplataforma de miniaturas página a página de PDFs.
- StoryLine e Storyteller: canvas arrastável de dependências entre cenas e análise semântica aprofundada.
- Enhancement Suite: validação YAML visual contínua com diagnóstico por posição, substituição em lotes entre arquivos, JSON editor hierárquico (o visualizador é somente leitura).
- Dragger: mover blocos entre notas distintas, criar layout multicoluna e paridade completa do menu/barras móveis do plugin de referência.
- TTS e LanguageTool: diferenças específicas entre Windows/Linux/Android e WebView permanecem dependentes do ambiente.
- **Acessibilidade e visual:** correções antigas de ícones, altura de campos, barra mobile, realce do cursor, hover e rolagem precisam de inspeção no aplicativo, não apenas de busca no código.

## Condições de segurança e regressão

- Nunca apagar arquivos de notas ao fechar abas restauradas; a limpeza age apenas em folhas raiz do espaço principal.
- Não fechar painéis laterais nem executar o reset na atualização/recarregamento do plugin.
- Em caso de erro ao criar homepage, manter as abas antigas; comando manual de reset pede confirmação.
- Movimentação de blocos faz uma operação no editor, para permitir **desfazer**; não processa conteúdo remotamente.
- O assistente v1 lê localmente e não copia credenciais, tokens nem conteúdo de notas.
- Não instalar/copiá-lo por cima do Dragger original; a alça própria desliga quando detecta o plugin externo ativo.

## Validação manual ainda necessária

1. Iniciar o Obsidian com seis abas antigas como na captura; confirmar somente uma homepage, sem alterar sidebars.
2. Abrir novas abas durante a sessão; confirmar que a opção de homepage em nova aba continua funcionando sem limpar os documentos ativos.
3. Desativar/recarregar/atualizar o Basic no meio do trabalho; abas devem permanecer intactas.
4. Arrastar tabelas, callouts, tarefas e listas aninhadas; conferir Undo, foco, rolagem automática, menus e toque prolongado no Android.
5. Testar temas claros/escuros, resolução 720p, múltiplas janelas e painel dividido.
6. Usar o explorador JSON com objetos/arrays e o assistente v1 com cópias de configurações antigas e notas de teste.

**Conclusão:** o plugin integra grande parte das funcionalidades essenciais citadas desde a v1, mas várias funções especializadas dos originais continuam parciais. Esta tabela distingue presença no código, integração nova e limitações sem presumir completude.
