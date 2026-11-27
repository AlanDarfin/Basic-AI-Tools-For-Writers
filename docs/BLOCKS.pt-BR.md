# Guia completo de blocos Markdown — Basic AI Tool for Writers

Em uma nota Markdown, execute **Escrita: catálogo de inserção rápida** ou digite `/` seguido do nome de um bloco. Você também pode colar um exemplo completo deste guia. Ative o módulo correspondente nas configurações do Basic e use a Visualização de leitura ou a Prévia ao vivo. Substitua os caminhos dos exemplos pelos do seu cofre.

| Uso | Nomes dos blocos |
| --- | --- |
| Conversas e publicações fictícias | `chat` / `writer-chat`, `post` / `writer-post` |
| Notas e criação de mundos | `tabs` / `writer-tabs`, `wiki` / `writer-wiki`, `avatar` / `writer-avatar` |
| Escrita e revisão | `scene-card`, `character-voice`, `beat-sheet`, `editor-note` |
| Arquivos e mídias | `folder-overview` / `writer-folder-overview`, `media-gallery` / `writer-media-gallery` |
| Layout e navegação | `columns`, `writer-columns`, `insta-toc`, `longform-nav` |
| Planejamento | `flow` / `writer-flow`, `timeline` / `writer-timeline`, `timeline-labeled`, `basic-timetable` |
| Biblioteca e citações | `bookshelf` / `writer-bookshelf`, `bibliography` / `zotero` |
| Bancos e propriedades | `basic-database` / `writer-database`, `basic-suite-db`, `basic-suite-chart`, `meta-field` |
| Widgets e progresso | `widgets`, `progressbar` |
| Compatibilidade com Meta Bind | `meta-bind`, `meta-bind-button` |

## 1. Overview de pastas (`folder-overview`)

Mostra notas e subpastas em seis modos, com ordenação, filtro, navegação, ícones personalizados do Explorador e suporte ao toque. **Não são exibidas miniaturas:** cada item usa somente o ícone de sua pasta ou nota, junto com o título. Descrições são opcionais e vêm desativadas por padrão.

~~~~markdown
~~~folder-overview
folder: Escrita
style: cards
sort: name-asc
folderFirst: true
subfolders: true
depth: 2
limit: 80
showBrief: false
briefMax: 110
showPath: false
noteOnly: false
controls: true
~~~
~~~~

**Opções completas:**

| Campo | Valores e significado |
| --- | --- |
| `folder` | Caminho da pasta no cofre (opcional). Use `/` para a raiz. Sem esse campo, usa a pasta ligada à nota atual ou a pasta da própria nota. |
| `style` / `view` / `layout` | `cards` (cartões), `list` (árvore de lista), `compact` (linhas densas), `grid` (grade de ícones), `table` (tabela), `board` (quadro com pastas e notas). |
| `sort` | `name-asc`, `name-desc`, `modified-desc`, `modified-asc`, `created-desc`, `created-asc`, `size-desc`, `size-asc`, `type`. |
| `folderFirst` | `true`: pastas antes de notas; `false`: mistura os tipos na ordenação. |
| `subfolders` | `true` percorre subpastas; `false` mostra apenas os itens diretos. Pastas permanecem clicáveis nos dois casos. |
| `depth` | De 0 a 8 níveis adicionais de subpastas (padrão: 2). |
| `limit` | De 1 a 200 itens. A busca por nome ou caminho considera a profundidade configurada antes de aplicar o limite. |
| `noteOnly` | `true`: mostra apenas notas, mas ainda pode pesquisar dentro de subpastas. |
| `showBrief` | `true` exibe o resumo textual, quando existir; padrão `false`. |
| `briefMax` | Máximo de 32 a 400 caracteres no resumo. Campos técnicos da Folder Note são ignorados. |
| `showPath` | Mostra o caminho em cartões aninhados, quando aplicável. |
| `controls` | Mostra os seletores de visualização e ordenação e o campo de pesquisa. |

As opções `card` e `strip` continuam aceitas como aliases de `cards` e `list`. A ordenação é aplicada dentro de cada pasta para preservar a hierarquia. Os seletores visuais alteram somente aquela instância, sem reescrever o bloco original; configure os campos no Markdown para salvar um padrão.

**Lista com subpastas no Android/PC:** toque na seta à direita para expandir/recolher os itens aninhados ou toque no nome da pasta para navegar até ela.

