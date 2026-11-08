# Auditoria funcional — Basic 13.2.0

Base revisada: `main` 13.1.0 e os dois commits do PR #127, `b0df227` e `b48c77a`. A atualização incorpora esse trabalho e prioriza correções reproduzíveis que preservam o texto e o histórico do escritor.

## Resultado por área

| Área | Revisão e mudanças nesta versão |
| --- | --- |
| Configuração, módulos e ferramentas de IA | Revisão do fluxo inicial já implementado no PR #127, com rotas de configuração e status de conexão; nenhuma chave nova ou solicitação real foi necessária para os testes. |
| Dicionário, tradução, chat e revisão | Inclui busca local, gravação com verificação de duplicatas, tradução do editor atual com proteção de Markdown, cancelamento e verificação da nota de destino. Veja [os fluxos principais](CORE_WORKFLOWS.pt-BR.md). |
| Blocos interativos | Corrige seleção do bloco entre duplicatas e protege a gravação contra mudanças concorrentes e cercas inseridas no corpo. |
| Revisão local e beat-sheet | Reconhece palavras com acentos combinantes e preserva pipes em wikilinks ao interpretar as batidas. |
| Longform | O texto enviado para salvar é separado do texto digitado depois; as novas alterações continuam no rascunho com estado correto. |
| Histórico e renomeações | Serializa as mutações do índice por nota e mantém identidades, comentários e rascunhos após renomear pastas, sem atingir nomes de pastas apenas parecidos. |
| Workbench | Reconhece o tamanho e o tipo da cerca antes de encerrar um exemplo; a marcação continua atômica e preserva CRLF. |
| Homepage, Spaces, calendário, mídia, numeração e integrações | Inventário de fontes, documentação e cobertura existente; esta versão não amplia a paridade com todos os plugins de origem. |
| Distribuição | Versões e arquivos gerados sincronizados; workflow usa as notas específicas em `docs/releases/X.Y.Z.md` quando disponíveis e preserva os três anexos oficiais. |

## O que ainda falta ou merece evolução

1. **Escrita contínua:** um buffer CodeMirror compartilhado por capítulos e comentários ancorados em intervalos, com tratamento de edições simultâneas. Os capítulos atuais continuam em editores individuais, com salvamento explícito.
2. **Bancos e relações:** filtros E/OU aninhados, relações bidirecionais, alterações em lote, recorrência e fórmulas mais completas.
3. **Numeração e estudos:** referências cruzadas semânticas, esquemas personalizados por nível, operações em lote e agenda universitária completa.
4. **Integrações externas:** sincronização bidirecional de calendário e Zotero, AnkiWeb e publicação avançada EPUB/PDF/DOCX continuam dependendo de trabalho específico ou ferramentas externas.
5. **Qualidade:** testes visuais no Android e em temas de terceiros, medidas de desempenho em cofres grandes e manutenção dos stubs de testes históricos que ficaram fora da suíte registrada.

Esses recursos exigem desenho e validação próprios. O [inventário de integrações](V12_0_5_INTEGRATION_GAPS.pt-BR.md) contém o detalhamento por origem; não são apresentados como concluídos nesta release.

## Validação e limites

As regressões novas reproduzem edições em blocos duplicados, cercas internas, Unicode, digitação durante salvamento, criação e exclusão concorrente de snapshots, renomeação de pastas e tarefas dentro de código. O build recompõe `main.js` e `styles.css`; a validação completa verifica sintaxe, sincronização, contratos de DOM/CSS, metadados e os testes registrados. O lint de CSS é executado separadamente no CI.

O ambiente local usa Node 24; o CI executa Node 22, conforme as instruções do projeto. Os testes de serviços usam respostas simuladas. Isso não verifica a disponibilidade dos provedores nem substitui teste de toque em Android.

Validação local concluída: `npm ci --ignore-scripts --no-audit --no-fund`, `npm run build`, `npm run check` com **121 arquivos de regressão aprovados**, lint CSS com **3 casos aprovados**, metadados e integridade do ZIP com os três arquivos de instalação. Os quatro arquivos novos acrescentam **24 casos comportamentais**.

Em um cofre temporário no **Obsidian 1.15.0 para Linux**, o Basic 13.2.0 carregou e registrou seus comandos. A verificação no aplicativo confirmou: editar o segundo de dois blocos `editor-note` idênticos preserva o primeiro; inserir uma cerca de três crases no conteúdo aumenta a cerca externa para quatro; variantes compostas/decompostas de “coração” são agrupadas na revisão; e dois snapshots simultâneos permanecem no índice. Esse teste não cobre Android, todos os temas ou a versão mínima 1.11.4.

As cinco falhas de testes históricos fora do runner, já registradas no PR #127, correspondem a dependências ausentes nos stubs e expectativas antigas de pesquisa/layout. Elas permanecem uma tarefa de manutenção separada; a suíte registrada deve passar integralmente para publicar.
