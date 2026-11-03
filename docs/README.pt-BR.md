# Basic AI Tool for Writers

**Versão:** 9.1.2 · **Requer:** Obsidian 1.11.4+ · **Computador e Android** · **Licença:** MIT

[Read in English](../README.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md)

Uma central compacta para escrever livros, organizar universos, editar Markdown, revisar textos e, opcionalmente, usar inteligência artificial. As notas continuam sendo arquivos normais do cofre do Obsidian.

## Funcionalidades

| Área | O que oferece |
| --- | --- |
| **Longform** | Livros, capítulos, subcapítulos e cenas; reordenação, quadros em cartões/lista/Kanban, compilação e séries de livros. |
| **Planejamento** | Tramas, marcos narrativos, ritmo, conexões entre cenas, metas, sessões de escrita, tarefas e comentários. |
| **Compêndio** | Fichas de personagens, locais, itens e categorias próprias, com notas Markdown, tags, herança de pastas, relações, imagens locais, mapas e galeria, notas de pasta ocultas no Explorador e Overview dinâmico. |
| **Linha do tempo** | Eventos, marcos, trilhas, ramificações e calendário fictício configurável. |
| **IA opcional** | Chat com contexto da seleção ou nota, definições, sinônimos, antônimos, tradução, prompts editáveis e escolha de modelos/provedores. |
| **IA inline** | Continuações de texto no cursor, inspiradas no Inscribe, com acionamento manual, sugestão fantasma, Tab para aceitar, prompt editável e perfis por pasta. Desativada por padrão; requisições automáticas são opcionais. |
| **Posts fictícios** | Publicações com reações em chamas, métricas e comentários encadeados para histórias. |\n| **Galeria** | Pesquisa e filtros de imagens, vídeos, áudio e PDFs locais, inspirados no Media Gallery View. |\n| **Legendas de imagens** | Descrições curtas extraídas do Markdown de imagens, sem alterar as notas. |\n| **Conversas fictícias** | Balões Markdown, alinhamento por personagem e fotos locais opcionais. |\n| **Homepage de escrita** | Busca, favoritos, rascunhos, arquivos recentes e atalhos do Longform. |\n| **Revisão** | LanguageTool com verificações por parágrafo, menus de sugestões, dicionário pessoal, integração opcional com o LanguageTool externo e revisão por IA. |
| **Ferramentas** | Autocompletar baseado no cofre, variantes, comparação antes da substituição, histórico local de notas, Unicode e abreviações. A indexação é administrada nas configurações. |
| **Editor** | Navegação inspirada no Keyshots, Easy Typing, Smart Typography, foco de máquina de escrever, lembrança do cursor e modelos por nome de nota. |
| **Formatação** | Markdown estendido, sintaxe inspirada no Pandoc, exportação com Pandoc no computador e blocos de abas, avatares e Wiki. |
| **Leitura de texto** | Vozes do sistema quando disponíveis ou TTS on-line opcional com consentimento. |
| **Soundscapes no PC** | Rádios de ambiente via YouTube, playlists personalizadas, músicas do cofre, player compacto na barra inferior e widget de homepage com seleção de rádio, prévia, controles e volume. |
| **Sons da máquina de escrever** | Sons de teclas no editor Markdown no estilo Click Clack, com volume, sons diferentes por tecla e esquemas WAV locais opcionais, somente no computador. |
| **Explorador Flexplorer** | Fixar e desafixar, ocultar e revelar itens, ordenar individualmente por pasta, reordenar com Alt + arrastar e usar padrões glob no explorador nativo. |
| **Conversas com IA** | Assistente com balões alinhados como os blocos de diálogo, anexos Markdown, respostas formatadas e configurações de provedores, modelos e prompts mais uniformes. |
| **Conteúdo virtual e BookNav** | Renderize modelos Markdown no cabeçalho, rodapé, seções (modo Leitura) ou lateral, usando regras por pasta, tag e propriedades. Navegue automaticamente entre capítulos Longform sem inserir blocos nas notas. |

A navegação por **Escrita / Universo / Projeto** foi pensada para painéis estreitos. Os módulos podem ser ativados separadamente, sem criar uma segunda base de dados para os livros.