~~~~markdown
~~~folder-overview
folder: Escrita
style: list
sort: modified-desc
subfolders: true
depth: 4
folderFirst: true
showBrief: false
controls: true
~~~
~~~~

**Tabela organizada pelas notas mais recentes:**

~~~~markdown
~~~folder-overview
folder: Escrita
style: table
sort: modified-desc
folderFirst: false
noteOnly: true
subfolders: true
depth: 3
limit: 50
~~~
~~~~

Para usar só os ícones maiores, experimente `style: grid`. Para separar pastas e notas em colunas, use `style: board`.

## 2. Abas (`tabs`)

Cada `=== Nome` cria uma aba, até o limite de 12. `layout: top` (padrão), `left`, `right` ou `side` organiza a navegação. O conteúdo aceita Markdown e edição pela prévia. Um marcador dentro de um exemplo cercado de código permanece no conteúdo da aba.

~~~~markdown
~~~tabs
layout: left
=== Sinopse
## Abertura
O grupo chega à cidade.

=== Personagens
- [[Mira]]
- [[Jonas]]

=== Tarefas
- [x] Criar outline
- [ ] Revisar capítulo
~~~
~~~~

## 3. Wiki / caixa de informação (`wiki`)

Os campos `chave: valor` vêm antes de `---`, seguidos pelo corpo em Markdown. `title`/`name`/`nome`, `subtitle`/`role`/`type`/`tipo`, `image`/`cover`/`avatar` são especiais. Até 12 outros campos aparecem como metadados e seus nomes podem ter acentos. Imagens devem existir no cofre.

~~~~markdown
~~~wiki
title: Arquivo do Norte
type: Local
subtitle: Biblioteca ancestral
image: [[Imagens/arquivo.webp]]
região: Montanhas
fundado: Ano 312
responsável: Mira
---
Um arquivo que conserva mapas e manuscritos antigos.

- [[Inventário da biblioteca]]
- [[Notas da expedição]]
~~~
~~~~

## 4. Avatar / cartão de personagem (`avatar`)

Aceita os mesmos campos de título e imagem. `layout: left` ou `right` coloca a imagem ao lado do texto; `top` usa o layout tradicional. Sem imagem, aparece a inicial.

~~~~markdown
~~~avatar
title: Mira
role: Exploradora
image: [[Personagens/Mira.png]]
layout: right
---
**Objetivo:** encontrar a expedição desaparecida.

- Personalidade: curiosa
- Aliado: [[Jonas]]
~~~
~~~~

## 5. Publicação fictícia (`post`)

O bloco aceita `author`/`name`/`nome`, `handle`/`username`, `date`/`time`, `avatar`/`image`, `likes`/`flames`, `views` e `comments`. Fora de exemplos cercados de código, uma linha com `=== reply` inicia uma resposta. `depth` ou `level` indica o recuo da resposta, de 1 a 5.

~~~~markdown
~~~post
author: Mira
handle: @mira
date: 12:30
avatar: [[Personagens/Mira.png]]
likes: 12
views: 94
---
Finalmente abrimos o portão norte!

=== reply
author: Jonas
handle: @jonas
depth: 1
likes: 3
---
Você trouxe o mapa?

=== reply
author: Mira
depth: 2
---
Claro!
~~~
~~~~

As publicações são fictícias e locais, sem conexão com redes sociais.

## 6. Conversa fictícia (`chat`)

`<` indica mensagem à esquerda; `>` indica à direita. Separe avatar, nome, mensagem e hora usando `|`. As diretivas entre colchetes configuram os nomes padrão, as cores ou imagens locais dos avatares. Mensagens consecutivas do mesmo personagem não repetem os cabeçalhos desnecessariamente.

~~~~markdown
~~~chat
title: Expedição ao arquivo
group-image: [[Imagens/Expedicao.webp]]
[Left=Mira, right=Jonas]
[Mira=blue, Jonas=green]
[Mira=[[Personagens/Mira.png]]]
< | Mira | Encontramos a entrada. | 09:41
---
> | Jonas | Vou levar os materiais. | 09:42
--- Duas horas depois ---
< | | Confira o mapa primeiro. | 11:43
> | | Certo.
~~~
~~~~

Use `< Mira | Olá` para uma mensagem curta, `> Jonas | Oi | 10:00` para incluir o horário ou `< [[Personagens/Mira.png]] | Mira | Olá` para incluir um avatar sem horário. A sintaxe antiga com seções `=== Personagem` também é aceita e pode conter `avatar`, `time`, `side` e `mine` antes de `---`.


