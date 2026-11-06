# Basic 12.0.5 — Funções ainda não integradas dos plugins de origem

Este relatório compara os módulos realmente presentes no Basic com a documentação e os recursos dos plugins originais consultados em 6/11/2026. **Integração parcial não significa paridade** e alguns recursos do original exigem Obsidian mais recente (por exemplo, Number Suite 1.12.7+, enquanto o Basic ainda anuncia 1.11.4+).

## Unique Suite
**Presente:** central de estudos, captura de aula, notas diárias/mensais, lembretes Markdown e bloco `basic-timetable`; calendário e feeds ICS próprios do Basic continuam separados.

**Falta:** interface completa da Unique Agenda com visualizações mês/semana, camadas independentes para horário/eventos locais/cada feed; importação ICS integrada à estrutura universitária com sincronização periódica e histórico; configuração e migração completa da estrutura Unique; biblioteca pesquisável de atalhos com combinações de teclas; paridade dos painéis e controle de semestres.

## Notion Suite / Make.md
**Presente:** blocos `basic-suite-db` e `basic-suite-chart` (tabela, quadro, lista, galeria, calendário, timeline e gráfico), pesquisa/ordenação, filtros básicos, fórmulas aritméticas, parte de rollups, edição tipada e quadro com arraste entre colunas; construtor visual de bloco; Spaces, Flow e explorar pastas selecionadas no Basic.

**Falta:** banco de dados com visão de página inteira e sidebar nativa completa; construtor de filtros aninhados (E/OU) por tipo, múltiplos critérios e múltiplas ordenações; relações bidirecionais mantidas automaticamente; conjunto integral de propriedades, validações e fórmulas; subitens hierárquicos editáveis, IDs únicos gerenciados, alterações em lote e linhas recorrentes; WIP limits com diferentes políticas, agrupamento secundário e cálculos completos; widgets Notion, exibição/edição de propriedades na página, vistas salvas, exportação CSV, abas de bancos, layout de colunas e mobiliário de página (breadcrumbs/ícones/capas/toggles) em paridade com o plugin de origem.

**Make.md em particular:** ainda faltam fluxos e automações completos, busca/ações da interface original e arranjo inteiramente livre de todos os painéis. A 12.0.5 adiciona **redimensionamento por bordas** com grade ou largura livre para widgets da homepage, mas não transforma o Obsidian em um editor de janelas totalmente independente.

## Number Suite
**Presente:** numeração virtual H1–H6 no Modo de Leitura e Live Preview opcional; contadores visuais de legendas no modo de leitura, sumário navegável e escrita/remoção da numeração da nota atual com prévia e confirmação.

**Falta:** H7–H9/DocWen; esquemas jurídico/chinês e editor de esquemas personalizados por nível; ocultação virtual de números já gravados e controle de marcadores históricos; referências cruzadas semânticas `@[[...]]`; numeração integral de notas de rodapé e notas finais; vinculação de legenda a objetos e escolha de posição; exclusão individual/subárvore de contadores; configurações e esquemas por nota mais detalhados; mapa mental 2D; ações por pasta/cofre com prévia completa, desfazer em lote e recuperação.

## Outros módulos integrados apenas parcialmente
- **Longform / Feuillets / Writing Studio:** ainda não há edição contínua CodeMirror em buffer único entre vários capítulos; comentários editoriais ancorados em intervalos e sincronização de sessões de edição simultâneas; pipeline nativo avançado para EPUB/PDF/DOCX ainda depende de ferramentas existentes.
- **Custom Sorting / Flow:** gramática integral de sorting, fluxos gráficos completos e comandos multijanelas atômicos continuam parciais.
- **Zotero:** sem sincronização bidirecional integral, estilos CSL incorporados e anotação de PDFs pelo próprio módulo.
- **Calendário / Repetição espaçada:** sem sincronização bidirecional Google/Outlook/CalDAV com conflito resolvido, AnkiWeb e importação APKG integral.
- **Omnisearch / Media Gallery / StoryLine:** cobertura limitada de arquivos não Markdown, miniaturas PDF completas e edição visual avançada de relações/validação de continuidade.
- **Surfing:** na 12.0.5 a homepage monta, quando disponível, o componente nativo `HeaderBar` do Surfing habilitado. Isso usa **API interna** (não contrato público): atualizações upstream podem exigir ajustes. Não duplica o navegador nem importa automaticamente seus favoritos.
- **Testes:** CI valida sintaxe, módulos e regressões simuladas; compatibilidade visual com todos os temas, comportamento real no Android e performance em cofres grandes requerem validação no aplicativo.

Fontes: https://github.com/Benhaman9/unique-suite · https://github.com/navysum/notion-suite · https://github.com/ZHYX91/obsidian-number-suite · https://github.com/PKM-er/Obsidian-Surfing

Os READMEs principais são listagens das funções atuais. Este relatório não é uma promessa de paridade integral.
