# Histórico de atualizações do basic

As notas por versão ficam aqui; o README descreve apenas funções.

## 10.9.0 — Biblioteca e interface

- Livros de nota única, leitura automática, descrição e copyright.
- Busca fuzzy, comandos organizados, novo nome e navegação com fade.


## Versão 10.8.0 — interface organizada e integrações recuperadas

- **Ribbon:** removido o menu de atalhos rápidos e os botões duplicados de Spaces e Biblioteca Longform; os comandos continuam na paleta e Spaces permanece no rodapé do explorador.
- **Notas relacionadas:** somente painel lateral, com cartões que não se sobrepõem, títulos claros, caminho encurtado e botão separado de link. Widget da homepage removido.
- **Lixeira:** somente widget da homepage: atualizar, restaurar, excluir com confirmação, expandir e esvaziar com confirmação. Painéis antigos restaurados são fechados.
- **Meus livros:** corrigida a renderização ausente e a lista de widgets permitidos. O widget mostra até quatro livros com capas, progresso e acesso à biblioteca. Passa a ser visível após migração.
- **Biblioteca:** cartões responsivos, campos com rótulos e estrela preenchida quando favoritada, usando o mesmo ícone configurado para favoritos no explorador.
- **Funções 10.7 recuperadas:** nove módulos avançados voltaram ao bundle: bancos Make.md, Zotero via API, ICS, FSRS, StoryLine, edição JSON/YAML, TTS local e Dragger entre notas. Inicialização separada e protegida, com modo de compatibilidade para desativar o grupo sem perder preferências.
- Mantida a correção de ativação `setIcon` da 10.7.3; novas conexões externas são opcionais. [Relatório completo](V10_8_UI_REVIEW.pt-BR.md).
- Visual e gestos ainda precisam de verificação no Obsidian real, especialmente no Android.

## Versão 10.7.3 — correção de ativação (`setIcon`)

- **Causa comprovada pelo console do Obsidian:** `ReferenceError: setIcon is not defined` durante `writerV106DragRegister`, na integração de arrastar blocos.
- O Dragger passa a obter `setIcon` da API do Obsidian, com ícone textual alternativo caso a API não esteja disponível.
- Corrigidas outras cinco chamadas a `setIcon` sem importação no painel de notas relacionadas e no explorador da lixeira.
- Registro dos módulos opcionais de interface agora é isolado: um erro nesses recursos não impede todo o Basic de iniciar.
- Adicionados testes **executáveis** de criação dos ícones com API simulada, fallback e continuidade de comandos mesmo quando extensões opcionais falham.
- Notas, `data.json`, Longform, homepage, LanguageTool, toolbar e funções anteriores foram preservados. Os nove recursos experimentais da 10.7 continuam fora do `main.js` desta versão, conforme a 10.7.2.
- Substitua os três arquivos `main.js`, `manifest.json` e `styles.css` da mesma release e reinicie o Obsidian. **Não apague `data.json`.**

## Versão 10.7.2 — recuperação emergencial do carregamento

- **Ativação prioritária:** o `main.js` volta a distribuir somente os módulos do conjunto anterior à 10.7, incluindo homepage, Longform, LanguageTool, barra de leitura, Dragger anterior, biblioteca, explorador, notas relacionadas e widgets.
- **Código preservado:** os nove arquivos experimentais da 10.7 (novos bancos, Zotero via API, FSRS, ICS remoto, grafo StoryLine, editor avançado, voz local e transferência entre notas) continuam no GitHub, mas **não são carregados nesta release** para evitar travamentos antes do `onload`.
- Nenhuma preferência do usuário, nota, senha ou `data.json` é apagado ou migrado.
- A suíte de regressão verifica a presença de todos os módulos anteriores e a ausência das integrações experimentais no bundle distribuído.
- O funcionamento no Obsidian Android/PC ainda precisa de confirmação. [Procedimento de recuperação e diagnóstico](V10_7_2_STABLE_RECOVERY.pt-BR.md).

## Versão 10.7.1 — recuperação de ativação