**Separadores de conversa:** coloque `---` em uma linha isolada **entre duas mensagens** para desenhar uma divisão discreta. Use `--- Duas horas depois ---` ou `--- 14:30 ---` para centralizar uma legenda entre as linhas. Eles não entram no balão da mensagem, e uma mensagem após o separador volta a exibir o avatar/nome quando informados. Na sintaxe antiga com `=== Personagem`, o **primeiro** `---` após o cabeçalho mantém a função de separar metadados e corpo; os seguintes podem ser separadores de conversa.

**Foto do grupo:** use `group-image: [[Imagens/Expedicao.webp]]` logo após `title:` para exibir a imagem redonda à esquerda do título da conversa. Aceita também `group-photo:` e `group-avatar:`. A imagem precisa estar no cofre; links remotos são ignorados. Isso não modifica os avatares individuais nem depende de `avatars: on`.

**Áudio falso:** use `[audio:0:15]` ou `[voice:1:09]` como o conteúdo inteiro da mensagem. O botão anima as ondas de som, **sem tocar, gravar nem enviar áudio real**. Exemplo: `< | [audio:0:15] | 10:00`.

Para incluir uma transcrição escrita, acrescente `:texto` depois da duração, como em `[áudio:0:15:Estou chegando agora, abram o portão!]`. O texto aparece abaixo da onda quando a mensagem carrega. Use `\n` para quebrar a linha ou `\\n` para exibir a sequência literal de barra invertida e n.

~~~~markdown
~~~chat
title: Grupo da expedição
group-image: [[Imagens/grupo.webp]]
[Left=Lia, Right=Davi]
< | Lia | [áudio:0:15:Estou chegando agora.\nGuardem um lugar para mim!] | 10:01
> | Davi | [audio:0:08:Estamos esperando você!] | 10:02
~~~
~~~~

**Quebras de linha:** linhas consecutivas e linhas vazias depois da mensagem permanecem no mesmo balão como Markdown. Também é possível usar `\n` dentro do campo para quebrar a linha; `\\n` mantém a barra e o n.

**Estilos opcionais antes das mensagens:** `density: compact|normal|relaxed`, `bubbles: soft|round|square`, `avatars: on|off`, `width: normal|wide`. As cores, avatares e nomes padrão continuam funcionando.

~~~~markdown
~~~chat
density: compact
bubbles: round
[Left=Maria, right=João]
< | Olá\nSegunda linha | 10:00
> | [audio:0:15] | 10:01
< | Outra mensagem
Novo parágrafo:

- Lista Markdown
~~~
~~~~

Conversas longas abrem com os primeiros 50 itens. Clique em **Mostrar mais mensagens** para continuar a leitura. Cada bloco aceita até 32.000 caracteres.

## 7. Galeria de mídias (`media-gallery`)

Use `path` ou `folder` para indicar o diretório e `/` para a raiz do cofre. `type` aceita `all`, `image`, `video`, `audio`, `pdf` e `document`. Para `layout`, escolha `masonry`, `grid` ou `ratio`. Para `sort`, use `name-asc`, `name-desc`, `mtime-desc`, `mtime-asc`, `size-desc` ou `size-asc`. Ative `subfolders: true` para incluir pastas internas. `limit` restringe os resultados após a ordenação e os filtros (1–500), e `pageSize` define quantos aparecem por página (8–60).

~~~~markdown
~~~media-gallery
path: Mídia
type: all
layout: masonry
sort: mtime-desc
subfolders: true
limit: 90
~~~
~~~~

## 8. Colunas Markdown (`columns`)

Configure de 1 a 4 colunas com `columns:` na primeira linha. Separe os conteúdos com `--- end-column ---`, `--- column-end ---`, `--- column-break ---` ou `:::columnbreak`. Um separador dentro de um exemplo cercado de código permanece no Markdown da coluna.

~~~~markdown
~~~columns
columns: 3
### Personagens
- Mira
- Jonas
--- end-column ---
### Lugares
- Arquivo do Norte
- Porto Leste
--- end-column ---
### Tarefas
- [ ] Conferir mapas
- [ ] Escrever cena
~~~
~~~~

## 9. Barra de progresso (`progressbar`)

