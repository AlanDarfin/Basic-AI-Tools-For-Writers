# Auditoria de integrações — Basic 10.7.0

Revisão de 05/11/2026. Este documento acompanha o código, os testes e a release e não confunde **integração funcional** com **paridade integral**. As funcionalidades usam arquivos Markdown do Obsidian, com limites explícitos, e não copiam código de terceiros.

## Novidades implementadas nesta versão

| Plugin/referência | Implementação da 10.7.0 | Como utilizar | Limites |
| --- | --- | --- | --- |
| **Make.md: databases, relações e rollups** | Blocos `writer-database`/`basic-database`, filtro literal, ordenação, visualizações tabela e board, agrupamento de cartões, fórmulas matemáticas sem `eval`, rollups `count/sum/avg/min/max` lendo links de outras notas, edição de propriedades por célula com snapshot quando disponível, exportação CSV | Paleta: *Make.md: inserir banco de dados*; configurar propriedades `columns`, `formula`, `rollup`, `view`, `group` | Não implementa toda a linguagem de banco de dados, fórmulas relacionais complexas nem arraste entre registros |
| **Zotero Web API** | Consultas HTTPS **somente leitura** à API Zotero v3 para bibliotecas pessoais/grupos; importação de metadados como notas novas; melhor suporte a citações Better BibTeX existentes; exportação CSL JSON | Configure ID numérico, tipo de biblioteca, ative a integração, execute *Zotero: importar biblioteca via API*. Chave opcional por sessão | Não é OAuth nem sincronização bidirecional; não altera itens remotos e não baixa PDFs/anotações nativas. Bibliotecas privadas pedem uma chave que não é gravada |
| **Full Calendar / Calendários externos** | Até 5 assinaturas iCalendar via URL HTTPS; importação somente de novos eventos com deduplicação por UID; atualização periódica opcional e **desativada por padrão** | Configurações > assinaturas HTTPS; *Calendário: atualizar assinaturas HTTPS* | Não é OAuth, CalDAV bidirecional ou sincronização de edições de volta ao servidor; URLs de assinatura podem conter segredos e ficam nas configurações locais do cofre |
| **Spaced Repetition / FSRS / Anki** | Agendador **FSRS-4.5** com dificuldade, estabilidade e retenção configurável, mantendo SM-2 como padrão compatível; importação/exportação TSV de cartões compatível com importação de texto no Anki | Configurações > Estudos > algoritmo FSRS-4.5; comandos importar/exportar TSV | Não lê `.apkg`, não conecta ao AnkiWeb e não otimiza pesos pelo histórico pessoal |
| **StoryLine / Storyteller** | Mapa gráfico de notas marcadas como personagem/local/cena/item, usando relações YAML e links; nós arrastáveis e posições persistentes; criação de relações com snapshots | Comando *StoryLine: abrir mapa de relações* | Não faz inferência semântica de texto livre; os limites de nós evitam travamento em cofres grandes |
| **Enhancement Suite** | Busca e substituição literal entre notas, prévia de arquivos/ocorrências, confirmação e snapshots; verificação YAML no editor sem mover o cursor; edição hierárquica simples de JSON selecionado com validação | Paleta: buscar/substituir; JSON: editar seleção em árvore | Não substitui um IDE YAML completo; não executa expressões de substituição nem código arbitrário |
| **Dragger** | Mover blocos para outra nota com confirmação, snapshots e gravação do destino **antes** de remover a origem. Colunas Markdown responsivas pelo bloco `writer-columns` | Comando *Dragger: mover bloco para outra nota* / *Make.md: inserir colunas Markdown* | Arrastar fisicamente entre janelas e reorganização visual de colunas por gesto não estão incluídos |
| **Media Gallery / PDF** | Modal de prévia navegável por página usando visualizador PDF nativo do dispositivo, com limite configurável e fallback para abrir PDF no Obsidian | Paleta: *PDF: prévia por páginas* ou abra PDF pela Media Gallery | Em certas WebViews PDF em iframe é indisponível; ainda não gera miniaturas rasterizadas independentes |
| **TTS e LanguageTool** | Vozes locais (quando o sistema expõe `speechSynthesis`), seleção de voz/idioma/velocidade, pausa/continuação/parar, leitura de seleção/nota e reforço da proteção de rolagem durante popup LanguageTool | Comandos TTS e seleção de voz | Android pode não oferecer vozes locais no WebView; continue com TTS remoto opcional se necessário; testes de interface real ainda necessários |

