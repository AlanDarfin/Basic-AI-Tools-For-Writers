# Guia completo de blocos Markdown — Basic AI Tool for Writers

Este guia apresenta **exemplos prontos para copiar** de cada bloco de código renderizado pelo plugin, incluindo suas opções disponíveis. Cole cada exemplo em uma nota do Obsidian e abra a Visualização de leitura ou a Prévia ao vivo. Ative o módulo correspondente nas configurações.

Os nomes curtos são recomendados. Os aliases antigos `writer-tabs`, `writer-avatar`, `writer-wiki`, `writer-post`, `writer-chat`, `writer-media-gallery` e `writer-folder-overview` ainda funcionam. Os exemplos usam caminhos fictícios; substitua-os pelas pastas e notas reais do seu cofre.

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
| `folder` | Caminho da pasta no cofre (opcional). Sem ele, usa a pasta ligada à nota atual ou a pasta da própria nota. |
| `style` / `view` / `layout` | `cards` (cartões), `list` (árvore de lista), `compact` (linhas densas), `grid` (grade de ícones), `table` (tabela), `board` (quadro com pastas e notas). |
| `sort` | `name-asc`, `name-desc`, `modified-desc`, `modified-asc`, `created-desc`, `created-asc`, `size-desc`, `size-asc`, `type`. |
| `folderFirst` | `true`: pastas antes de notas; `false`: mistura os tipos na ordenação. |
| `subfolders` | `true` percorre subpastas; `false` mostra apenas os itens diretos. Pastas permanecem clicáveis nos dois casos. |
| `depth` | De 0 a 8 níveis adicionais de subpastas (padrão: 2). |
| `limit` | De 1 a 200 itens no total. |
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

Cada `=== Nome` cria uma aba, até o limite de 12. `layout: top` (padrão), `left`, `right` ou `side` organiza a navegação. O conteúdo aceita Markdown e edição pela prévia.

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

Os campos `chave: valor` vêm antes de `---`; depois fica o corpo em Markdown. `title`/`name`/`nome`, `subtitle`/`role`/`type`/`tipo`, `image`/`cover`/`avatar` são especiais. Outros campos são exibidos como metadados, até 12 campos. Imagens devem existir no cofre.

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

Campos aceitos: `author`/`name`/`nome`, `handle`/`username`, `date`/`time`, `avatar`/`image`, `likes`/`flames`, `views`, `comments`. Escreva `=== reply` para iniciar uma resposta. `depth` ou `level` indica o recuo da resposta, de 1 a 5.

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

Sintaxes curtas aceitas: `< Mira | Olá`, `> Jonas | Oi | 10:00`. A sintaxe antiga com seções `=== Personagem` também é aceita e pode conter `avatar`, `time`, `side` e `mine` antes de `---`.


**Separadores de conversa:** coloque `---` em uma linha isolada **entre duas mensagens** para desenhar uma divisão discreta. Use `--- Duas horas depois ---` ou `--- 14:30 ---` para centralizar uma legenda entre as linhas. Eles não entram no balão da mensagem, e uma mensagem após o separador volta a exibir o avatar/nome quando informados. Na sintaxe antiga com `=== Personagem`, o **primeiro** `---` após o cabeçalho mantém a função de separar metadados e corpo; os seguintes podem ser separadores de conversa.

**Foto do grupo:** use `group-image: [[Imagens/Expedicao.webp]]` logo após `title:` para exibir a imagem redonda à esquerda do título da conversa. Aceita também `group-photo:` e `group-avatar:`. A imagem precisa estar no cofre; links remotos são ignorados. Isso não modifica os avatares individuais nem depende de `avatars: on`.

**Áudio falso:** use `[audio:0:15]` ou `[voice:1:09]` como o conteúdo inteiro da mensagem. O botão anima as ondas de som, **sem tocar, gravar nem enviar áudio real**. Exemplo: `< | [audio:0:15] | 10:00`.