**Progresso manual:** `kind: manual` recebe `min`, `max`, `value`, `name`. Para os botões +/−, defina `id` (identificador persistente) e `button: true`. O título pode usar `{min}`, `{max}`, `{value}`, `{percentage}`.

~~~~markdown
~~~progressbar
kind: manual
id: capitulo-um
name: Capítulo um — {value}/{max} ({percentage})
min: 0
max: 20
value: 6
button: true
~~~
~~~~

**Progresso por calendário:** `kind: day-year`, `day-month`, `day-week`, `month` calculam automaticamente. Para um intervalo personalizado, use `day-custom` e datas ISO em `min`/`max`.

~~~~markdown
~~~progressbar
kind: day-custom
name: Cronograma — {percentage}
min: 2026-11-01
max: 2026-12-31
~~~
~~~~

## 10. Widgets (`widgets`)

Um bloco renderiza **um** tipo entre `clock`, `quote`, `countdown`, `counter`.

**Relógio:** `format: 12hr` ou `24hr`; `hideseconds: true` oculta segundos.

~~~~markdown
~~~widgets
type: clock
format: 24hr
hideseconds: true
~~~
~~~~

**Citação:** use `quote` e `author`.

~~~~markdown
~~~widgets
type: quote
quote: Toda história começa com uma primeira página.
author: Exemplo
~~~
~~~~

**Contagem regressiva:** `date` define a data final; `to` identifica o evento; `completedlabel` é exibido quando o prazo termina.

~~~~markdown
~~~widgets
type: countdown
date: 2027-01-01
to: Próxima meta de escrita
completedlabel: Meta concluída
~~~
~~~~

**Contador:** `id` identifica o valor salvo nas configurações; `startvalue` é o início; `increment` é o passo; `text` é o rótulo.

~~~~markdown
~~~widgets
type: counter
id: sessoes-de-escrita
startvalue: 0
increment: 1
text: Sessões concluídas
~~~
~~~~

## 11. Campo YAML interativo (`meta-field`)

`property` indica uma propriedade do frontmatter; `type` pode ser `view` (somente leitura), `toggle`, `text`, `number` ou `select`; `label` é o nome exibido. `options` define escolhas separadas por `|` para `select`. Apenas a propriedade especificada da nota atual é alterada.

**Caixa de marcação:**

~~~~markdown
~~~meta-field
property: concluido
type: toggle
label: Capítulo concluído
~~~
~~~~

**Texto, número, seleção e visualização somente leitura:**

~~~~markdown
~~~meta-field
property: revisor
type: text
label: Revisor
~~~

~~~meta-field
property: revisao
type: number
label: Número da revisão
~~~

~~~meta-field
property: status
type: select
label: Estado
options: Rascunho | Revisando | Concluído
~~~

~~~meta-field
property: autor
type: view
label: Autor (somente leitura)
~~~
~~~~

### Campos no modo Leitura

Ative **Campos INPUT e VIEW na leitura** nas configurações do Basic. Escreva os marcadores como texto comum no Markdown. Eles leem ou editam propriedades YAML de primeiro nível da própria nota.

```markdown
Capítulo concluído INPUT[toggle:concluido]
Estado INPUT[select(Rascunho, Revisando, Concluído):status]
Progresso INPUT[slider(0, 100, 5):progresso]
Estado atual VIEW[status]
```

Ative **Blocos antigos do Meta Bind** para usar formulários simples `meta-bind` e botões `meta-bind-button` na própria nota. O plugin Meta Bind, quando ativo, tem prioridade. Os botões aceitam `set`, `toggle` e `increment`.

~~~~markdown
~~~meta-bind-button
property: revisao
action: increment
step: 1
label: Avançar revisão
~~~
~~~~

## 12. Sumário instantâneo (`insta-toc`)

Gera um índice com os títulos Markdown da nota atual, incluindo títulos sublinhados com `===` ou `---`. `maxDepth` varia de 1 a 6. Use `numbered: true` para numerar a lista e `folded: true` para iniciar com as seções recolhidas. Cada link leva ao título certo na Visualização de leitura ou na Prévia ao vivo, mesmo quando o texto do título se repete.

~~~~markdown
~~~insta-toc
maxDepth: 4
numbered: true
folded: false
~~~
~~~~

## 13. Navegação entre notas e capítulos (`longform-nav`)

