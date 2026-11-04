# Basic AI Tool for Writers

**Um espaço de escrita modular para o Obsidian.**

**Versão:** 10.4.8 · **Requer:** Obsidian 1.11.4+ · **Computador e Android** · **Licença:** MIT

[Read in English](../README.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md) · [Segurança](../SECURITY.md)

Escreva, planeje, revise e organize livros sem transferir seu trabalho para um banco de dados separado. O plugin reúne Longform, ferramentas de criação de mundos, homepage personalizável, edição Markdown, revisão linguística e IA opcional. Suas notas, pastas, links e propriedades continuam dentro do cofre do Obsidian.



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

## Funcionalidades

### Livros, capítulos e planejamento de histórias

- **Projetos Longform:** organize livros, capítulos, subcapítulos aninhados, notas, capas, descrições e propriedades. Reordene cenas por arrastar e soltar ou por comandos acessíveis.
- **Visualizações de cenas:** planeje em listas, cartões e quadros Kanban. Acompanhe tramas, pontos da história, conexões, tarefas, metas e comentários.
- **Navegação de livro:** avance ou volte entre capítulos e subcapítulos usando BookNav, cadeias manuais de notas ou navegação automática via Conteúdo Virtual.
- **Ferramentas de projeto:** estrutura narrativa, modelos de cena, metadados, séries, sessões de escrita, organização e compilação de manuscritos.

### Construção de mundos e notas conectadas

- **Compêndio:** personagens, locais, itens e categorias personalizadas em arquivos Markdown comuns, com relações, tags, imagens locais e campos próprios.
- **Linha do tempo:** eventos, marcos, trilhas narrativas e ramificações; calendário fictício configurável.
- **Folder Notes:** abra a nota associada a uma pasta pelo Explorador nativo e mostre visões dinâmicas de seu conteúdo, com cartões e links.
- **Smart Spaces:** coleções virtuais de notas baseadas em pastas, tags e propriedades, exibidas como listas, quadros ou tabelas.
- **Conteúdo virtual (Virtual Content):** exiba modelos Markdown em cabeçalhos, rodapés, seções de leitura ou painéis laterais sem modificar as notas. Crie regras por pastas, tags e frontmatter.

### Homepage de escrita personalizável

A homepage reúne título, ícone, cores de destaque e busca fuzzy pelo cofre. Ela pode aparecer ao abrir uma nova aba vazia (preferência `homeOnNewTab`), com opção para desativar esse comportamento. Links externos podem abrir no **Web Viewer** nativo do PC ou no navegador do celular.

Widgets disponíveis: **relógio e calendário**, **rádio Soundscapes** (computador), **continuar escrevendo**, **notas recentes**, **favoritos**, **rascunhos rápidos**, **resumo do cofre**, **atividade semanal**, **nota aleatória**, **tags**, **meta de palavras**, **galeria de fotos**, **citações** e **visão do dia**.

- **Aproveitamento do espaço:** grade responsiva do tipo Masonry que mede as alturas e posiciona widgets pequenos ao lado de outros maiores.
- **Tamanhos:** escolha **Compacto**, **Normal** ou **Largo** nas opções de cada widget. O modo largo ocupa duas colunas no PC; no celular tudo fica em uma coluna.
- **Reorganização:** arraste pela alça no computador; em telas de toque, selecione uma alça e depois o cabeçalho de outro widget. O menu também oferece movimentos para antes/depois.
- **Personalização local:** adicione, oculte ou reorganize os widgets; a ordem, os tamanhos, a visibilidade e os rascunhos são salvos nas configurações.

### Edição e formatação Markdown e navegação

- **Keyshots:** atalhos de navegação e edição pelo teclado.
- **Easy Typing e Smart Typography:** auxílio automático para digitação, espaçamento, símbolos e tipografia.
- **Máquina de escrever:** foco no texto e destaque de linha.
- **Remember Cursor:** preservação e recuperação da posição do cursor.
- **Variantes e snapshots:** compare versões de trechos antes de substituí-los e salve versões locais das notas.
- **Autocomplete:** sugestões de palavras do cofre, com controles de indexação nas configurações.
- **Modelos pelo nome da nota:** aplique modelos ao criar ou renomear arquivos conforme regras configuráveis.
- **Unicode, abreviações e Insta TOC:** encontre símbolos, expanda atalhos e navegue pelos títulos.
- **Extended Syntax e Pandoc:** sintaxes adicionais, inserção inteligente e exportação opcional no PC.

### Revisão de escrita e IA opcional

