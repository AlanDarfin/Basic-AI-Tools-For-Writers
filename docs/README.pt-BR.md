# Basic

**Um espaço de escrita modular para o Obsidian.**

**Versão:** 12.0.2 · **Requer:** Obsidian 1.11.4+ · **Computador e Android** · **Licença:** MIT

[Read in English](../README.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md) · [Segurança](../SECURITY.md)

Escreva, planeje, revise e organize livros sem transferir seu trabalho para um banco de dados separado. O plugin reúne Longform, ferramentas de criação de mundos, homepage personalizável, edição Markdown, revisão linguística e IA opcional. Suas notas, pastas, links e propriedades continuam dentro do cofre do Obsidian.




## Funcionalidades

### Spaces, toolbar e ações móveis

- **Spaces com pasta-raiz:** ao selecionar `Trabalho/Escrita/Fireverse`, Fireverse aparece como raiz visual do explorador, sem exibir as pastas ancestrais. Nada é movido no cofre.
- **Ocultar apenas neste Space:** menu contextual para ocultar e reexibir notas e pastas somente na Space ativa. As coleções respeitam a ocultação, e as renomeações atualizam os caminhos.
- **Toolbar independente:** PC e celular possuem botões, menus, cores, tamanhos e estilos separados. Seguir o cursor só exibe a toolbar ao selecionar texto no editor.
- **Dragger:** alça não desaparece quando o mouse atravessa o espaço entre o texto e o quadrado no computador; o recurso continua desativado no Android.
- **Configurações sem abas novas:** recursos novos integrados às categorias antigas, sem grupos adicionais Toolkit ou Suítes.
- **Ações rápidas próprias do Basic:** um único botão no ribbon abre leitura em voz alta, paleta com 65 formatações, tela de foco, foco em pastas e central de integrações. Os atalhos não dependem dos botões do Ultimate Toolkit externo.
- **Correções no painel lateral:** o item **Mais opções** só encaminha o comando nativo depois que o menu anterior foi fechado no Android. **Marcador** prioriza um comando disponível do Bookmarks, com alternativa para o botão nativo. Os comandos para fixar, fechar e fechar outros painéis continuam.
- **Configurações reorganizadas:** ferramentas, suítes, privacidade e integrações ficam junto às funções relacionadas nas abas existentes.
- **Dados preservados:** nenhum arquivo, layout, Space ou ajuste anterior é apagado pela reorganização.

**Inventário completo e limites de cada plugin:** [Guia das suítes e integrações](SUITES_AND_INTEGRATIONS.pt-BR.md) · [English guide](SUITES_AND_INTEGRATIONS.en.md).

### v12 · Toolkit unificado e integrações externas

A versão 12 expande o espaço de escrita sem duplicar os motores de IA, TTS, explorador, Longform ou sincronização.

- **Escrita inspirada no Ultimate Toolkit:** paleta pesquisável com 65 ações de formatação, callouts e inserções; reaproveitamento da IA e voz do Basic; leitura contextual opcional de texto selecionado em documentos; seis modelos locais; foco temporário em pastas do explorador.
- **Imagens inspiradas no Visual Kit:** visualizador, normalização de largura com confirmação e editor local para anotar imagens com caneta, setas, retângulos, texto e cobertura de regiões. O resultado é um **novo PNG**, preservando a imagem original. Edição HTML completa, cópia/colagem rica e deduplicação binária permanecem externas.
- **Organização inspirada no Snailkit:** Workbench de tarefas agrupadas pela primeira etiqueta, filtros, marcar/desmarcar com verificação de conflitos, Inbox, brainstorm e extração segura de trechos para notas vinculadas. Busca, Spaces e homepage reutilizam os módulos atuais.
- **Notas criptografadas opcionais:** novos arquivos em `Basic Secure/` usam AES-256-GCM com PBKDF2-SHA256 e senha não armazenada pelo Basic. A opção começa **desligada**. Não criptografa pastas, oculta nomes ou recupera senhas esquecidas.
- **Central de integrações:** detecta Ultimate Toolkit, Visual Kit, Snailkit, dropit, os dois projetos Syncthing, Obsidian Git e FIT quando ativados separadamente, com acesso aos comandos disponíveis.
- **Sincronização:** seleção de um provedor externo para execução **manual** de comandos e inspeção somente leitura de cópias de conflito. Não há novo motor Git/Syncthing, sincronização automática, pareamento dropit ou mescla automática de conflitos.

