# Basic AI Tool for Writers

**Versão:** 8.2.0 · **Requer:** Obsidian 1.11.4+ · **Computador e Android** · **Licença:** MIT

[Read in English](../README.md)

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

A navegação por **Escrita / Universo / Projeto** foi pensada para painéis estreitos. Os módulos podem ser ativados separadamente, sem criar uma segunda base de dados para os livros.

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

### Conversas fictícias com fotos opcionais

Use o bloco `writer-chat` para diálogos, mensagens de celular e transcrições fictícias. **A foto só aparece se houver um campo `avatar:`**; sem ele, não haverá círculo ou imagem substituta.

~~~~markdown
~~~writer-chat
title: Conversa no porto
=== Maria
side: left
avatar: [[Imagens/maria.webp]]
time: 18:30
---
Encontrou a carta?

=== João
side: right
time: 18:32
---
Sim, estava **dentro do livro antigo**.

=== Maria
side: left
time: 18:33
---
Então venha até o farol.
~~~
~~~~

Aceita `side: left|right|center`, `time`, `avatar: [[imagem-local.png]]` e `mine: true` para alinhar à direita. O corpo das mensagens aceita Markdown. Não depende do Chat View e não envia mensagens a nenhum serviço externo.

### Homepage de escrita (inspirada no Harbor Tab e Genkan)

Abra **Início: abrir painel de escrita** pela paleta de comandos ou pelo botão das **Configurações → Geral**. A página oferece busca de notas e títulos, arquivos recentes, favoritos, acesso ao Longform, quadro de cenas, revisão, estatísticas simples do cofre e três espaços para rascunhos rápidos.

Os cartões podem ser reordenados pelas setas. É possível favoritar notas pela estrela dos resultados da busca ou pelo comando **Início: favoritar nota atual**.

Os rascunhos são armazenados localmente nas configurações e podem ser exportados como novos arquivos em `Quick Notes/*.md`, sem sobrescrever notas existentes e sem enviar conteúdo à IA. A abertura automática ao iniciar permanece **desativada por padrão**, sem tomar o lugar das abas normais do Obsidian nem interferir em outras homepages.

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