- **LanguageTool:** ortografia, gramática, análise por parágrafo, correções contextuais, dicionário pessoal e integração opcional com o plugin LanguageTool independente.
- **Modos de revisão:** análise de gramática, estilo e trechos inteiros, com explicações e sugestões opcionais de IA.
- **Dicionário e tradução:** definições, sinônimos, antônimos, explicações contextuais e tradução de seleções ou arquivos Markdown. Motores de tradução e detecção do idioma de origem são configuráveis.
- **Assistente:** chat com contexto opcional da nota ou seleção, anexos, prompts editáveis e configuração de modelos.
- **IA inline (baseada no Inscribe):** continuação opcional diretamente no cursor, prévia antes de aceitar, prompts personalizados e perfis por pasta.
- **Provedores:** integração configurável com OpenAI, Gemini, Groq, Claude, Ollama, OpenRouter e endpoints personalizados compatíveis. As chaves são fornecidas pelo usuário; as funções básicas não exigem IA.

A interface acompanha o idioma **português ou inglês** do Obsidian (inglês como padrão). Acesso à internet, chamadas de IA e serviços externos dependem de cada módulo e de sua configuração.

### Calendário, estudos e sessões

- **Calendário de escrita (inspirado no Full Calendar):** criação e edição de eventos, navegação por datas, visualização própria ou na barra lateral e gerenciamento de agendas compatíveis com Markdown.
- **Repetição espaçada:** baralhos de estudo e revisões a partir de notas locais, inclusive conteúdo marcado com `#flashcards`.
- **Sessões temporárias:** escreva em rascunhos mantidos na memória e salve explicitamente em uma nota quando necessário. Rascunhos não salvos desaparecem ao fechar o Obsidian.
- **Tarefas e metas:** tarefas de projetos, indicadores de progresso e métricas de escrita.


**Exemplo de painel Flow** (cada linha aponta para uma nota Markdown existente no cofre):

```flow
layout: cards
[[Capítulo 1]]
[[Capítulo 2]]
```

### Explorador nativo e aparência

- **Ícones no estilo Iconic:** escolha ícones Lucide e cores para notas, pastas, favoritos e homepage.
- **Notas favoritas:** estrelas no Explorador nativo compartilham favoritos com o widget da homepage.
- **Prévias no Explorador:** descrições, trechos de texto, imagens de capa e miniaturas da primeira imagem incorporada; opção para mostrar e ocultar.
- **Flexplorer:** fixe ou oculte itens, organize pastas, defina ordem personalizada e aplique padrões glob para visibilidade, sem excluir os arquivos.
- **Interface compacta:** abas roláveis, menus consistentes e módulos que podem ser ligados e desligados para aproveitar telas menores.

**Prévias no explorador:** Folder Notes exibem apenas a propriedade de descrição configurada no YAML, nunca o início do texto da nota. O limite de linhas só vale para notas comuns. Descrições longas podem ser expandidas mantendo o mouse sobre o texto por 1,5 segundo ou pressionando por mais tempo no Android; o tempo de toque é configurável. A expansão por mouse, o trecho das notas e a descrição das pastas podem ser desativados separadamente.

### Áudio e acessibilidade