Com o bloco vazio, a navegação procura os capítulos anterior e próximo na ordem do projeto Longform atual. Para notas comuns fora de um projeto, use `mode: manual` e preencha `previous`/`next` com links válidos do cofre.

**Modo automático:**

~~~~markdown
~~~longform-nav
~~~
~~~~

**Modo manual:**

~~~~markdown
~~~longform-nav
mode: manual
previous: "[[Escrita/Capítulo 01]]"
next: "[[Escrita/Capítulo 03]]"
~~~
~~~~

## 14. Linha do tempo narrativa (`timeline` / `timeline-labeled`)

O Basic aceita os dois formatos do Timeline original do George-debug. Preserva as classes entre colchetes (`line-2` a `line-5`, `body-2` a `body-4` e todas as 11 cores `active-color-*`). Datas podem ser textuais, inclusive eras fictícias.

**Sintaxe original com três linhas + por evento:**

~~~~markdown
~~~timeline
[line-3, body-2, active-color-interactive-accent]
layout: vertical
theme: classic

+ 2030
+ Primeiro encontro
+ Uma descrição em **Markdown** com [[Links]].

+ No inverno seguinte
+ Novas descobertas
+ O enredo avança.
~~~
~~~~

**Formato expandido, com fotos e visualização horizontal:**

~~~~markdown
~~~timeline-labeled
layout: horizontal
theme: editorial
density: comfortable
sort: source
controls: true

date: 2030-04-01
title: Primeiro encontro
group: Parte I
icon: sparkles
color: #b278c8
image: [[Imagens/encontro.webp]]
link: [[Capítulos/Primeiro encontro]]
content:
O evento aceita **Markdown**, listas e links internos.

---
date: 2030-06-08
title: Partida
group: Parte II
image: [[Imagens/partida.jpg]]
content:
Mais um momento na mesma linha do tempo.
~~~
~~~~

Opções: `layout` (`vertical` ou `horizontal`), `theme` (`classic`, `cards`, `minimal`, `compact`, `editorial`, `poster`, `glass`, `terminal`), `density` (`normal`, `compact`, `comfortable`), `sort` (`source`, `asc`, `desc`), `controls` (`true` ou `false`), `color` (hexadecimal de seis dígitos), `line` (2–5), `body` (2–4). Cada evento pode usar `date`, `title`, `content`, `group`, `image`, `color`, `icon`, `link`. Fotos e notas de destino precisam existir **dentro do cofre**. A barra oferece busca, filtro de trilhas, mudança de orientação e rolagem horizontal. A timeline do projeto Longform continua independente.

Estilos originais de linha: `line: 2` usa um anel vazado, `line: 3` um ponto sólido, `line: 4` linha tracejada com marcador circular, e `line: 5` um losango. Cartões: `body: 2` é um painel, `body: 3` uma bandeira colorida e `body: 4` uma faixa lateral. São compatíveis `spaced-lines`, `hide-titles` e todas as 11 cores `active-color-*`. Use o seletor da timeline para testar os estilos; altere o bloco Markdown para salvar a escolha. Minimal é texto sem cartões e com mais respiro; Compact é uma lista densa com data e título lado a lado.

Descrições aceitam código delimitado ou indentado. Para separar eventos no formato com rótulos, coloque `---` antes do próximo campo `date`, `time` ou `when`. Uma divisória seguida de mais texto fica na descrição. Para rolar uma timeline horizontal pelo teclado, coloque o foco nela e use as setas.

## Se um bloco não funcionar

Verifique a grafia do nome entre as crases, o módulo habilitado e o modo de leitura do Obsidian. Em `folder-overview` e `media-gallery`, `folder`/`path` são caminhos **dentro do cofre**, e não caminhos absolutos do computador. Imagens locais precisam existir no cofre. No Android, o Overview em **lista** oferece dois alvos de toque: a seta expande/recolhe as subpastas e o nome abre a pasta.

Todos os exemplos documentam funções existentes no Basic, sem exigir a instalação do Make.md.


## 15. Biblioteca Longform (bookshelf / writer-bookshelf)

A biblioteca usa índices Longform existentes e capas locais, sem criar uma segunda base de livros. Também há um widget compacto **Meus livros** na homepage.

~~~~markdown
~~~bookshelf
sort: recent
layout: compact
~~~
~~~~

Use `sort` para ordenar por `title`, `recent`, `chapters`, `progress` ou `series`. Use `layout` para escolher entre `normal` e `compact`.

## 16. Gallery de documentos e editor de texto

