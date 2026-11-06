# Basic v11 — escopo de implementação e verificação

## Implementado na branch v11-development

- **Longform Studio:** seleção de livro, capítulos Longform na ordem definida, edição individual em áreas de texto por capítulo, salvamento explícito e protegido por verificação de conteúdo com `vault.process`, snapshots quando habilitados, acesso à nota original.
- **Revisão editorial:** consulta ao histórico de snapshots existente e comparação de linhas para documentos de até 500 linhas; comentários editoriais locais por caminho de nota.
- **Pesquisa universal:** pesquisa em nome, propriedades e texto de Markdown; escopos de livro, Space ou cofre, limite de arquivos configurável, limite de resultados, cancelamento ao mudar a consulta; links para notas.
- **Compilação:** prévia de manuscrito Markdown na ordem de capítulos e criação explícita de novo arquivo sem sobrescrita em `Basic Exports/`.
- **Bancos Markdown:** quadros `basic-suite-db` com arraste entre colunas existentes no desktop e seletor de mudança no Android/teclado; gravação de propriedade de grupo via frontmatter, snapshots opcionais e verificação de conflitos. Comando independente para editar uma propriedade tipada (texto, número, booleano, data e tags).
- **Homepage:** widget de acesso ao Studio, busca e diagnósticos; acesso pela biblioteca Longform.
- **Central de compatibilidade:** resumo local de módulos, extensões existentes e falhas registradas; leitura apenas.
- **Compatibilidade:** preserva estrutura do cofre e sintaxes de blocos antigos; recursos novos em módulos separados; documentação e testes de regressão.

## Limitações importantes

- O editor contínuo usa **uma textarea para cada capítulo**, com cada capítulo carregado ao expandir. Não é um único buffer CodeMirror multipágina, nem sincroniza edição simultânea entre várias abas. Ao abrir a cena em outro editor, verifique alterações pendentes antes de salvar.
- Comentários editoriais são notas de revisão locais em `data.json` associadas ao caminho do arquivo; ainda não são anotações por intervalo de texto nem se transferem automaticamente ao renomear uma nota.
- O comparador de snapshots apresenta somente linhas adicionadas/removidas e possui limites. A restauração continua no módulo Snapshots original.
- A pesquisa é incremental, mas não usa um índice persistente ou embeddings; em cofres grandes, o limite de varredura protege a interface.
- A exportação Studio é Markdown. O suporte anterior a Pandoc continua independente. Não há nova exportação de EPUB/PDF/DOCX nativa.
- O quadro permite mover cartões apenas entre colunas já existentes; não oferece o construtor integral de bancos ou automações do Notion Suite.
- Os testes de código não substituem validação real em Android, temas de terceiros, arquivos grandes ou múltiplos painéis.

## Ainda faltam integrações citadas para paridade ampla

1. **Notion Suite / Make.md:** criação visual de bancos e visões, relações bidirecionais, editor de subitens em árvore, fórmulas e filtros visuais mais avançados, recorrência e automações.
2. **Feuillets / Writing Studio:** edição contínua em um único buffer com árvore lateral, comentários ancorados ao texto e publicação com prévia avançada.
3. **Number Suite:** Live Preview, numeração completa de legendas, referências cruzadas, notas de rodapé e fim, H7–H9 e esquemas personalizados.
4. **Unique Suite:** configuração universitária completa, horários importados automaticamente e recursos avançados de agenda.
5. **Zotero:** estilos CSL dentro do Basic, PDFs anotados, sincronização bidirecional e OAuth opcional.
6. **Calendário:** Google/Outlook/CalDAV bidirecional, resolução de conflitos e sincronização de edições.
7. **Spaced Repetition / Anki:** importação `.apkg`, AnkiWeb e otimização personalizada de parâmetros FSRS.
8. **Custom Sorting / Flow / Dragger:** gramática integral, interface gráfica de fluxos e movimentos multijanelas atômicos.
9. **Media Gallery / Omnisearch:** miniaturas PDF multiplataforma e indexação opcional de documentos não-Markdown.
10. **Homepage:** editor completo de layout livre com redimensionamento por arraste e presets avançados.
11. **Storyteller / StoryLine:** editor visual completo para relações e validações de continuidade.
12. **Enhancement Suite / Various Complements:** diagnósticos de YAML em tempo real, gatilhos avançados de complemento e edição contextual expandida.
13. **Diagnósticos:** profiling real de performance, telemetria local opcional de duração de módulos, recuperação de falha e regressão visual no Android.

Esses itens **não devem ser anunciados como implementados** apenas porque constam do planejamento. A v11 prioriza a base integrada para avançar com segurança. Não remover compatibilidade com versões antigas ou sobrescrever conteúdo do usuário para perseguir paridade.
