# Basic AI Tool for Writers

**Um espaço de escrita modular para o Obsidian.**

**Versão:** 9.2.11 · **Requer:** Obsidian 1.11.4+ · **Computador e Android** · **Licença:** MIT

[Read in English](../README.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md) · [Segurança](../SECURITY.md)

Escreva, planeje, revise e organize livros sem transferir seu trabalho para um banco de dados separado. O plugin reúne Longform, ferramentas de criação de mundos, homepage personalizável, edição Markdown, revisão linguística e IA opcional. Suas notas, pastas, links e propriedades continuam dentro do cofre do Obsidian.

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

### Explorador nativo e aparência

- **Ícones no estilo Iconic:** escolha ícones Lucide e cores para notas, pastas, favoritos e homepage.
- **Notas favoritas:** estrelas no Explorador nativo compartilham favoritos com o widget da homepage.
- **Prévias no Explorador:** descrições, trechos de texto, imagens de capa e miniaturas da primeira imagem incorporada; opção para mostrar e ocultar.
- **Flexplorer:** fixe ou oculte itens, organize pastas, defina ordem personalizada e aplique padrões glob para visibilidade, sem excluir os arquivos.
- **Interface compacta:** abas roláveis, menus consistentes e módulos que podem ser ligados e desligados para aproveitar telas menores.

**Descrições no explorador:** prévias longas de pastas e notas ficam compactas. Ao manter o mouse sobre a descrição por **1,5 segundo**, o texto se expande; ao sair, volta ao tamanho normal. Foco pelo teclado também expande as descrições.

### Áudio e acessibilidade

- **Soundscapes (PC):** rádios e playlists do YouTube agora usam um **mini player flutuante dentro do Obsidian**, sem abrir abas. É possível recolher sem interromper a rádio ou usar **Parar** para descarregá-la. O mini player tenta utilizar Webview do Chromium e, quando indisponível, recorre a um iframe visível do YouTube. Reprodução e volume das rádios ficam nos controles do vídeo; algumas transmissões podem bloquear incorporação (erro 153). **Minha Música** continua usando o player local, com controles próprios.
- **Image Captions:** legendas opcionais de imagens a partir do texto alternativo do Markdown, sem reescrever arquivos.
- **Click Clack (PC):** sons de digitação com catálogo dos **13 pacotes originais** (Cherry MX, IBM, Olympia, Quill e outros), disponíveis para download individual ou em lote nas configurações. Pacotes instalados funcionam offline e nenhum áudio é baixado automaticamente.
- **Leitura em voz alta (TTS):** vozes do sistema, quando disponíveis, ou vozes online com autorização, com idioma, velocidade, tom e seleção de voz. A leitura online envia texto ao serviço escolhido apenas quando ativada.
- **Teclado e toque:** visualizações com botões, menus e alternativas acessíveis ao arrastar e soltar.


**Overview de pastas (9.2.11):** itens com apenas o ícone e o nome, seis visualizações (cartões, lista aninhada, compacto, grade de ícones, tabela e quadro), ordenação por nome, data, tamanho ou tipo e busca. No Android, a seta expande/recolhe subpastas e o nome abre a pasta. Resumos opcionais ignoram metadados técnicos de Folder Notes.

**Exemplos completos de todos os blocos Markdown:** [Guia em português](BLOCKS.pt-BR.md) · [English block guide](BLOCKS.en.md).

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