Além de imagem/vídeo/áudio/pdf, a galeria aceita **type: document**. Os cartões incluem TXT, Markdown, JSON, CSV, XML, RTF, DOCX, EPUB e similares. Áudio possui player; PDF e documentos binários abrem nos visualizadores nativos. O novo editor edita formatos de texto/código de até 512 KiB com botão Salvar; **não** é editor de DOCX.

~~~~markdown
~~~media-gallery
folder: Livros/Referências
type: document
layout: grid
subfolders: true
~~~
~~~~

## 17. Áudio fictício: transcrição escrita sempre visível

Com [áudio:0:15:Texto escrito] ou [audio:0:15:Written text], o conteúdo fornecido aparece imediatamente, como texto seguro, abaixo da onda simulada, sem botão para expandir. Não há transcrição nem reprodução real de áudio. Os formatos antigos chat, writer-chat, --- e --- texto --- permanecem válidos.


## 18. Adições da versão 10.1 e compatibilidade

Os blocos `bookshelf` e `writer-bookshelf` oferecem a mesma biblioteca. Filtre por estante, estado de leitura ou favoritos e ajuste esses dados pelo cartão. Nos projetos Longform, a porcentagem acompanha os capítulos concluídos. Em livros de uma única nota, ela acompanha a rolagem ou usa o valor da propriedade `readingProgress`.

**Media Gallery:** mantenha \`media-gallery\` ou \`writer-media-gallery\`. Use \`pageSize: 24\` e \`limit: 200\` para navegar por páginas. A função **Selecionar vários → Copiar links** gera wikilinks do Obsidian. Excertos de documentos de texto são locais; PDFs abrem pelo Obsidian.

~~~~markdown
~~~media-gallery
folder: Livros/Pesquisa
type: all
layout: grid
sort: mtime-desc
limit: 200
pageSize: 24
subfolders: true
~~~
~~~~

**Flow em grafo:** use \`flow\` ou \`writer-flow\` com \`layout: graph\`. Uma nota pode apontar dependência pela linha \`[[Rascunho/Capítulo 2]] | after:[[Rascunho/Capítulo 1]]\`. O Basic organiza os cartões pela profundidade e permite editar a dependência. Não executa scripts ou workflows externos.

~~~~markdown
~~~flow
layout: graph
[[Rascunho/Capítulo 1]]
[[Rascunho/Capítulo 2]] | after:[[Rascunho/Capítulo 1]]
[[Rascunho/Capítulo 3]] | after:[[Rascunho/Capítulo 2]]
~~~
~~~~

**Cartões de texto no Flow.** Comece cada coluna com `=== Nome da coluna` e cada cartão com `- `. Mova os cartões arrastando no computador ou usando as setas. O Basic salva a coluna de cada cartão nas configurações do cofre e preserva o Markdown. Use um `id` exclusivo para manter as posições ao deslocar o quadro dentro da nota.

Use **Escrita: catálogo de inserção rápida**, na paleta de comandos, para adicionar um quadro de cartões de texto ou outros blocos no editor.

~~~~markdown
~~~flow
id: ideias-da-historia
=== Ideias
- Planejar a abertura
=== Em andamento
- Escrever o primeiro capítulo
~~~
~~~~

**Timeline:** use \`sort: dependencies\`, \`max-events: 150\` e \`page-size: 30\`, além de \`id\`, \`after\` e \`era\` nos eventos. O limite antigo de 80 permanece como padrão; agora pode aumentar até 250 explicitamente. Dependências influenciam somente a ordem visual.

~~~~markdown
~~~timeline-labeled
layout: horizontal
theme: cards
sort: dependencies
max-events: 150
page-size: 30

date: 2040
title: Fundação
id: fundacao
era: Primeira Era
content:
A cidade surge.

---
date: 2041
title: A jornada
id: jornada
after: fundacao
era: Primeira Era
content:
A história continua.
~~~
~~~~

**Não são blocos Markdown:** importar/exportar ICS, filtrar tabelas, validar YAML, editar propriedades em lote, configurar DoubleShift, gerenciar histórico de Spaces e salvar presets de widgets são comandos e configurações.


## 19. Novas opções do chat e alinhamento (10.2)

~~~~markdown
~~~chat
title: Exemplo
background: transparent
bubble-color: green
[Maria=purple, Maria=bubble:orange]

< | Maria | Mensagem de teste | 14:32
> | Eu | [áudio:0:02:teste teste] | 14:34
~~~
~~~~

Cor do nome e cor do balão são independentes; transcrições são texto fictício escrito no bloco. O fundo transparente remove o painel da conversa.

Alinhamento direto no Markdown (uma linha própria por marcador):

~~~~markdown
::l[Esquerda]
::c[**Centralizado**]
::r[*Direita*]
~~~~

Aliases completos: ::left, ::center e ::right. Nenhum codeblock é necessário para alinhar.


## Alinhamento com marcadores curtos (10.4.9)

No fim da linha, digite `{l}`, `{c}`, `{r}` ou `{j}`: esquerda, centro, direita e justificado. Isso funciona também em títulos Markdown.

~~~~markdown
# Título centralizado {c}
## Capítulo justificado {j}
Um parágrafo mais longo que deve ser justificado {j}
~~~~

A toolbar e o comando **Justificar texto** também aplicam `{j}`, sem criar HTML. Os marcadores ficam ocultos no modo de leitura, e os formatos antigos `::c:` e `::c[...]` continuam compatíveis.


## 10.7 — Bancos de notas e colunas

Exemplos adicionais. Os campos são propriedades YAML das notas; rollups usam links `[[Nota]]` em `related`.

```writer-database
folder: Personagens
columns: file, status, priority
view: board
group: status
sort: priority
order: desc
formula: doublePriority = priority * 2
rollup: scenePages = related.pages | sum
limit: 100
```

```writer-columns
## Anotações
- A
- B

