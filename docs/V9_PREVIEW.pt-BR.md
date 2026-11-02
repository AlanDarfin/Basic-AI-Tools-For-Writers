# Basic AI v9 — prévia de integração

Versão: **9.0.0-beta.1**. Ainda não é um lançamento estável.

## Implementado nesta branch

| Pedido | Implementação |
| --- | --- |
| Barra inspirada no cMenu | 21 ações Markdown; botões opcionais e ordenáveis, modo compacto e comandos na paleta. Ativada no PC, **desativada no celular por padrão**. |
| Smart Spaces locais (opcional) | Coleções salvas filtradas por pasta/tag/propriedade, exibidas em cartões, lista, tabela ou quadro. Desligadas inicialmente; não criam painel extra. |
| Explorador inspirado no Make.md | Ícones Lucide, cores, menu contextual para arquivos/pastas, visualização de pastas com busca, cartões/listas e criação de índice Markdown. Nenhuma barra lateral nova. |
| Homepage | Título centralizado, ícone transparente, mais Lucide ou imagem do cofre/HTTPS, ícone acima do título no celular ou ao lado no PC, relógio acima do calendário. |
| Módulos | Barra de formatação e explorador podem ser desativados, opções próprias e interface PT-BR/EN. |

## Levantamento arquitetural do Make.md

A árvore original consultada tem cerca de 634 arquivos, incluindo núcleo, adaptadores Obsidian, armazenamento e cache, Spaces, Flow Editor e Maker Mode. Copiar tudo criaria sobreposições de navegação, modelos de dados, CSS e dependências. Esta implementação é uma **adaptação independente de recursos**, não um fork integral.

| Subsistema de origem | Abordagem no Basic | Situação |
| --- | --- | --- |
| Ícones e navegação | Melhorias no explorador nativo | Implementação inicial |
| Cartões/listas de pasta | Ação contextual e overview Markdown já existente | Implementação inicial |
| Spaces e coleções | Smart Spaces locais e opcionais; não incluem o mecanismo relacional original | Implementação parcial |
| Bancos, relações, fórmulas e rollups | Exige modelo compatível com Markdown/propriedades | Não implementado |
| Tabelas, quadros e calendários de banco | Aproveitar calendário e Longform; respeitar Bases | Não portado integralmente |
| Flow e transclusões editáveis | Blocos inline do Basic são independentes | Não portado |
| Maker Mode/menu / | Primeira etapa: barra Markdown | Parcial |
| Dashboards | Homepage personalizável | Parcial |

Nenhum código-fonte dos plugins Make.md e cMenu foi copiado. Créditos e licenças: THIRD_PARTY_NOTICES.md.

## Verificações antes do lançamento

Executar npm run build, npm run check e npm test. Testar seleção de texto, teclado virtual, menus de arquivos, renomear/excluir, cofres grandes, persistência de opções, reload de plugin, telas de 720p e Android. Verificar a convivência com Make.md, cMenu, Obsidian Bases e Folder Notes.

**Limite conhecido:** banco relacional, Spaces, fórmulas, rollups e Flow Editor do Make.md não estão presentes. Guarde backup do cofre e não remova o Make.md supondo equivalência.

Última versão estável anterior: 8.3.0.
## Calendário Studio · v9

O calendário do Basic foi redesenhado com base nos fluxos do Full Calendar original e do Remastered: visões **mês, semana, 3 dias, dia e agenda de 30 dias**, células compactas, horários e painel lateral interno recolhível com mini-calendário, categorias e próximos eventos. O editor possui local, descrição, cor, intervalo de repetição, data-limite, dias da semana, exclusões e edição/exclusão de uma ocorrência ou da série. Os eventos continuam sendo arquivos Markdown; nenhuma nova barra lateral do Obsidian foi criada.

**Limite:** apenas eventos Markdown locais. Não há ICS remoto, login Google Calendar ou sincronização CalDAV. As duas versões de Full Calendar foram referências de comportamento, sem cópia de código.

