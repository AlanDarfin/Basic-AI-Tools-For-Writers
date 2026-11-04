# 10.1.0 — revisão de todas as melhorias solicitadas (PT-BR)

A tabela cobre **todas** as áreas pedidas depois da v10.0, distinguindo a implementação real das limitações. O Basic mantém integrações próprias, sem copiar o código integral dos plugins originais. Testes automáticos não garantem aparência idêntica em todos os temas, versões do Obsidian ou WebViews Android.

| Plugin de referência | Implementação na 10.1 | Limites / o que validar |
| --- | --- | --- |
| Longform / StoryLine / BookNav | Scroll por aba, foco no capítulo movido e seleção por toque prolongado | Longform segue como fonte de dados; testar arrastar capítulos aninhados no Android |
| weph Bookshelf | Progresso manual, estados de leitura, estantes/gêneros, favoritos, ordenação por série, filtros e páginas | Sem rastreio automático da página em leitores externos |
| s1m4ne Workspace Plus | Checkpoints por Space, restauração, importação/exportação JSON e preservação de versão anterior | \`changeLayout\` pode variar conforme outros plugins e painéis mobile |
| Make.md Flow / Flexplorer / Custom Sorting | Flow \`graph\`, relações \`after\`, proteção contra ciclos e mais padrões sorting-spec, números/YAML descrescente | Não equivale ao motor completo do Make.md nem à gramática total sorting-spec |
| Media Gallery View | Paginação, multiseleção, cópia de links, trechos de documentos, preview de vídeo e PDF nativo | Não possui motor próprio de miniaturas de páginas PDF multiplataforma |
| Falcion UNITADE.md | Mais formatos-fonte, linha/coluna, Tab e proteção contra conflitos | Editor somente para texto; sem edição de DOCX/EPUB binário |
| Lemon695 Enhancement Suite | Validação YAML, filtros e CSV seguro de tabelas, rodapés e YAML em lote com snapshots | Nem todas as funções externas foram reproduzidas; alterações exigem confirmação |
| Qwyntex DoubleShift | Mesmo Shift/esquerdo/direito/qualquer, filtro por contexto e exclusão de modais | Conflitos variam conforme sistema e teclado |
| Iconic / Pretty Properties / Folder Notes | Controles uniformizados e alvos maiores nos componentes novos; customização antiga preservada | Testar visualmente temas antigos e telas de 720p |
| George-debug Timeline | IDs, eras, dependências, ordenação e paginação | Relação visual não é grafo interativo completo |
| LanguageTool / Advanced | Dicionário isolado por projeto, aceitar palavras só no livro e posição contida dos menus | LanguageTool remoto depende da rede; validar popup no Android |
| Harbor / Genkan / homepage | Presets de widgets nomeados e reordenação por teclado | Grade HTML/CSS, não editor visual completo de arrastar |
| Full Calendar | Importar/exportar ICS local, remover duplicatas e não sobrescrever notas | **Sem sincronização OAuth automática com Google/Outlook** |
| Spaced Repetition | Parâmetros de intervalos, último baralho lembrado e previsão de revisões | Algoritmo local estilo SM-2, não compatibilidade FSRS/Anki completa |
| Pomodoro | Histórico local, gráfico de sete dias, tarefas e relatório CSV | Sem nuvem ou notificações quando Obsidian estiver fechado |
| Keyshots / Complements / Variants / Snapshots | Funcionalidade anterior preservada; snapshots protegem operações YAML em lote | Cofres grandes precisam de perfil de performance |
| Remember Cursor | Várias tentativas de rolagem no Android, canceladas pela interação do usuário | Diferenças de WebView ainda exigem teste por aparelho |
| TTS / Soundscapes / Click Clack | Leitura nativa em trechos, pausa da música e retomada opcional | WebView pode não expor voz nativa; vozes online exigem autorização |
| Pandoc / Extended Syntax / Easy Typing | Sintaxes antigas preservadas; rodapés, CSV e YAML ampliam o fluxo | Exportação Pandoc requer binário no PC e nem todos os formatos têm round-trip |

## Migração, segurança e compatibilidade

- Notas, índices Longform e blocos legados permanecem; nenhuma reescrita obrigatória.
- Backup de Space atua **no layout**, não no conteúdo das notas.
- A edição YAML em lote começa desativada e pede confirmação, salvando snapshots antes de cada modificação.
- Importação ICS gera notas **novas**, sem sobrescrever as antigas.
- CSV protege células semelhantes a fórmulas para reduzir riscos ao abrir em planilhas.
- Progresso de leitura de livros é metadado local editável, não inferido pelas cenas.
- Áudios do chat continuam fictícios, sem gravação ou transcrição automática de microfone.

## Validações práticas pendentes

Testar no PC e Android com temas, tela 720p, dropdowns, cenas Longform aninhadas, som, atalhos, LanguageTool, importação ICS e galerias grandes. Testes de código não comprovam todas as diferenças específicas do sistema ou de serviços externos.