- **Correção crítica:** os módulos antigos do Basic terminam a inicialização antes das integrações adicionais 10.7; erros opcionais não podem interromper o carregamento do plugin inteiro.
- **Funções preservadas:** inspeção do bundle confirmou que as integrações antigas, incluindo Longform, homepage, LanguageTool, toolbar, calendário, estudos e ferramentas de escrita, não foram excluídas.
- **Instalação parcial:** verificações de existência impedem que integrações ausentes em arquivos desencontrados provoquem falha de referência durante o início.
- **Modo de compatibilidade:** desligue **Ativar integrações experimentais 10.7** nas configurações e reinicie para manter apenas o conjunto anterior de funções. Nenhuma preferência é apagada.
- Novos testes verificam erros de registro, módulos ausentes, cancelamento de tarefas atrasadas e preservação do código legado.
- [Leia o relatório de recuperação](V10_7_1_ACTIVATION_RECOVERY.pt-BR.md). Substitua sempre `main.js`, `manifest.json` e `styles.css` juntos. O erro exato no dispositivo ainda precisa ser confirmado pelo console do Obsidian.

## Versão 10.7.0 — integrações avançadas

- **Make.md:** bancos de notas Markdown em tabela/board, filtros, ordenação, fórmulas seguras e rollups de relações; edição por célula e CSV.
- **Zotero:** API Web v3 opcional e somente leitura, importação de referências, chave temporária por consulta e exportação CSL JSON.
- **Calendário:** assinaturas ICS HTTPS com importação sem sobrescrita, deduplicação e atualização periódica opcional.
- **Estudos:** agendamento FSRS-4.5 ou SM-2 anterior, com importação/exportação TSV compatível com Anki.
- **StoryLine:** grafo visual arrastável de relações do compêndio e inclusão de relações entre notas.
- **Enhancement Suite:** busca/substituição em lote com prévia, confirmação e snapshots; diagnóstico YAML no editor; edição JSON em árvore.
- **Dragger, mídia e TTS:** mover blocos entre notas com segurança, colunas responsivas, prévia de PDF por páginas e vozes locais do sistema; guarda de scroll do LanguageTool.
- [Relatório de integração e pendências](V10_7_INTEGRATIONS_AUDIT.pt-BR.md). Não há autenticação OAuth, sincronização CalDAV bidirecional, geração de thumbnails PDF independentes nem leitura de `.apkg`.

## Versão 10.6.1 — barra de formatação no modo leitura

- A barra de formatação do Basic desaparece automaticamente no **modo de leitura**, no PC e no celular.
- Ela volta ao alternar para modo de edição ou Live Preview, preservando botões, posição e personalização.
- A mudança de modo é detectada sem precisar fechar/reabrir a nota; os observadores são desativados ao descarregar o plugin.

## Versão 10.6.0 — homepage limpa, Dragger e revisão histórica

- **Sessão limpa:** ao iniciar o Obsidian, a homepage pode abrir sozinha, fechando apenas abas principais restauradas. Ligado por padrão; preserva notas, painéis laterais e configurações. Nunca apaga abas no recarregamento/atualização do plugin. Há comando de limpeza manual com confirmação.
- **Arrastar blocos, inspirado no Dragger:** mover parágrafos, títulos, listas com filhos, tarefas, citações, tabelas e blocos de código; seleção múltipla, recuo, linha indicadora, toque longo no Android, ícone/tamanho/cor personalizáveis, comandos de teclado e menu de tipos. Evita conflito com Dragger original ativo.
- **Dicionário da v1:** assistente opcional localiza nota Markdown do antigo Alan's Offline Dictionary sem copiar chaves de API nem alterar arquivos antigos.
- **Enhancement Suite:** comando para explorar JSON selecionado em uma árvore expandível somente leitura.
- **Auditoria:** [funções conferidas desde a v1](V10_6_HISTORICAL_AUDIT.pt-BR.md), distinguindo implementações, integrações parciais e pendências ainda reais.
- Os gestos e a aparência do Dragger no Android/PC dependem de validação prática no Obsidian.

## Versão 10.5.0 — pesquisa, recuperação e leitura

- Notas relacionadas por análise local: painel lateral, widget, índice limitado e inserção rápida de links Markdown.
- Explorador da lixeira interna do Obsidian: restauração sem sobrescrever, exclusão com confirmação e widget.
- Novos widgets: notas relacionadas, lixeira, estatísticas de leitura e fontes importadas do Zotero.
- Mais citações clássicas de filósofos e escritores, preservando listas personalizadas.
- Zotero: extração melhorada de autores/destaques importados e seletor de citações com citekey Better BibTeX (`[@chave]`) ou link da nota.
- Barra de progresso do Enhancement Suite corrigida nos modos edição e leitura, com cor e espessura configuráveis.
- Ainda não há sincronização direta do Zotero nem acesso à lixeira do sistema.