---column---
## Referências
- C
- D
```

## Visualizações de banco e horário de aulas

Use `basic-suite-db` com `folder` ou `database` e uma opção `view` como `table`, `board` ou `gallery`. Para contar notas por propriedade YAML, use `basic-suite-chart` com `group`.

~~~~markdown
~~~basic-suite-chart
folder: Escrita
group: status
~~~
~~~~

Crie a nota de horário em **Estudos: abrir central acadêmica** e insira `basic-timetable`. A opção `file` aponta para outra nota de horário. O bloco reconhece dias em português e inglês e destaca o dia atual.

~~~~markdown
~~~basic-timetable
title: Aulas do semestre
~~~
~~~~

## Quatro blocos para escrever e revisar

Ative **Sintaxe estendida → Blocos interativos**. Insira pelos comandos da paleta
**Inserir: Ficha de cena**, **Voz da personagem**, **Batidas da história** ou
**Nota de revisão**. Uma seleção no editor é preservada dentro do bloco.
O botão **Editar** altera o código Markdown do próprio bloco; o salvamento detecta
se o conteúdo original mudou e não sobrescreve edições concorrentes.
Se qualquer parte da nota mudar enquanto o editor do bloco estiver aberto, o
salvamento é recusado e o rascunho continua no editor. Copie-o antes de reabrir o
bloco. Cercas de código no conteúdo ficam dentro de uma cerca externa maior.

````markdown
```scene-card
title: A estação vazia
pov: Ana
location: Plataforma
goal: Encontrar o irmão
conflict: O último trem está partindo
outcome: Ela encontra uma pista
---
A cena começa com **Ana** chegando à plataforma.
```

```character-voice
name: Ana
tone: Ansiosa
---
“Você também ouviu aquilo?”
```

```beat-sheet
title: O primeiro ato
---
Abertura | Ana chega à estação.
Virada | Ela encontra [[Carta|uma carta]].
Desfecho | O trem parte sem ela.
```

```editor-note
title: Revisão da cena
status: Pendente
---
Verificar se o motivo de Ana está claro para o leitor.
```
````

Nos blocos, as linhas iniciais são campos opcionais e `---` separa os campos do
conteúdo Markdown. No `beat-sheet`, use `Título | conteúdo` por linha; o separador
requer espaços dos dois lados, preservando links como `[[Nota|Apelido]]`. Há no
máximo 80 batidas por bloco e 32 mil caracteres por bloco. Os exemplos não
precisam de IA nem serviços externos.

O comando **Escrita: ritmo e repetições** analisa a seleção ou, se não houver
seleção, a nota atual. Agrupa frases em 1–12, 13–24 e 25+ palavras, destaca as
frases e os parágrafos mais longos e mostra repetições próximas. Toque num
resultado para voltar ao texto original. As contagens são aproximadas e a
análise é local, com limite de 200 mil caracteres por relatório.
