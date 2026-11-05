# Basic 10.8.0 — revisão da interface, widgets e restauração de integrações

Atualização de 05/11/2026, motivada por capturas do Obsidian após a recuperação do erro `setIcon`.

## Ajustes de interface

| Área | Alteração | Comportamento |
| --- | --- | --- |
| Ribbon | Removido botão de atalhos rápidos do Basic, além dos botões redundantes da biblioteca e de Spaces | Gerenciar Spaces, ordenar explorador, mostrar arquivos escondidos, centralizar e abrir biblioteca continuam na paleta de comandos; o gestor de Spaces continua no rodapé do explorador |
| Notas relacionadas | **Somente painel lateral**, sem widget de homepage | Cartões com título legível, caminho truncado sem sobrepor linhas, pontuação de similaridade e botão separado para inserir link |
| Lixeira | **Somente widget da homepage**, sem comando para criar painel | Listar, atualizar, expandir, restaurar e excluir com confirmação; o painel antigo restaurado por workspaces anteriores é fechado com segurança |
| Meus livros | Widget da homepage finalmente conectado à função de renderização | Até quatro livros, priorizando favoritos, mostrando capa e progresso; botão **Ver biblioteca** |
| Biblioteca Longform | Cartões responsivos, filtros organizados e campos rotulados; melhor uso da largura do modal | Título com quebra correta, capas, barra de leitura, estado/progresso/estante com rótulos; favoritos persistentes |
| Estrela dos livros | Ícone configurado para favoritos do explorador | Sem preenchimento quando não favoritado, **preenchido por completo** ao favoritar, acessível com `aria-pressed` e cor do tema |

A lista de widgets salvos passa a aceitar `trash`, `reading`, `zotero` e `books`. O antigo `related` é removido do catálogo e das preferências; o painel relacionado continua funcionando. Uma migração única torna o widget de livros visível quando era ocultado pelo padrão da versão com bug, sem apagar a organização do usuário.

## Recursos avançados reintroduzidos

Os nove módulos que foram removidos do bundle de distribuição na emergência 10.7.2 permaneciam inteiros no GitHub. Eles voltam ao `main.js` na 10.8:

- Make.md: bancos Markdown, tabela/board, agrupamentos, fórmulas, rollups e CSV.
- Zotero: leitura da API Web, importação e exportação bibliográfica CSL JSON.
- Calendários: assinaturas ICS HTTPS opcionais, com importação não destrutiva.
- Estudos: FSRS-4.5 e TSV importável no Anki.
- StoryLine: grafo arrastável de relações do compêndio.
- Enhancement Suite: YAML, JSON em árvore e substituição entre notas com prévia.
- TTS: controles de voz local disponíveis pelo navegador/WebView.
- Dragger adicional: transferências confirmadas entre notas e colunas Markdown.
- Registro isolado das oito áreas avançadas.

**Proteção de ativação:** esses módulos são registrados **depois** do carregamento do núcleo e erros em cada módulo não desativam o Basic inteiro. A chave `v107AdvancedEnabled` pode desativar o grupo em caso de incompatibilidade após reiniciar, sem descartar configurações. O erro `setIcon is not defined` anteriormente identificado já foi corrigido na 10.7.3 e sua cobertura foi preservada.

**Rede:** a API Zotero e assinaturas ICS exigem ativação explícita. A chave Zotero é usada por consulta e não persistida; URLs ICS ficam nas configurações locais e a sincronização periódica fica desligada por padrão. Veja `SECURITY.md`.

## Validação e limites

- Testes de catálogo/migração de widgets, panel/widget exclusivos, layout, estrela, ícones e lista de módulos incluídos no build.
- Regressões históricas, verificações de sintaxe, CSS, inventário de rede e compilação automatizada.
- O CI **não reproduz visualmente** o Obsidian no Android ou em temas de terceiros. É preciso conferir a distribuição dos cartões, interações de toque, lixeira e integrações avançadas no aplicativo.
- Não há sincronização externa bidirecional, OAuth ou garantia de total paridade com os plugins de origem. A auditoria detalhada dos recursos 10.7 está em [V10_7_INTEGRATIONS_AUDIT.pt-BR.md](V10_7_INTEGRATIONS_AUDIT.pt-BR.md).

## Instalação

Instale `main.js`, `manifest.json` e `styles.css` da **mesma** release, preservando o `data.json` atual. Não é preciso apagar notas nem migrar os índices Longform. Reinicie o Obsidian para garantir que o menu antigo desapareça do ribbon.