## Proteções e compatibilidade

- Nenhuma chave privada do Zotero é gravada; integração Zotero desativada por padrão.
- A assinatura ICS é opt-in, HTTPS e de **leitura**; atualização automática desativada por padrão, preservando edições locais em vez de sobrescrevê-las.
- Busca e substituição em lote só ocorrem após prévia + confirmação; uma edição concorrente interrompe a operação antes de sobrescrever.
- Fórmulas de banco de dados são aritméticas e **não executam JS**. Links e propriedades são resolvidos por APIs do cofre.
- Operações de arrastar entre notas preservam a origem quando o destino não consegue ser salvo. Em falha concorrente após a gravação, deixam cópia, em vez de perda de texto.
- Reutiliza a homepage 10.6 e a barra de formatação em leitura corrigida em 10.6.1.
- A documentação da v1 à v10.6 está em [V10_6_HISTORICAL_AUDIT.pt-BR.md](V10_6_HISTORICAL_AUDIT.pt-BR.md).

## Pendências não resolvidas com paridade total

1. **Make.md / Custom Sorting / Flow:** fórmulas semânticas complexas, joins arbitrários, bancos totalmente relacionais e a gramática completa do custom sorting.
2. **Zotero:** OAuth oficial, sincronização bidirecional, edição remota, baixar arquivos PDF do usuário, extrair anotações nativas de PDF e compilação CSL com estilo escolhido dentro do plugin.
3. **Google/Outlook/CalDAV:** login OAuth, atualização/remarcação bidirecional e resolução de conflitos de agenda.
4. **Anki:** leitura/escrita de `.apkg`, sincronização AnkiWeb, pesos FSRS personalizados por otimização.
5. **Media Gallery:** criação de PNGs de miniaturas PDF multipágina com motor PDF.js integrado no bundle, além da visualização nativa por página.
6. **StoryLine:** análise semântica de enredo e editor gráfico de relações entre cenas com regras e gatilhos complexos.
7. **Dragger:** transferência por gesto entre janelas, notas e colunas, com undo atômico entre arquivos.
8. **TTS / LanguageTool:** consistência de motores de voz e scroll/popups nos variados Android WebViews, Linux e temas; precisa ser validada no dispositivo real.

As pendências acima exigem autenticação, permissões, processamento externo, novas dependências grandes ou testes gráficos de execução. Não devem ser apresentadas como já implementadas.

## Testes de aceitação recomendados

- Desktop e Android: abrir um banco com 100–500 notas, alternar tabela/board e testar cálculo de rollups e edição segura de propriedades.
- Importar uma biblioteca Zotero pública e uma privada com chave temporária; conferir que os caminhos das notas não sobrescrevem arquivos.
- Adicionar feed ICS de teste e atualizar duas vezes, verificando que eventos antigos não duplicam.
- Revisar cartões FSRS com datas variadas e exportar/reimportar TSV no Anki.
- Abrir mapa do compêndio, arrastar nós e verificar relações YAML; mover um bloco entre duas notas de teste.
- Testar PDF no Android: usar fallback quando iframe não renderizar; ler seleção com voz local e usar o LanguageTool sem pular o scroll.

**Resultado:** a 10.7.0 amplia a cobertura de todas as famílias de pendências da auditoria anterior, mas não afirma paridade completa ou sincronização bidirecional onde não há implementação efetiva.