### Áudio ambiente, teclas sonoras e explorador

**Soundscapes (PC):** Abra **Configurações → Personalização → Soundscapes** e escolha uma rádio como *Lofi beats*, *Ocean waves* ou *ChillSynth FM*. Reproduza e pause pela barra inferior ou adicione o widget **Rádio de escrita** na homepage em **Adicionar widgets**. Ambos compartilham a rádio, o estado da reprodução e o volume. O widget exibe o nome e uma imagem de prévia quando disponível. As rádios usam o YouTube e exigem internet.

**Rádios personalizadas:** Nas configurações de Soundscapes, crie uma playlist e insira uma faixa por linha, com título e URL do YouTube. Exemplo:

Rádio de foco | https://www.youtube.com/watch?v=jfKfPfyJRdk

Para tocar arquivos próprios, coloque áudios em uma pasta do cofre, como *Music*, configure **Pasta de músicas do cofre** para *Music* e escolha **Minha música**. A biblioteca reconhece MP3, WAV, OGG, M4A e FLAC, conforme o suporte do sistema de reprodução do desktop. A reprodução funciona apenas no computador e os arquivos locais não são enviados ao YouTube.

**Click Clack (PC):** Em **Configurações → Escrita e Markdown → Sons da máquina de escrever**, ative os efeitos e ajuste o volume. Os cliques integrados são gerados localmente, sem baixar pacotes. Caso tenha pacotes WAV compatíveis com o Click Clack na pasta *resources* do plugin, use a opção de recarregar para selecioná-los. Os efeitos são acionados apenas durante a digitação no editor Markdown.