**Transcrição do áudio fictício (9.5.2):** acrescente `:texto` depois da duração: `[áudio:0:15:Estou chegando agora, abram o portão!]`. O áudio continua visual e sem som, mas surge um botão **Ver transcrição** para mostrar/ocultar o texto. O conteúdo é exibido como texto simples (sem executar HTML), aceita dois-pontos e `\\n` para várias linhas. A transcrição é **escrita por você**, não é gerada automaticamente.

~~~~markdown
~~~chat
title: Grupo da expedição
group-image: [[Imagens/grupo.webp]]
[Left=Lia, Right=Davi]
< | Lia | [áudio:0:15:Estou chegando agora.\\nGuardem um lugar para mim!] | 10:01
> | Davi | [audio:0:08:Estamos esperando você!] | 10:02
~~~
~~~~

**Quebras de linha:** linhas consecutivas e linhas vazias depois da mensagem permanecem no mesmo balão como Markdown. Também é possível usar `\\n` dentro do campo para quebrar a linha; `\\\\n` mantém a barra e o n.

**Estilos opcionais antes das mensagens:** `density: compact|normal|relaxed`, `bubbles: soft|round|square`, `avatars: on|off`, `width: normal|wide`. As cores, avatares e nomes padrão continuam funcionando.

~~~~markdown
~~~chat
density: compact
bubbles: round
[Left=Maria, right=João]
< | Olá\\nSegunda linha | 10:00
> | [audio:0:15] | 10:01
< | Outra mensagem
Novo parágrafo:

- Lista Markdown
~~~
~~~~

## 7. Galeria de mídias (`media-gallery`)

Use `path` ou `folder` para o diretório do cofre; `type` pode ser `all`, `image`, `video`, `audio` ou `pdf`. `layout`: `masonry`, `grid`, `ratio`. `sort`: `name-asc`, `name-desc`, `mtime-desc`, `mtime-asc`, `size-desc`, `size-asc`. `subfolders` permite pesquisar em pastas internas; `limit` vai de 1 a 150.

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

Configure de 1 a 4 colunas com `columns:`. Separe os conteúdos com `--- end-column ---`, `--- column-end ---`, `--- column-break ---` ou `:::columnbreak`.

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

## 12. Sumário instantâneo (`insta-toc`)

Gera um índice a partir dos títulos **da nota atual**. `maxDepth` varia de 1 a 6. `numbered` define lista numerada; `folded` recolhe as seções inicialmente.

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

O Basic aceita os dois formatos do Timeline original do George-debug. Preserva as classes entre colchetes (`line-2` a `line-5`, `body-2` a `body-4` e parte das `active-color-*`). Datas podem ser textuais, inclusive eras fictícias.

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

Opções: `layout` (`vertical` ou `horizontal`), `theme` (`classic`, `cards`, `minimal`, `compact`, `editorial`), `density` (`normal`, `compact`, `comfortable`), `sort` (`source`, `asc`, `desc`), `controls` (`true` ou `false`), `color` (hexadecimal de seis dígitos), `line` (2–5), `body` (2–4). Cada evento pode usar `date`, `title`, `content`, `group`, `image`, `color`, `icon`, `link`. Fotos e notas de destino precisam existir **dentro do cofre**. A barra oferece busca, filtro de trilhas, mudança de orientação e rolagem horizontal. A timeline do projeto Longform continua independente.

## Se um bloco não funcionar

Verifique a grafia do nome entre as crases, o módulo habilitado e o modo de leitura do Obsidian. Em `folder-overview` e `media-gallery`, `folder`/`path` são caminhos **dentro do cofre**, e não caminhos absolutos do computador. Imagens locais precisam existir no cofre. No Android, o Overview em **lista** oferece dois alvos de toque: a seta expande/recolhe as subpastas e o nome abre a pasta.

Todos os exemplos documentam funções existentes no Basic, sem exigir a instalação do Make.md.