- **Soundscapes (PC):** rádios e playlists do YouTube agora **começam a tocar em segundo plano** ao clicar em Play, sem abrir popup ou aba. O mini player de vídeo aparece **somente** ao clicar no botão de exibi-lo ou usar o comando correspondente. É possível recolher sem interromper a rádio ou usar **Parar** para descarregá-la. O widget da Homepage permanece visível durante Play e Stop; no celular ele fica na grade normalmente, mas apresenta um aviso de indisponibilidade por limitações do Obsidian mobile. O mini player tenta utilizar Webview do Chromium e, quando indisponível, recorre a um iframe visível do YouTube. O volume das rádios agora pode ser ajustado pelo slider da Homepage, da barra de status ou do próprio mini player, assim como o áudio local. A configuração é reaplicada ao carregar o vídeo ou trocar de estação. Algumas transmissões podem bloquear incorporação (erro 153). **Minha Música** continua usando o player local, com controles próprios.
- **Alinhamento dos ícones no título:** ícones personalizados do explorador e do YAML agora acompanham a primeira linha do título, sem posição absoluta que os desloque para cima no Android. A cor segue a do título. Também corrige a remoção dos ícones ao recarregar o plugin e evita duplicação quando há ícones de ambas as fontes.
- **Prévias:** o botão de mostrar/ocultar prévias usa a mesma cor neutra dos demais controles. As descrições de Folder Notes mostram no máximo três linhas, com `...` **apenas quando há texto oculto**; segure para expandir. Notas comuns mantêm seu limite de linhas configurável.
- **Pomodoro:** cronômetro local inspirado em [Pomodoro Timer](https://github.com/eatgrass/obsidian-pomodoro-timer), com ciclos de foco, pausas curta/longa, painel lateral interativo (PC e Android), contador diário, atalhos na paleta e status bar **somente no PC**. Configurações em **Escrita e Markdown → Pomodoro · Foco** para durações, aviso, som, avanço automático e painel/status. O registro em notas diárias é opcional e só adiciona uma linha a um arquivo `AAAA-MM-DD.md` já existente; não cria nem apaga notas. O rastreamento avançado de tarefas do plugin original ainda não foi reproduzido.
- **Prévias e ícones:** descrições de Folder Notes, trechos iniciais das notas, miniaturas compactas à direita e expansão do texto por mouse ou toque prolongado no Android. A duração do toque é configurável. Ícones decorativos do título foram alinhados e mantidos fora do cursor de edição. Ícones dos controles do explorador são maiores no celular.
- **Spaces independentes:** coleções por pasta, tag ou propriedade; seus próprios arquivos ocultos/fixados, ordenação por pasta, visualização em lista/cartões/quadro/tabela e configurações dos widgets da homepage (visibilidade, tamanho, ordem). A barra de Spaces permite mudar, criar, renomear, configurar, trocar ícone e cor, reorganizar ou remover coleções sem apagar notas. Há um botão próprio de gerenciamento no explorador. Em **Personalização → Coleções locais**, desligue separadamente a barra, o ícone ou o painel lateral.
- **Flexplorer + Custom Sorting:** ordenação por nome, datas, números, propriedade YAML, pastas primeiro ou ordem manual por nomes e padrões `*`/`?`, com regras por pasta e por Space. Suporta `basic_sort`, `basic_sort_field`, `basic_sort_order` e `basic_folders_first` na Folder Note. Se a leitura de YAML estiver ativada, entende também **um subconjunto** de `sorting-spec` (A–Z/Z–A, números, metadados, pastas primeiro e padrões manuais); a gramática avançada do Custom Sorting não está incluída. Alt + arrastar no PC e setas no celular reordenam pastas no modo personalizado. Cada parte pode ser desligada.
- **Pretty Properties:** capas, banners, ícones, campo oculto, tags e propriedades coloridas, datas, prazos, progresso e modelos seguros, agora com controles separados para ativar ou desativar partes.
- **Flow:** menu rápido com `/`, notas incorporadas editáveis com proteção contra mudanças concorrentes e compositor de cartões Markdown. O bloco `flow` oferece layouts cartões/lista/quadro, adicionar/remover links, reorganizar por arrastar e pelos botões mobile e salva somente a lista dentro do bloco. Notas originais não são apagadas. Recursos Flow, prévias e ordenação são opcionais.
- **Próxima versão principal (v10):** reestruturação das configurações e navegação entre módulos, com busca, organização PT/EN, controles de ativação e migração de preferências. [Plano das configurações para a v10](V10_SETTINGS_PLAN.md).
- **Image Captions:** legendas opcionais de imagens a partir do texto alternativo do Markdown, sem reescrever arquivos.
- **Click Clack (PC):** sons de digitação com catálogo dos **13 pacotes originais** (Cherry MX, IBM, Olympia, Quill e outros), disponíveis para download individual ou em lote nas configurações. Pacotes instalados funcionam offline e nenhum áudio é baixado automaticamente.
- **Leitura em voz alta (TTS):** vozes do sistema, quando disponíveis, ou vozes online com autorização, com idioma, velocidade, tom e seleção de voz. A leitura online envia texto ao serviço escolhido apenas quando ativada.
- **Teclado e toque:** visualizações com botões, menus e alternativas acessíveis ao arrastar e soltar.


**Overview de pastas (9.2.14):** itens com apenas o ícone e o nome, seis visualizações (cartões, lista aninhada, compacto, grade de ícones, tabela e quadro), ordenação por nome, data, tamanho ou tipo e busca. No Android, a seta expande/recolhe subpastas e o nome abre a pasta. Resumos opcionais ignoram metadados técnicos de Folder Notes.

**Exemplos completos de todos os blocos Markdown:** [Guia em português](BLOCKS.pt-BR.md) · [English block guide](BLOCKS.en.md).


### Timelines em blocos e comportamento das propriedades

- **Filtro de propriedades:** a pesquisa opcional foi movida para dentro da lista de propriedades recolhível do Obsidian; o filtro desaparece ao fechar Propriedades tanto na Prévia ao vivo quanto na leitura, preservando o texto ao atualizar o painel.
- **Timelines Markdown:** aceitam os formatos originais `timeline` (três linhas iniciadas por `+`) e `timeline-labeled` (`date/title/content`), além de `layout: horizontal|vertical`, temas (`classic`, `cards`, `minimal`, `compact`, `editorial`), fotos locais, ícones, cores, links, grupos, busca e troca de orientação.
- **Longform independente:** a cronologia de projetos e seus eventos, ramificações, Gantt e calendário fictício permanecem intactos. O bloco tem um módulo separado em Configurações → Módulos → Timelines em Markdown.
- **Exemplos prontos:** [Português](BLOCKS.pt-BR.md) · [English](BLOCKS.en.md). O bloco não exige rede nem o plugin Timeline externo.

## Blocos Markdown

O plugin reconhece blocos de código independentes. Os nomes curtos abaixo são os recomendados; os nomes antigos `writer-tabs`, `writer-wiki`, `writer-avatar`, `writer-post`, `writer-chat`, `writer-folder-overview` e `writer-media-gallery` continuam aceitos por compatibilidade.

| Bloco | Função |
| --- | --- |
| `tabs` | Abas roláveis com conteúdo Markdown |
| `avatar` / `wiki` | Cartões de personagens e fichas de mundo |
| `post` / `chat` | Posts fictícios, respostas encadeadas e balões de conversa |
| `media-gallery` | Galeria de mídias locais do cofre |
| `folder-overview` | Listagem dinâmica de arquivos de uma pasta |
| `columns` | Layout de leitura em várias colunas |
| `progressbar` | Barras de progresso manuais ou por data |
| `widgets` | Relógio, citação, contagem regressiva e contador |
| `meta-field` | Visualização ou edição controlada de uma propriedade YAML |
| `insta-toc` / `longform-nav` | Sumário e navegação por capítulos |
| `timeline` / `timeline-labeled` | Cronologias com temas, fotos e visualização horizontal ou vertical |

Exemplo de ficha de mundo e nota com abas:

~~~~markdown
~~~wiki
title: Arquivo do Norte
type: Local
image: [[Imagens/arquivo.webp]]
region: Terras Altas
---
Uma biblioteca antiga, cheia de histórias.
~~~

~~~tabs
=== Sinopse
Um resumo da cena.

=== Notas
- [[Personagem Um]]
- [[Personagem Dois]]
~~~
~~~~

**9.5.1 · Separadores e foto do grupo no chat:** em blocos `chat`, coloque `---` entre as mensagens para uma divisão simples ou `--- Duas horas depois ---` para centralizar uma legenda. Defina `group-image: [[Imagens/grupo.webp]]` junto de `title:` para mostrar a foto do grupo ao lado do título. Avatares individuais e áudios falsos permanecem iguais. Veja os [exemplos completos](BLOCKS.pt-BR.md).

**10.0.0 · Transcrições de áudios fictícios:** o formato `[áudio:0:15:Estou chegando agora.]` aceita uma transcrição escrita pelo autor, exibida por um botão **Ver transcrição**, sem tocar ou gravar áudio real. Os áudios sem transcrição continuam funcionando normalmente. O texto aparece dentro da mensagem fictícia. Veja o [guia de blocos](BLOCKS.pt-BR.md).

**Sintaxe de chat fictício:** em um bloco `chat`, use `[Left=Maria, right=João]` para definir os participantes. Para cores e avatares, use `[Maria=blue]`. Abas também aceitam títulos como `=== Maria`. Essas formas são visuais e locais, sem conexão com aplicativos de mensagens.

Os blocos complementam o Markdown, sem substituir integralmente outros plugins ou serviços. A disponibilidade depende dos módulos ativados e do modo de visualização.

## Instalação e configuração

1. Instale o **Obsidian 1.11.4 ou superior**.
2. Baixe a [Release mais recente no GitHub](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases). Use os arquivos `main.js`, `manifest.json` e `styles.css` da Release, não apenas o ZIP do código-fonte.
3. Coloque os três arquivos em `.obsidian/plugins/basic-ai-tool-for-writers/` no seu cofre.
4. Ative **Basic AI Tool for Writers** em **Configurações → Plugins da comunidade**.
5. Nas configurações do plugin, escolha os módulos, serviços, integrações e widgets desejados.

**Atualização:** um commit enviado para o branch `main` não atualiza automaticamente a cópia instalada. O atualizador precisa de uma Release numerada que contenha os três arquivos. Para instalar manualmente, substitua os três arquivos juntos e recarregue o Obsidian.

## Dados e privacidade

Projetos, notas, favoritos, informações de estudo e a maior parte da homepage trabalham com o cofre e com as configurações locais. IA externa, tradução online, LanguageTool remoto, rádios do YouTube e TTS online precisam de conexão quando utilizados. Ative o envio de conteúdo das suas notas apenas se concordar com o tratamento de dados do serviço. Rascunhos temporários não salvos não são arquivos persistentes.

Para detalhes sobre licenças e integrações, consulte [Créditos de terceiros](../THIRD_PARTY_NOTICES.md), [Contribuição](../CONTRIBUTING.md) e [Segurança](../SECURITY.md).

Os blocos de chat fictício também têm áudio simulado (`[audio:0:15]`), Markdown multilinha e estilos opcionais (veja [exemplos de blocos](BLOCKS.pt-BR.md)).