**Flexplorer:** No menu de contexto de uma pasta do explorador nativo, selecione **Ordenação desta pasta** → **Ordem personalizada**. Use **Alt + arrastar** para reorganizar notas da mesma pasta, sem substituir o arrastar padrão do Obsidian. Os menus também oferecem **Fixar no explorador** e **Ocultar no explorador**. Em **Configurações → Personalização → Explorador de arquivos**, padrões como *Templates/*** apenas ocultam itens na interface, sem apagar arquivos; **Exibir itens ocultos** permite visualizá-los. Os ícones, cores e visões de pastas do Basic continuam disponíveis.

### Conteúdo virtual e BookNav automático

**Navegação automática.** Entre em **Configurações → Longform → Conteúdo virtual** e ative **BookNav automático em projetos Longform**. Capítulos e subcapítulos passam a mostrar os botões de anterior/próximo no modo Leitura e no Live Preview. A navegação segue a ordem das cenas do projeto, respeita as preferências individuais de navegação e não escreve nada no Markdown. Um bloco `longform-nav` já existente continua tendo prioridade. Para escolher uma pasta ou uma posição específica, desative o BookNav global e crie uma regra cuja fonte seja **BookNav automático (Longform)**.

**Modelos dinâmicos.** Crie uma regra nas mesmas configurações. Combine pasta, tag ou propriedade YAML por **E/OU**, inclua subpastas/subtags ou inverta uma condição. Escolha a posição (**Cabeçalho**, **Rodapé**, **Lateral** ou **Início/Fim de seção**) e digite Markdown ou selecione uma nota modelo do cofre. As opções de seção funcionam no modo Leitura; cabeçalhos e rodapés gerais também aparecem no Live Preview.

Exemplo: para notas na pasta `Personagens/`, crie uma condição por pasta e use este conteúdo:

```markdown
> [!info] Ficha de personagem
> Você está lendo **{{file.name}}**.
> Pasta: `{{file.folder}}`
```

Outro exemplo: escolha **BookNav automático** como fonte, **Rodapé** como posição e a pasta `Meu Livro/Capítulos` (incluindo subpastas). A navegação acompanha o índice Longform quando a nota pertence ao projeto. Reorganizar capítulos atualiza os botões sem inserir blocos nos arquivos. A navegação manual de notas avulsas continua disponível com `longform-nav`.

Use o comando **Conteúdo virtual: abrir na lateral** para visualizar as regras laterais. Cada regra pode ter sua própria aba dentro desse painel. Você pode ativar, editar, excluir e reordenar regras sem alterar as notas atingidas. Notas modelo também podem conter sintaxe de outros plugins, mas a renderização de Dataview ou Bases depende dessas integrações e do modo de visualização utilizado.

## Como usar a formatação Markdown

Ative **Configurações → Basic AI Tool for Writers → Módulos → Extended Syntax** e a opção **Abas, avatar e quadros Wiki**. Escreva a sintaxe em uma nota Markdown e visualize a renderização no modo de leitura ou na pré-visualização compatível.

### Formatação no meio do texto

| Digite | Resultado |
| --- | --- |
| `++sublinhado++` | Sublinha o texto |
| `||segredo||` | Spoiler revelado ao clicar ou tocar |
| `^sobrescrito^` e `~subscrito~` | Texto superior ou inferior |
| `=={yellow}importante==` | Destaque com cor do tema |
| `!!{destaque}texto!!` | Span com classe `writer-v5-class-destaque` |

Os destaques reconhecem cores predefinidas como `yellow`, `blue`, `green`, `red`, `purple` e `accent`. Cada opção pode ser ativada ou desativada.

### Abas dentro de uma nota

Use um bloco `writer-tabs`, separando cada aba por `=== Nome`. É possível ter até 12 abas, com Markdown no conteúdo.

~~~~markdown
~~~writer-tabs
=== Sinopse
Resumo da história com **Markdown**.

=== Personagens
- [[Maria]]
- [[João]]

=== Observações
Anotações sobre o capítulo.
~~~
~~~~

Os botões têm rolagem horizontal e navegação pelo teclado. O texto original da nota não é alterado.

### Avatar de personagem

A imagem deve estar no cofre e ser referenciada por um link do Obsidian.

~~~~markdown
~~~writer-avatar
name: Maria
role: Protagonista
image: [[Imagens/maria.webp]]
---
Uma personagem com **motivações próprias**.
~~~
~~~~

Se a imagem não existir, aparece a inicial do nome. O bloco não carrega imagens externas.

### Bloco estilo Wiki

O `writer-wiki` cria uma ficha com propriedades e uma descrição em Markdown após a linha `---`.

~~~~markdown
~~~writer-wiki
title: Porto das Cinzas
type: Local
image: [[Imagens/porto.webp]]
regiao: Costa norte
populacao: 1200
---
Cidade portuária famosa pelos arquivos históricos.

Relacionada a [[Maria]].
~~~
~~~~

São recursos de **apresentação**, não uma Wiki separada. Links, tags, propriedades e notas do cofre continuam funcionando normalmente.

### Folder Notes e Overview dinâmico

As notas de pasta aparecem por meio do botão de **livro aberto**, no extremo direito da linha da pasta no Explorador nativo. O arquivo da nota correspondente fica oculto apenas na árvore do Explorador (não é apagado). A seta continua expandindo o conteúdo da pasta. Configure em **Compêndio / Folder Notes**.

Para mostrar as notas e subpastas como cartões ou lista, insira o bloco `writer-folder-overview` em qualquer nota, ou use o comando **Pasta: inserir Overview**:

~~~~markdown
~~~writer-folder-overview
style: cards
subfolders: true
depth: 2
limit: 48
~~~
~~~~

Aceita `style: cards|list`, `folder: pasta/desejada`, `subfolders: true|false`, `depth: 0..3`, `noteOnly: true|false` e `briefMax: 32..220`. A sintaxe legada `ccard` não é substituída.

### Completar texto com IA

Ative em **Configurações → Extended Syntax → IA inline**. Execute **IA inline: sugerir continuação** para obter um texto discreto no cursor. Pressione **Tab** para inseri-lo ou **Esc** para descartá-lo. A geração automática é opcional e envia pequenos trechos ao provedor configurado quando ativada. É possível editar o prompt, o intervalo e regras como `Livros/|creative`, `Estudos/|formal` e `Privado/|off`. Utiliza o provedor/modelo do assistente e não copia o código do Inscribe.

### Abas e cartões de personagem editáveis

Antes da primeira aba, escreva `layout: side` para deixar as abas na lateral esquerda ou `layout: right` para a lateral direita. Sem esse campo, elas permanecem horizontais. Toque no conteúdo renderizado para editar o Markdown e use **Salvar** (ou Ctrl+Enter). **Cancelar** descarta as alterações. O botão **+** adiciona outra aba (até 12).

~~~~markdown
~~~writer-tabs
layout: side
=== Sinopse
Resumo do primeiro capítulo.

=== Personagens
- [[Maria]]
- [[João]]
~~~
~~~~

Para deixar a foto maior e a descrição ao lado, use `layout: left` ou `layout: right` em `writer-avatar`. A descrição também pode ser editada ao tocar nela:

~~~~markdown
~~~writer-avatar
name: Maria
role: Protagonista
image: [[Imagens/maria.webp]]
layout: left
---
**Descrição:** Exploradora determinada da região norte.
~~~
~~~~

Somente o bloco Markdown identificado é alterado ao salvar. Se o conteúdo tiver mudado por outro editor ou dispositivo, a gravação será recusada para não sobrescrever alterações recentes. Os links da descrição continuam abrindo normalmente.

### Posts fictícios com respostas encadeadas

O bloco `writer-post` simula uma publicação para histórias, **sem conexão com uma rede social real**. Curtidas são representadas por uma chama; comentários e visualizações são valores escritos no Markdown. Cada `=== reply` adiciona uma resposta, com `depth: 1..5` para a indentação estilo Reddit.

~~~~markdown
~~~writer-post
author: Maria
handle: @maria
avatar: [[Imagens/maria.webp]]
date: 2h
likes: 42
views: 1200
---
Uma carta misteriosa chegou ao porto hoje.

=== reply
author: João
handle: @joao
depth: 1
likes: 8
---
Ela tinha o selo antigo?

=== reply
author: Maria
depth: 2
likes: 3
---
Sim. **Era o mesmo selo**.
~~~
~~~~

O contador de comentários usa o número de respostas presentes no bloco; para simular outro valor, adicione `comments:`.

### Galeria de mídias do cofre

Inspirado no [Media Gallery View](https://github.com/RobertoJarquinRR/Media-Gallery-view), o bloco `writer-media-gallery` apresenta arquivos do próprio cofre, com filtro de imagens, vídeos, áudio e PDFs, pesquisa, layouts e pré-visualização de imagens/áudio/vídeo. PDFs são abertos pelo Obsidian.

~~~~markdown
~~~writer-media-gallery
path: Livro/Imagens
type: all
layout: grid
sort: name-asc
subfolders: true
limit: 90
~~~
~~~~

`path` é opcional (sem ele, usa a pasta da nota). Os tipos são `all`, `image`, `video`, `audio` e `pdf`; layouts `grid`, `masonry` (grade responsiva leve) e `ratio`. Não usa hospedagem externa nem cria miniaturas avançadas para PDF ou áudio. Há também o comando **Galeria: inserir bloco de mídias**. Trata-se de uma integração própria e simplificada, não uma cópia integral do outro plugin.

### Legendas breves para imagens (inspiradas no Image Captions)

Use a descrição da imagem no próprio Markdown do Obsidian: `![[Imagens/porto.webp|O porto ao amanhecer]]` ou `![O porto ao amanhecer](Imagens/porto.webp)`. A descrição aparece abaixo da imagem nas renderizações compatíveis do Modo de Leitura. `![[Imagens/porto.webp|%]]` usa o nome do arquivo como legenda.

As legendas não alteram o conteúdo original da nota e têm limite padrão de 180 caracteres (configurável em **Configurações → Geral**). Se o plugin independente **Image Captions** estiver ativo, o Basic AI não adiciona uma segunda legenda. Para recursos avançados de alinhamento e Live Preview, utilize o plugin dedicado.

### Chats fictícios — mensagens rápidas por personagem

O bloco `writer-chat` agora aceita uma sintaxe curta: **<** posiciona a mensagem à esquerda, **>** à direita, e **|** separa os campos. Você pode escrever:

- `< Avatar | Nome | Mensagem | Tempo` (foto local explícita)
- `< | Nome | Mensagem | Tempo` (sem foto)
- `< | Mensagem | Tempo` quando o nome já foi definido para aquele lado no início do bloco.

As configurações iniciais funcionam assim: `[Maria=blue, João=red]` define as cores, `[Maria=Imagens/maria.webp]` define a foto padrão e `[Left=Maria, right=João]` associa os nomes a cada lado.

~~~~markdown
~~~writer-chat
title: Conversa no porto
[Maria=blue, João=red]
[Maria=Imagens/maria.webp]
[Left=Maria, right=João]

< | Encontrou o mapa? ![[Imagens/mapa.png|240]] | 18:30
> | **Sim!** Estava escondido no livro. | 18:31
< Imagens/outra-foto.png | Maria | Veja também essa foto. | 18:32
> | João | Chego em cinco minutos. | 18:34
~~~
~~~~

Uma foto específica na mensagem substitui a imagem padrão do personagem. Se não houver nenhuma, **não aparece espaço vazio para avatar**. Cores aceitas: red, orange, yellow, green, blue, purple, pink, cyan, gray e accent (também grey), seguindo as variáveis do tema.

O conteúdo é renderizado em Markdown: imagens locais, links, **negrito**, *itálico*, listas e a sintaxe estendida do Basic AI, como `++sublinhado++`, `=={blue}destaque==` e `||spoiler||`, quando os módulos estiverem ativos. O separador `|` dentro de `![[imagem.png|240]]`, links Markdown ou código inline não divide a mensagem; para escrever um pipe literal, use `\|` quando necessário. Linhas adicionais continuam na mesma mensagem até o próximo marcador lateral.

**Compatibilidade:** a sintaxe anterior com `=== Maria`, `side: left`, propriedades e `---` continua funcionando nas notas existentes. Os chats são apenas representações fictícias locais, sem conexão com serviços externos.

### Calendário e planejamento de eventos (inspirado no Full Calendar Remastered)

Abra **Calendário: abrir agenda** na paleta de comandos ou use o atalho **Calendário** da homepage. Ao tocar em um dia no calendário pequeno da homepage, você abre essa data na agenda completa. O calendário local oferece visualização por **mês, semana ou dia**, navegação entre datas, criação e edição de eventos, exclusão com confirmação em duas etapas, horário, categoria e **repetições diária, semanal, mensal e anual**.

Cada evento é uma **nota Markdown real** na pasta `Writing Calendar/`, criada apenas após salvar o evento. O frontmatter usa `writerCalendar: true`, `title`, `startDate`, `startTime`, `endTime`, `repeat` e `category`. O corpo da nota continua editável normalmente no Obsidian.

~~~~markdown
---
writerCalendar: true
title: "Sessão de escrita"
startDate: "2026-11-05"
startTime: "15:00"
endTime: "16:00"
repeat: "weekly"
category: "Escrita"
---

Planejar o capítulo seis e revisar os personagens.
~~~~

Esta é uma integração **local e independente inspirada no [Full Calendar Remastered](https://github.com/obsidian-full-calendar-remastered/plugin-full-calendar)**, sem copiar a interface FullCalendar nem suas dependências GPL. Não sincroniza Google Calendar, CalDAV ou ICS remoto: para essas fontes, utilize o plugin especializado. Os eventos locais ficam dentro do cofre.

### Estudos personalizados e revisão espaçada

Abra **Estudos: revisar cartões** pela paleta ou o atalho **Estudos** na homepage. A área de Estudos procura notas identificadas com `#flashcards` (ou outra etiqueta definida em **Configurações → Geral → Estudos**) e organiza os cartões pela pasta de origem. Aceita `Pergunta::Resposta`, `Pergunta:::Resposta` (dois sentidos), `==lacuna==` simples em notas marcadas e `{{c1::lacuna}}`.

~~~~markdown
#flashcards

Qual a capital do Brasil?::Brasília
Vermelho:::Red
O idioma predominante do Brasil é ==português==.
Uma cidade histórica é {{c1::Ouro Preto}}.
~~~~

Durante a revisão, veja a pergunta, revele a resposta e escolha **De novo (10 min)**, **Difícil**, **Bom** ou **Fácil**. Um agendamento inspirado em SM-2 define a próxima revisão. Nas configurações, personalize a etiqueta, o máximo de cartões por sessão e quantos cartões novos serão apresentados.

O histórico é salvo **localmente nas configurações do plugin**, sem alterar o texto original. Ele não compartilha o agendamento com o [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition). Esta é uma implementação própria e focada, não uma cópia integral de todas as opções avançadas de cloze e revisão de notas do original.

### Pesquisa fuzzy na homepage

A busca do topo da homepage agora utiliza **fuzzy search**, com tolerância a acentos, prioridade para títulos e prefixos, correspondências em palavras, caminhos e títulos internos, pequenos erros de digitação e sequências aproximadas. Os resultados são ranqueados por relevância, sem envio do conteúdo do cofre pela internet. Endereços web continuam abrindo no navegador conforme as configurações da homepage.

### Homepage de escrita — relógio, calendário e pesquisa no topo

Abra **Início: abrir painel de escrita** pela paleta de comandos ou crie uma nova aba vazia no Obsidian. **Por padrão, cada nova aba vazia abre a homepage de escrita**. Você pode desativar isso em **Configurações → Basic AI Tool for Writers → Geral → Abrir homepage em toda nova aba vazia** (opção interna `homeOnNewTab`). Notas abertas, abas restauradas e painéis laterais não são substituídos. A opção separada de abrir uma homepage na inicialização do aplicativo continua disponível.

No topo, o **título e ícone personalizados** aparecem acima dos atalhos. É possível escolher o nome e um dos ícones disponíveis nas configurações gerais. A **pesquisa do cofre fica sempre no topo, ao lado do relógio local e calendário mensal**, antes dos cartões reordenáveis. O calendário permite navegar entre os meses e voltar para Hoje. A hora e a data vêm do próprio dispositivo e não exigem serviços externos.

**Navegador estilo Harbor:** digite um site ou endereço `https://` no campo de pesquisa e selecione **Abrir site no navegador** (ou pressione Enter). No **PC**, com o plugin principal **Web Viewer** do Obsidian ativado, o link abre em uma aba do visualizador nativo. No **Android/iOS**, é encaminhado ao navegador padrão do sistema. Se o Web Viewer estiver desligado no computador, também será usado o navegador externo. Somente URLs HTTP(S) são aceitas. Para sites sensíveis ou que exigem login, prefira o navegador dedicado em vez do Web Viewer.

Os demais cartões continuam presentes: notas recentes, favoritos, atalhos do Longform, quadro de cenas, revisão, estatísticas e três rascunhos rápidos. Reordene os cartões pelas setas; marque favoritos pela estrela da pesquisa ou comando **Início: favoritar nota atual**. Rascunhos permanecem nas configurações locais e podem ser exportados em novos arquivos `Quick Notes/*.md`, sem sobrescrever notas ou enviar conteúdo à IA.

### Outras opções de escrita

Para um bloco personalizado, escreva `::: nome-da-classe`, adicione o conteúdo e feche com `:::`. O módulo **Pandoc Syntax** oferece listas com letras ou algarismos romanos, listas de definição, exemplos numerados e rótulos personalizados. A antiga toolbar experimental de edição não faz parte do plugin.

## Instalação e primeiros passos

1. Pegue `main.js`, `manifest.json` e `styles.css` da **mesma versão** e coloque-os juntos em `.obsidian/plugins/basic-ai-tool-for-writers/`.
2. Ative **Basic AI Tool for Writers** nos plugins da comunidade do Obsidian.
3. Abra os painéis pela paleta de comandos e habilite os módulos desejados nas configurações.
4. Crie ou abra um projeto Longform para usar capítulos, compêndio e planejamento.

Para exportar com Pandoc no computador, instale o programa separadamente e ative a integração. A exportação por Pandoc não funciona no Android.

## Privacidade e configurações

Planejamento, grande parte das ferramentas de edição, versões locais e formatação funcionam sem conta de IA. Serviços de IA, tradução, voz on-line e gramática podem receber os textos enviados ou analisados automaticamente, conforme as configurações. Confira os provedores antes de ativá-los. Faça backup do cofre e do `data.json` antes de atualizações maiores.

Documentação: [Segurança e privacidade](../SECURITY.md) · [Como contribuir](../CONTRIBUTING.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md).
