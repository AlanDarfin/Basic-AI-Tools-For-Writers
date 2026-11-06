# Basic 11.1.0 — Integrações incrementais

A 11.1 expande recursos selecionados da v11 mantendo armazenamento e blocos Markdown existentes. Não se trata de paridade completa com os plugins de origem.

## Number Suite

**Implementado:**
- Numeração virtual de títulos H1–H6 em Live Preview, via decoração de linha CodeMirror, opcional e desativada por padrão.
- Contadores visuais separados para legendas `Figure:`, `Table:`, `Equation:`, `Code:` no modo de leitura. Contadores CSS permanecem contínuos ao longo das seções da visualização.
- Sumário navegável por títulos, legendas e definições de notas de rodapé/fim identificadas no Markdown.
- Opções PT/EN e respeito à configuração de desativação por nota `basic-numbering: false`.

**Limites:** sem referências cruzadas automáticas ou numeração de legendas no Live Preview; sem H7–H9, esquemas jurídicos personalizados, remapeamento real das notas de rodapé, lotes de numeração ou alteração de links. Alguns temas podem modificar a aparência das decorações. As referências do sumário são apenas navegação.

## Notion Suite / Make.md

**Implementado:**
- Construtor visual para os blocos `basic-suite-db` já usados pelo Basic, disponível em comando e configurações.
- Visualizações de tabela, quadro, galeria, lista, calendário, timeline e gráfico.
- Campos para pasta, título, colunas, grupo, ordenação, limite, filtro simples e campos de data/capa.
- Edição de bloco inteiro previamente selecionado no editor ou inserção de bloco novo.
- Verificação de conteúdo antes da inserção: se a nota mudou enquanto o modal estava aberto, a operação é recusada.
- Sem criação automática de pastas, notas ou linhas pelo construtor. O movimento de cartões e propriedades tipadas da 11.0 permanece disponível.

**Limites:** não há criador de bancos proprietário, designer de filtros com múltiplas condições, relações bidirecionais, subitens aninhados editáveis, automações ou recorrência de tarefas. A alternância temporária de layouts de um bloco não salva o tipo de visualização na nota sem usar o editor.

## Verificação e compatibilidade

- Módulos novos isolados sob `src/v11`, inclusos pelo build modular e pelo CSS existente.
- Testes de parsers, caminhos inválidos, campos, renderização opcional e controle de modificações.
- Ações de escrita de conteúdo são explícitas, preservando arquivos de outros plugins.
- Nenhuma chave externa ou chamada de rede é introduzida pelos novos módulos.
- A validação automatizada não substitui testes com Obsidian Android, temas externos e grandes cofres.

## Próximas lacunas (não incluídas nesta release)

- Paridade integral Number Suite e Notion Suite, Feuillets, Writing Studio, Custom Sorting, Google/Outlook/CalDAV, AnkiWeb/APKG, Zotero bidirecional, PDF multipágina próprio, StoryLine avançado, Homepage com layout livre, Forms/Bases avançadas e revisões em escala de PDF/EPUB/DOCX.
- Benchmarks de memória/tempo de carregamento, importação por lotes e validação visual real no dispositivo.