## Atualização 10.4.10 — Resultados de pesquisa reorganizados no Android

- A pesquisa deixou de renderizar os resultados como botões padrão do Obsidian, que recebiam estilos conflitantes e separavam os ícones do texto. Agora usa linhas próprias, compactas e compatíveis com temas e snippets CSS.
- Opções repetidas, como **Subscrito**, aparecem uma única vez, com acessos independentes a **Barra de formatação** e **Extended Syntax**, por toque/clique ou teclado.
- Removidas as regras de CSS duplicadas e conflitantes das versões anteriores. A lista continua rolável, sem alterar as configurações existentes, a Toolbar ou a sintaxe de alinhamento.

## Atualização 10.4.9 — Pesquisa, campos compactos e justificar com {j}

- **Resultados da pesquisa:** linhas em largura total, ícones discretos e identificação da aba, sem os botões escuros estreitos. A área de resultados passa a ocupar menos altura no Android.
- **Configurações da Toolbar:** campos de estilo, tamanho, posição e cores foram refeitos em linhas compactas, sem os grandes espaços vazios. Todas as funcionalidades anteriores continuam.
- **Justificar:** agora é `Texto {j}` ou `## Título {j}`, como `{l}`, `{c}` e `{r}`. O mesmo mecanismo funciona no Live Preview, na leitura, na barra de formatação e nos comandos, inclusive para títulos Markdown; não insere mais um `<div>`.

## Atualização 10.4.8 — Barra de formatação avançada e pesquisa de opções

- **Toolbar:** além dos botões Markdown anteriores, há recuo, retirar recuo, alinhamentos esquerda/centro/direita e justificado, cor do texto e cor de destaque. No celular a barra continua opcional e não substitui a barra nativa do Obsidian.
- **Personalização inspirada no Editing Toolbar:** escolha comandos da paleta (inclusive de plugins instalados), altere nome e ícone Lucide de cada botão, crie grupos com submenus e reordene com arraste ou setas. Há estilos Mínima, Compacta e Confortável, nomes nos botões, ajuste de tamanho e cores.
- **Posição:** embaixo, em cima ou acompanhar o cursor no PC (no celular, o último modo usa a posição inferior).
- **Pesquisa de configurações:** busca por opção específica, não apenas pelo nome da aba. Inclui as configurações visíveis, outras abas já visitadas e os botões de formatação mesmo com a lista recolhida. O termo `subescrito` encontra `Subscrito`; tocar no resultado abre a seção e destaca o controle.
- **Visual das configurações:** campo de busca mais discreto, resultados compactos, abas com rolagem horizontal e campos adaptados para telas estreitas.

## Atualização 10.4.7 — Explorador compacto no celular

- **Linhas compactas:** as setas de ordenação manual deixam de aparecer em todas as pastas e notas durante a navegação normal. Mantidos ícones personalizados, favoritos, folder notes, descrições e prévias.
- **Reorganizar somente quando necessário:** no botão nativo **Ordenar** do Obsidian, use **Reorganizar itens no celular (Basic)**, ou execute **Explorador: ativar ou desativar reorganização móvel** na paleta de comandos. Esse modo temporário mostra setas menores, sobrepostas às linhas, sem aumentar sua altura. Desative-o da mesma forma; ao recarregar o plugin ele começa desligado.
- **Sem alterar arquivos:** sair do modo apenas esconde os controles, mantendo caminhos, arquivos, favoritos e a ordem manual salva. CSS compatível com o lint de plugins do Obsidian.

## Atualização 10.4.6 — LanguageTool compacto e rolagem estável

- **Sugestões do LanguageTool:** menu de correção mais compacto e rolável no PC, com ícones menores, linhas mais próximas e popup flutuante reduzido, mantendo áreas de toque adequadas no celular.
- **Máquina de Escrever e Remember Cursor:** ambos suspendem o acompanhamento quando um popup ou menu de sugestão está aberto, sob o mouse ou sendo clicado. Interações com o ponteiro não recentralizam a nota; digitação, composição de texto e teclas de navegação reativam o comportamento.
- **Posição de leitura preservada:** aceitar uma correção com o mouse mantém temporariamente a rolagem visível, mesmo quando o cursor permanece em outra linha. Restaurações pendentes são canceladas, mas as posições salvas não são apagadas.
- **Compatibilidade:** preservadas correções, atalhos e revisão automática, com testes de regressão específicos.