**Compatibilidade:** Visual Kit original é exclusivo de PC. O anotador próprio do Basic é separado e precisa de testes no Android. A leitura de PDFs depende da camada de texto selecionável e das vozes do dispositivo. Os motores de criptografia de pastas, índice protegido e transporte remoto dos projetos originais não foram copiados.

Veja a [matriz de funcionalidades](V12_SCOPE.pt-BR.md) e as [notas da versão](RELEASE_V12.md).

No Android, o Dragger de blocos é desativado automaticamente e não exibe alças nem captura gestos de toque.

### Painéis laterais e largura do editor

- **Gerenciador lateral (opcional):** abas superiores integradas ao drawer nativo do Android, com indicação ativa preservada ao alternar painéis; menu unificado de ações com ícones Lucide, suporte à ordenação nativa e seletor recolhível de Spaces sempre acima das abas móveis (mostra a Space ativa e expande para selecionar outras ou Todo o cofre). A atualização do layout não destrói a barra de abas nem fecha seus menus. Configurações próprias para PC e celular, sem mover painéis nativos.
- **Largura do editor:** controle de 20–100% na barra de status do PC e ajuste também nas configurações para Android. Um clique na porcentagem restaura o valor padrão.
- **Largura individual de cada nota:** defina `editor-width: 75` no YAML. A propriedade tem prioridade; alterações pelo controle são temporárias e nunca reescrevem a nota.
- **Compatibilidade:** o gerenciador permanece opcional, restaura o seletor nativo quando desligado e não altera arquivos nem layouts salvos dos Spaces. O menu oferece acesso ao cofre quando o Obsidian fornece um seletor utilizável; caso contrário, preserva o rodapé original.

Exemplo:

```yaml
---
title: Capítulo 1
editor-width: 75
---
```



### Painéis no celular (11.1.1)

Na barra lateral do Basic, **segure o dedo sobre o ícone de um painel por aproximadamente 550 ms** para abrir o menu **Fixar/Desafixar painel**, **Fechar painel** e **Fechar outros não fixados**. Fixar mantém o painel entre os primeiros ícones, protegendo-o do fechamento em lote, mas não substitui a função nativa de fixar a gaveta do Obsidian. Arrastar o dedo para rolar cancela o gesto; tocar normalmente continua alternando abas. Os menus nativos aninhados agora são abertos somente após o fechamento do primeiro menu, evitando o efeito de abrir e fechar instantaneamente.

Essas ações não apagam notas. O gesto pode ser desligado nas configurações de Painéis laterais. Consulte as [notas da 11.1.1](V11_1_1_MOBILE_LONGFORM.pt-BR.md) para limites e testes reais pendentes.

### Number Suite e construtor de bancos (11.1)

A integração do **Number Suite** ganhou **numeração visual opcional dos títulos no Live Preview** por decorações do CodeMirror, sem modificar os títulos originais. No modo de leitura, há contadores independentes para parágrafos iniciados por `Figure:`, `Table:`, `Equation:` e `Code:`. O comando **Numeração: estrutura, figuras e notas de rodapé** abre um sumário navegável de títulos, legendas e definições de notas de rodapé/fim. Os novos contadores começam desativados para manter a compatibilidade.

O comando **Bancos: construtor visual de visualização** cria blocos `basic-suite-db` usando campos, sem exigir escrita manual de opções. Os layouts são tabela, quadro, galeria, lista, calendário, linha do tempo e gráfico. Há opções de colunas, agrupamento, ordenação, filtros simples e limites. Selecione um bloco completo no editor antes de abrir o construtor para modificá-lo; caso contrário, um bloco novo é inserido após confirmação. **O construtor não cria pastas nem altera registros automaticamente.**

Confira o [escopo da 11.1](V11_1_INTEGRATIONS_SCOPE.pt-BR.md), incluindo limitações de paridade e testes visuais pendentes no Android.

### Escrita contínua no Longform (11.1.1)

Em **Longform → Escrita → Escrita contínua**, os capítulos são exibidos no mesmo painel de projetos, sem um widget independente na Homepage. A escrita contínua mostra os capítulos de um livro em sequência, permitindo expandir e editar cada arquivo Markdown original sem mesclar ou mover notas. O salvamento é explícito, cria snapshot local quando ativado e recusa alterações concorrentes para evitar sobrescrever o trabalho de outro editor.