## Atualização 10.4.5 — timeline e menu de IA corrigidos

- **Menu de contexto:** organiza os comandos quando o menu abre, depois que os demais módulos registram seus itens. Traduzir, Significado, Sinônimos, Antônimos e Reescrever passam a aparecer dentro de **IA · Ferramentas**, nos grupos Consulta/Tradução e Escrita/Revisão, com ícones Lucide distintos e sem duplicação na raiz.
- **Timeline:** recupera as diferenças visuais originais entre `line-2` e `line-5` e entre `body-2` e `body-4` (marcadores vazados, sólidos, tracejados e em losango; cartões lisos, com bandeira ou faixa colorida). Inclui as onze cores `active-color-*` originais e `spaced-lines` / `hide-titles`.
- **Temas:** Minimal ficou aberto, sem cartões e com espaço de leitura; Compact usa linhas densas, data e título lado a lado. Classic, Cards e Editorial continuam; Poster, Glass e Terminal são novos. A barra da timeline permite alterar tema, linha e cartão visualmente sem modificar o Markdown.
- **Compatibilidade:** preservados fotos, eventos, orientação horizontal/vertical, filtros, busca, links e sintaxes anteriores; adicionados testes de regressão.

## Atualização 10.4.4 — Menus, atalhos por tecla dupla e homepage

- **Menu de contexto:** ferramentas de IA agrupadas em submenus de consulta/tradução e escrita/revisão quando o Obsidian permite; formatação extra e alinhamento do Basic dentro do menu **Formatar** nativo. Ações nativas ou de outros plugins não são removidas caso não possam ser agrupadas com segurança.
- **Teclas pressionadas duas vezes:** novo gerenciador expansível com várias teclas, escolha pesquisável do comando, contexto de execução, ativação individual e remoção. O antigo duplo Shift é migrado automaticamente. Letras, números, Tab e Espaço não disparam atalhos durante a digitação.
- **Homepage:** no computador, a caixa de pesquisa recebe o foco ao abrir a homepage (sem roubar o foco a cada atualização). Abrir uma nota pela pesquisa, recentes ou widgets substitui a homepage na mesma aba; o celular não ativa o teclado automaticamente.

## Atualização 10.4.3 — Ordenação da raiz e botão nativo

- **Raiz do cofre:** os caminhos `/` e vazio passam a identificar a mesma pasta. A ordem manual usa a listagem nativa do Obsidian quando disponível, evitando uma segunda ordenação CSS conflitante.
- **Um único botão:** selecione o tipo de ordem no botão **Alterar ordem de classificação** que já aparece no topo do explorador. Além das opções originais, o Basic acrescenta ordem manual, número no título, propriedade YAML e pastas primeiro. A escolha vale para **todas as pastas**, inclusive a raiz.
- **Menu de contexto limpo:** foram retirados `Ordenação desta pasta`, `Mover para cima` e `Mover para baixo` do menu dos arquivos. Ícones, favoritos, ocultação e outras funções continuam disponíveis. As setas integradas aos itens no celular permanecem no modo manual.
- **Atalhos dos Spaces:** os botões de ordenação apontam para o controle nativo. A ordem manual previamente salva em cada pasta continua armazenada.

## Atualização 10.4.2 — Ordenação segura, Spaces, biblioteca e atalhos

- **Ordenação manual:** mover notas para cima/baixo não remove nem reinsere elementos nativos da árvore do explorador, evitando o desaparecimento visual após a atualização. A ordem é apresentada via CSS e o estilo original é restaurado ao descarregar o plugin.
- **Spaces no celular:** abas com rolagem horizontal independente, lista de notas com rolagem vertical e novos botões para criar Space, abrir biblioteca e ordenar pasta da nota atual.
- **Biblioteca Longform:** seleção de ordenação na janela, cartões em coluna única em telas estreitas, controles de status/progresso/estante mais legíveis e atalho na barra lateral.
- **Áudios fictícios:** ondas com alturas e animações variadas a cada renderização, sem gravar nem tocar áudio.
- **Atalhos:** comandos na paleta para alternar Spaces, fixar nota atual, ordenar a pasta e abrir um menu de ações rápidas do Basic.
- **CSS pessoal:** novo snippet opcional `Basic-Compat-Unificado-v2.css`, mantendo os estilos anteriores e adaptando subtítulo, títulos, Spaces e biblioteca.

## Atualização 10.4.1 — Alinhamento de títulos e texto

- Agora o alinhamento funciona em **títulos Markdown (H1–H6)** e parágrafos sem eliminar `#` e seus níveis. Basta acrescentar `# Capítulo {c}`, `## Subtítulo {r}` ou `Texto {l}`. O marcador desaparece no modo de leitura e pode ser ocultado no Live Preview fora da linha ativa.
- Os comandos Esquerda, Centro e Direita continuam disponíveis, com um novo **Alternar alinhamento da linha ou título**. Configure um atalho no PC ou adicione o comando à barra móvel do Obsidian para não precisar digitar marcadores.
- As sintaxes antigas `::c: texto` e `::c[texto]` continuam reconhecidas; usar um comando converte o formato para o novo.
- Títulos com alinhamento explícito prevalecem sobre snippets que centralizam todos os cabeçalhos, sem alterar outros títulos.

## Atualização 10.4.0 — Explorador, Spaces e áudio

- **Explorador:** a ordenação personalizada passa a integrar a listagem nativa quando disponível, com fallback para outras versões; a ocultação global agora inclui arquivos dentro das pastas ocultas.
- **Ordenação manual:** arraste itens de uma mesma pasta no modo personalizado; exigir Alt é opcional, e o local de soltar tem indicação visual. As setas do celular continuam disponíveis.
- **Spaces:** selecionar uma Space a ativa; seleção manual pode seguir a ordem das notas incluídas, e a busca lista até 5.000 notas com paginação. É possível adicionar a nota atual pelo menu.
- **Chat:** ícone de play/pause centralizado no círculo do áudio fictício.
- **Revisão e leitura:** controle de espessura e cor da barra de progresso de leitura.

## Atualização 10.3.0 — Explorador, Spaces e alinhamento

- **Alinhamento:** use `::l: texto`, `::c: texto` ou `::r: texto` em uma linha separada. A sintaxe anterior com colchetes continua aceita.
- **Explorador:** botões maiores no PC, sem popups redundantes sobre descrições ou ícones.
- **Spaces:** acesso pela ribbon no celular; removida a ocultação exclusiva por Space, sem alterar a ocultação global do explorador.
- **Ordenação:** comandos para ativar a ordenação manual, redefinir a ordem e alternar o arraste.
- **Leitura:** indicador opcional de progresso no modo de leitura.

## Spaces mobile, propriedades, chat e imagens · 10.2.0

**Spaces:** cartões responsivos, títulos alinhados à esquerda, caminhos sem transbordamento, alternância entre modos de exibição e paginação.

**Pretty Properties:** menu ⋯ em cada propriedade nativa para ocultar apenas nesta nota ou em todas, definir um ícone personalizado e revelar os campos sem apagar os valores YAML.

**Chat fictício:** transcrição escrita pelo autor em estilo compacto do WhatsApp, cor independente por balão e fundo transparente. Não grava nem transcreve áudios reais.

**Prévia de notas:** imagem de banner/capa/thumbnail, embeds locais e links HTTPS explícitos, com chave para desativar o acesso remoto.

**Buscador de imagens:** Wikimedia Commons sem chave e Pexels/Pixabay/Unsplash com as chaves pessoais diretamente nos serviços, sem proxy externo. Insira uma URL ou baixe a imagem para o cofre; também é possível alterar o campo banner.

**Alinhamento de texto:** sintaxe ::l[texto], ::c[texto], ::r[texto], sem codeblock, com negrito e itálico no interior, sem conflitar com barras ou tabelas.

[Guia da 10.2](V10_2_MEDIA_AND_EDITOR.pt-BR.md) · [Sintaxes Markdown](BLOCKS.pt-BR.md)

## Fluxos de escrita ampliados · 10.1.0

Esta atualização amplia a base da v10 **sem reescrever projetos, migrar notas de forma destrutiva ou retirar sintaxes antigas**. Configurações e novos recursos usam textos PT/EN; operações que alteram muitos arquivos ou reorganizam painéis são opcionais.