- **Revisão editorial:** comparação linha a linha com snapshots existentes e comentários editoriais locais por capítulo.
- **Pesquisa universal:** busca limitada por nome, propriedades e conteúdo, com escopos de livro, Space e cofre, trechos encontrados e abertura da nota original.
- **Montagem do manuscrito:** prévia antes da criação explícita de um novo arquivo Markdown em `Basic Exports/`, sem modificar os capítulos.
- **Central de compatibilidade:** mostra estados dos módulos, falhas de inicialização e possíveis sobreposições entre plugins, sem enviar dados do cofre à rede.
- **Homepage e biblioteca:** o widget Meus livros permanece; o widget Longform Studio foi removido. A biblioteca leva diretamente à aba Escrita contínua no Longform padrão.
- **Bancos Markdown:** mover cartões do quadro entre colunas existentes por arraste ou seletor acessível; edição tipada de propriedades (texto, número, data, checkbox e tags), com snapshot e verificação de conflitos.

As interfaces usam editores separados por capítulo, não um único editor CodeMirror sincronizado. A exportação direta de EPUB/PDF/DOCX, a sincronização remota e a paridade integral com os plugins originais continuam fora deste módulo. Confira o [escopo detalhado da v11](V11_SCOPE.pt-BR.md).

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

### Rotina acadêmica, bancos avançados e numeração

- **Central acadêmica (inspirada no Unique Suite):** criar notas de aulas, abrir o diário do dia, registrar lembretes com data e manter um horário de aulas em Markdown. Acesse pela paleta de comandos **Estudos: abrir central acadêmica**. Pastas configuráveis, sem criação automática de arquivos ao ativar. Calendário e assinaturas ICS continuam usando as funções existentes do Basic.
- **Bancos avançados (inspirados no Notion Suite):** visualizações de tabela, quadro, lista, galeria, calendário, linha do tempo e gráfico de barras. Cada linha continua sendo uma nota Markdown. Pesquisa, filtro, fórmulas simples e rollups aproveitam o mecanismo atual. A criação de notas acontece apenas ao usar **Nova nota**. O bloco `basic-suite-db` não entra em conflito com `notion-db` do plugin independente.
- **Numeração de documentos (inspirada no Number Suite):** títulos H1–H6 numerados visualmente no **Modo de Leitura**, sumário navegável e comandos com prévia para gravar/remover números reconhecidos. Toda alteração exige confirmação e comparação exata do conteúdo antes da gravação. Também oferece destaque para legendas `Figure:`, `Table:`, `Equation:` e `Code:`. A numeração completa de legendas, referências e Live Preview ainda não foi integrada.

Exemplo de banco de dados:

~~~basic-suite-db
folder: Databases/Tarefas
view: gallery
columns: file, status, due
cover: banner
group: status
sort: modified
order: desc
~~~

O campo `view` aceita `table`, `board`, `gallery`, `list`, `calendar`, `timeline` ou `chart`. O menu `/` do Flow oferece um modelo para inserir.

Exemplo de horário com dados da nota local `Estudos/Horário.md`:

~~~basic-timetable
file: Estudos/Horário.md
title: Minhas aulas
~~~

Para desativar a numeração em uma nota específica, use a propriedade `basic-numbering: false`. Exibir números virtuais não muda o Markdown; gravá-los pode alterar destinos de links para títulos.

Confira [o escopo real das integrações](V10_11_SUITES_SCOPE.pt-BR.md) para saber o que já funciona e quais recursos avançados ainda não têm paridade.

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
4. Ative **Basic** em **Configurações → Plugins da comunidade**.
5. Nas configurações do plugin, escolha os módulos, serviços, integrações e widgets desejados.

**Atualização:** um commit enviado para o branch `main` não atualiza automaticamente a cópia instalada. O atualizador precisa de uma Release numerada que contenha os três arquivos. Para instalar manualmente, substitua os três arquivos juntos e recarregue o Obsidian.

## Dados e privacidade

Projetos, notas, favoritos, informações de estudo e a maior parte da homepage trabalham com o cofre e com as configurações locais. IA externa, tradução online, LanguageTool remoto, rádios do YouTube e TTS online precisam de conexão quando utilizados. Ative o envio de conteúdo das suas notas apenas se concordar com o tratamento de dados do serviço. Rascunhos temporários não salvos não são arquivos persistentes.

Para detalhes sobre licenças e integrações, consulte [Créditos de terceiros](../THIRD_PARTY_NOTICES.md), [Contribuição](../CONTRIBUTING.md) e [Segurança](../SECURITY.md).

Os blocos de chat fictício também têm áudio simulado (`[audio:0:15]`), Markdown multilinha e estilos opcionais (veja [exemplos de blocos](BLOCKS.pt-BR.md)).