- **Longform:** rolagem e foco de capítulos preservados, alça para arrastar no PC e toque prolongado para escolher destino no celular.
- **Biblioteca:** progresso de leitura manual (0–100%), estado planejado/lendo/pausado/concluído, estantes e gêneros, favoritos, filtros, ordenação por série/progresso e paginação. Progresso não é inferido pelo número de capítulos.
- **Spaces/Workspace:** checkpoints versionados por Space, restauração, importar/exportar JSON, limite de histórico e preservação do layout anterior ao substituir. A restauração pode reorganizar abas.
- **Flow/Explorador:** modo grafo e dependências entre notas com \`after:[[Nota]]\`, profundidade limitada para ciclos, sorting-spec com novos padrões e ordenação decrescente por números/propriedades.
- **Gallery:** paginação, seleção múltipla, cópia de links internos, previews leves de documentos, prévias de vídeo e abertura nativa de PDF/documentos. Não há renderização completa de páginas PDF nem edição DOCX.
- **Arquivos/Enhancement Suite:** mais extensões de texto, número de linha/coluna, Tab com espaços, validação YAML, filtro visual de tabelas, CSV protegido, notas de rodapé e edição de frontmatter em lote com confirmação e snapshots.
- **DoubleShift:** usar o mesmo Shift, esquerdo, direito ou qualquer um; filtros de contexto e exclusão de janelas. Continua inicialmente desativado.
- **Timeline:** eras, dependências, ordenação e paginação de eventos.
- **LanguageTool:** palavras aceitas por livro, adição nos menus de sugestão e posição de popup mais contida.
- **Homepage:** presets nomeados de widgets, reorganização com setas do teclado e widget de livros.
- **Calendário:** importar e exportar arquivos locais \`.ics\` de forma offline, com confirmação e identificação de duplicatas. **Não é sincronização online com Google Calendar.**
- **Estudos/Pomodoro:** agendamento de revisões ajustável, previsão e último baralho lembrado; histórico de foco, gráfico semanal, relatórios por tarefa e CSV.
- **Cursor e áudio:** tentativas adicionais de rolagem no Android que param com interação do usuário; TTS nativo em trechos e foco de áudio com Soundscapes opcional. A disponibilidade da voz depende do WebView.
- **Markdown:** ampliação de edição e utilitários, preservando as ferramentas Pandoc, Keyshots, variantes, máquina de escrever e sintaxes antigas.

Consulte a [revisão de funções e compatibilidade da 10.1](V10_1_ALL_FOLLOWUPS.pt-BR.md) e o [guia de blocos atuais e legados](BLOCKS.pt-BR.md). As ações novas estão nas abas existentes e na paleta de comandos.

## Versão 10.0.0 — consolidação sem reescrita

- **Áudio do chat fictício:** se houver uma transcrição escrita, ela aparece automaticamente abaixo da animação, sem botão de mostrar/ocultar. Não há reconhecimento de voz.
- **Biblioteca Longform:** capas e índices de livros existentes, widget compacto **Meus livros** e bloco Markdown bookshelf. A contagem de capítulos não é progresso de leitura.
- **Spaces:** salvar e restaurar layouts de painéis por Space opcionalmente; salvamento e restauração automáticos são independentes e começam desligados. Mantidos filtros, ícones, ordenação, widgets e dock por Space.
- **Gallery:** adiciona **Documentos** às categorias imagens, vídeos, áudio e PDF. DOCX/EPUB são encaminhados ao visualizador do aplicativo; não são arquivos de texto editáveis.
- **Editor de texto:** salvamento explícito, detecção de conflitos e limite de 512 KiB para formatos de texto e código suportados; não edita binários.
- **Ferramentas de escrita:** duplo Shift opcional para abrir a paleta, ordenar linhas de tabelas Markdown, formatar JSON selecionado e inserir callouts.
- **Configurações:** organizadas em Geral, Personalização, Fluxo de trabalho, IA e dicionário, Longform, Escrita e Markdown e Revisão e leitura.

Veja a [auditoria de cada integração](V10_REVIEW.pt-BR.md), o [guia de blocos atuais e legados](BLOCKS.pt-BR.md) e a [documentação em inglês](../README.md). São integrações próprias inspiradas em outros plugins, e não promessa de equivalência integral.

