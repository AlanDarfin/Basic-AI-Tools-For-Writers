# Basic

**Um espaço de escrita no Obsidian: planeje, escreva, revise e organize seu trabalho em Markdown.**

**Versão:** 13.15.0 · **Requer:** Obsidian 1.11.4+ · **Plataformas:** Computador e Android · **Licença:** MIT

[Read in English](../README.md) · [Primeiros passos](GETTING_STARTED.pt-BR.md) · [Recursos e suporte](SUITES_AND_INTEGRATIONS.pt-BR.md)

O Basic reúne escrita de capítulos, planejamento de histórias, edição, uma página inicial configurável e IA opcional dentro do seu cofre. As notas continuam sendo arquivos Markdown comuns, com suas pastas, links e propriedades. Escolha os recursos que usa e deixe os demais fora dos menus.

A busca de tarefas exclui checkboxes dentro de propriedades, comentários e blocos de código e mostra quanto do cofre foi examinado. Leituras de voz pendentes são canceladas ao parar, desligar a leitura ou mudar a nota ou o provedor. O título e a logo da página inicial ganham destaque, preservando o layout de painéis estreitos.

## Instale e ajuste ao seu trabalho

1. Baixe **`main.js`**, **`manifest.json`** e **`styles.css`** da [versão estável mais recente](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/latest).
2. Coloque os três arquivos juntos em `<seu-cofre>/.obsidian/plugins/basic-ai-tool-for-writers/`.
3. Abra **Configurações do Obsidian → Plugins da comunidade** e ative **Basic**.
4. Em uma instalação nova, a **Configuração inicial** permite escolher **Essencial**, **Escrita de livros**, **Estudo** ou **Personalizado**, conferir os interruptores e usar **Aplicar escolhas**. Também é possível **Configurar depois**.
5. Continue em **Configurações → Basic → Geral → Comece por aqui**. As ferramentas locais de escrita dispensam conta de IA.

A configuração inicial muda a seleção de recursos depois de aplicar. Ela não pede chaves de API nem altera suas notas. Atualizações preservam as escolhas de quem já usa o Basic. Para reabrir, use **Configuração inicial: abrir** na paleta de comandos ou o botão em **Comece por aqui**.

Para atualizar manualmente, substitua os três arquivos da release juntos e recarregue o Obsidian. O ZIP do código-fonte do GitHub não é o pacote de instalação. Consulte o [guia de instalação e primeiro uso](GETTING_STARTED.pt-BR.md) para Android, atualização e solução de problemas.

## O que você pode fazer

| Seu trabalho | Ferramentas do Basic |
| --- | --- |
| **Escrever um livro** | Capítulos e subcapítulos, quadros de cenas, escrita contínua, tarefas do projeto, recuperação local de rascunhos e compilação completa do manuscrito em Markdown. |
| **Planejar uma história** | Personagens, lugares, compêndio, relações, cronologias, séries, metas e notas editoriais. |
| **Escrever e editar notas** | Sugestões de palavras, atalhos do editor, aspas pareadas, meia-risca/travessão (`--` → `–`, `---` → `—`), substituições literais/regex imediatas ou após Espaço, restauração por Backspace, trechos reutilizáveis, memória do cursor e formatação Markdown. |
| **Organizar o cofre** | Espaços de trabalho, coleções virtuais, página inicial, prévias de arquivos, calendários, tarefas, bancos locais e anotações em imagens. |
| **Estudar e ler** | Cartões, revisão espaçada, rotina de estudos, estimativa de leitura, citações importadas e controles de voz. |
| **Revisar textos** | Análise local de ritmo e repetições, dicionário ortográfico pessoal, LanguageTool opcional, comparação de versões e snapshots. |
| **Usar IA quando precisar** | Definições, tradução, conversa, reescrita e comentários editoriais, com escolha de provedor e modelo por função. |

O [guia de recursos](SUITES_AND_INTEGRATIONS.pt-BR.md) reúne as seções atuais de configuração, ações, conexões e limites.

## Encontre as configurações pelo que quer fazer

As categorias acompanham o trabalho que você está realizando:

| Categoria | Exemplos |
| --- | --- |
| **Geral** | Configuração inicial, Recursos, Perfis de escrita, Diagnóstico e compatibilidade. |
| **Aparência e painéis** | Página inicial, explorador, propriedades, imagens, mídia e widgets. |
| **Escrita e edição** | Atalhos do editor, digitação, sugestões, posição do cursor, modelos e ações rápidas. |
| **Markdown e formatação** | Barra, formatação de texto, listas, numeração, símbolos, sumários e padronização. |
| **Organização e foco** | Espaços de trabalho, calendário, tarefas, bancos, temporizador, música e notas protegidas. |
| **Livros e projetos** | Escrita de livros, biblioteca, navegação de capítulos, tarefas e construção do universo. |
| **Revisão e versões** | Gramática, revisão com IA, comparações seletivas, reescrita e histórico. |
| **Leitura e estudo** | Citações, tempo de leitura, voz, acessibilidade e revisão espaçada. |
| **Inteligência artificial** | Dicionário, tradução, assistente, conexões, modelos e instruções. |

Pesquise uma opção como *cursor*, *imagem*, *criptografia* ou *numeração dos títulos* antes mesmo de visitar sua página. Os nomes anteriores continuam aceitos como termos de busca. Favorite as seções mais usadas para chegar a elas rapidamente.

Em **Geral → Recursos**, ligue ou desligue os recursos para escolher quais entradas e ações aparecem. As configurações continuam acessíveis, e desligar preserva os dados salvos. Algumas seções também têm interruptores próprios de funcionamento. Siga a indicação de reinício quando ela aparecer em **Compatibilidade**. Plugins externos mantêm suas próprias preferências e rotinas automáticas.

## Escreva, recupere e exporte

Abra **Projetos** ou a **Biblioteca** para criar um livro ou adicionar uma nota existente. Os capítulos continuam em arquivos Markdown separados. O ícone **Adicionar separador de arco** na barra de Cenas do Longform insere uma linha visual, com legenda opcional e movimento por arraste/toque. Os separadores ficam nas configurações do Basic por rascunho e não entram nas notas nem na compilação. A escrita contínua usa um editor por capítulo expandido; a gravação é explícita e verifica alterações concorrentes.

Use as abas com ícones em **Escrita**, **Universo** ou **Projeto** para abrir uma seção. Em telas estreitas, deslize a barra para o lado para ver as outras abas.

No celular, **Configurações do Basic → Geral → Comece por aqui → Barra de status no celular** controla a faixa abaixo da navegação. Ela reaproveita os indicadores nativos disponíveis e mostra indicadores do Basic, como contagem de palavras, modo do editor, tempo de leitura e Pomodoro. A faixa some enquanto o teclado virtual estiver aberto.

Em **Projetos → Escrita → Estrutura → Plano da história**, expanda a premissa em um parágrafo, uma sinopse e um tratamento. Marque as etapas como prontas quando quiser e revise as seguintes quando uma etapa anterior mudar. Em **Pistas**, vincule plantio, reforços e desfecho às cenas que já existem. A **Checagem** aponta cenas ausentes e pistas incompletas ou fora de ordem no rascunho ativo. **Exportar plano** cria uma nota Markdown separada sem alterar o manuscrito.

Abra **Projetos → Projeto → Revisão**, use o ícone de revisão em **Cenas** ou execute **Longform: abrir fila de revisão**. A fila mostra os comentários do rascunho ativo. Filtre por capítulo, pesquise no texto dos comentários ou nos trechos citados e alterne entre pendentes e resolvidos. Use **Comentar seleção** no editor para marcar um trecho ou **Comentar capítulo** para deixar uma nota sem citação. **Ir ao trecho** seleciona a passagem quando consegue identificá-la. Resolver ou reabrir um comentário não altera o manuscrito.

Rascunhos dos capítulos têm cópias locais de recuperação. Use **Livros: recuperar rascunhos** para conferir, salvar uma cópia Markdown separada ou descartar uma entrada. Se o original mudou, o rascunho fica separado para revisão. Recuperação e snapshots de versões têm propósitos diferentes; mantenha também um backup independente. Rascunhos temporários de sessão ficam em memória até serem salvos.

Para montar o manuscrito, use **Livros: compilar manuscrito Markdown**, escolha arquivos salvos ou escrita atual, confira a prévia e crie um novo arquivo em `Basic Exports/`. A compilação inclui todos os capítulos do rascunho selecionado, além do limite de editores exibidos. Capítulos ausentes ou versões conflitantes impedem a exportação. Atualize a prévia para incluir alterações posteriores.

A exportação opcional para DOCX, EPUB, HTML ou PDF no computador usa o **Pandoc** instalado separadamente; PDF também pode exigir um mecanismo compatível de renderização. Veja o [guia de primeiro uso](GETTING_STARTED.pt-BR.md#escreva-seu-primeiro-livro).

## Formate texto sem HTML

A barra do Basic usa Markdown e a sintaxe do próprio plugin. Selecione um trecho e use Sublinhado, Sobrescrito, Subscrito ou Spoiler para inserir `++texto++`, `^2^`, `~2~` ou `||texto||`. Cor do texto e Cor de destaque usam as cores exatas salvas no perfil de PC ou celular, como `!!{color-cf517f}texto!!` e `=={hex-ffd66a}texto==`. Mantenha as opções correspondentes ativadas em **Formatação de texto** para renderizar no modo de leitura e na Prévia ao vivo.

Por padrão, a tipografia automática transforma dois hífens em `–` e o terceiro em `—`, inclusive no começo do parágrafo. Pressione Backspace logo após a troca para recuperar os hífens digitados (por exemplo, `---` para um separador Markdown) ou a aspa reta. Se o editor criou um par de aspas, a aspa de fechamento que ele inseriu também é removida.

## Revise o ritmo da prosa

Use **Escrita: ritmo e repetições** para analisar uma seleção ou a nota atual. Veja a distribuição do tamanho das frases, as frases e os parágrafos mais longos e as palavras que se repetem. Toque num resultado para voltar ao trecho no editor. A análise ignora propriedades, títulos Markdown, blocos de código e comentários. Os números orientam a leitura e não alteram nem enviam a sua nota.

## Encontre seus sites salvos

No widget **Favoritos da web** da homepage, busque por nome, URL ou grupo, ou escolha um grupo no filtro. A busca é local e inclui todos os sites salvos, mesmo os que ficam fora da lista inicial de 12 links.

## Remarque uma tarefa

Abra **Tarefas: abrir painel** e use o ícone de calendário ao lado da tarefa. Escolha uma data ou use **Hoje**, **Amanhã**, **Em 7 dias** ou **Sem prazo** e salve. O painel atualiza os filtros e muda apenas o marcador de prazo na nota Markdown original.

## Plugins com suporte

As ferramentas próprias do Basic funcionam sem esses plugins. O painel de tarefas agora filtra **Hoje**, **Atrasadas**, **Próximos sete dias** e **Sem prazo** e permite adicionar uma tarefa a uma nota Markdown escolhida, com prévia. A leitura nativa pode começar **a partir do cursor**, e o foco de pastas aparece no menu do explorador, com a ação **Mostrar todas** no próprio painel. Os recursos mantêm seus interruptores normais.

Quando outro plugin está instalado e ativo, o Basic oferece o suporte abaixo. Esse suporte não instala o plugin, não copia suas configurações para o Basic nem substitui seu motor.

| Plugin | Suporte oferecido pelo Basic |
| --- | --- |
| **Ultimate Toolkit** | Organização dos controles flutuantes no mobile, prioridade de ícones do explorador e provedor de voz opcional, escolhido explicitamente, com o player do Toolkit. A voz online exige permissão separada. |
| **Snailkit** | Organização da barra lateral móvel, popups e controles de tarefas; aba de escrita do Basic pela API pública de tarefas; prévias e ações nativas quando disponíveis. As tarefas do Basic também funcionam sozinhas. |
| **LanguageTool** | Uso do editor correto, algumas preferências nativas, ações das sugestões e ajuste dos avisos em telas estreitas. O corretor integrado do Basic continua independente. |
| **Visual Kit** | Anotação de imagens, ações de imagem/área de transferência e painéis HTML nativos, preservando configurações e índice. Exclusivo do computador. |
| **dropit** | Comandos nativos explícitos de receber/enviar e processamento no computador. Pareamento e regras continuam no dropit. |
| **Syncthing Integration** | Janelas nativas de conflitos, diferenças e configuração. Esse plugin não é um motor de sincronização. |
| **Syncthing Manager** | Painel nativo, estado já disponível e ações explícitas de varredura/diagnóstico. Configuração do servidor e agendas permanecem no plugin. |
| **Obsidian Git** | Painéis nativos de controle de versão/histórico e comandos verificados conforme o backend ativo. No celular, depende do backend do próprio Git estar inicializado. |
| **FIT** | Comandos explícitos de sincronização/estado quando a versão instalada os oferece. Sem painel inventado nem sincronização automática. |

Não há uma página dedicada de **Integrações** nas configurações. A configuração completa de cada plugin continua nele. No Basic, o provedor de voz fica em **Leitura em voz alta**, a prioridade de ícones em **Explorador de arquivos** e a organização dos controles em **Arquivos e ferramentas**. IDs de comandos e preferências salvas são preservados. Comandos antigos de painéis continuam disponíveis para instalações existentes.

Consulte o [guia de suporte aos plugins](guides/companion-compatibility.pt-BR.md) para comportamento, uso de dados e limites de plataforma. Quando não há espaço seguro, controles secundários ficam temporariamente ocultos e retornam ao fechar a obstrução; isso não altera notas nem configurações dos plugins externos.

## Ferramentas Básicas · tradução e assistente

Na aba **Tradução**, traduza uma seleção, um texto colado ou um arquivo Markdown em uma cópia separada. Escolha DeepL, Google Tradutor (Cloud), Microsoft Translator, LibreTranslate ou um dos provedores de IA existentes. Configure tradutores dedicados em **Configurações → Basic → Inteligência artificial → Tradução**. DeepL e Google Cloud usam chaves das APIs oficiais. O Microsoft usa a região do recurso quando exigida. O LibreTranslate usa o endereço da sua instância e uma chave opcional. Você pode detectar o idioma de origem automaticamente ou inverter os idiomas selecionados. No LibreTranslate, os idiomas disponíveis dependem da instância.

No **Chat**, o provedor e o modelo ativos ficam visíveis. **Reescrever**, **Resumir** e **Explorar ideias** preparam instruções editáveis, sem enviar automaticamente. **Parar resposta** descarta a resposta pendente no painel e restaura o rascunho se o campo estiver vazio. O provedor ainda pode concluir uma solicitação já enviada.

## IA e serviços online opcionais

Configure a conexão em **Inteligência artificial → Conexões de IA** e escolha o modelo e as funções que o utilizam. O Basic oferece OpenAI, Gemini, Grok, Claude, Ollama, OpenRouter, Groq Cloud e endpoints personalizados compatíveis. Disponibilidade, acesso aos modelos e cobrança pertencem ao provedor escolhido. Chaves e testes de conexão ficam nas configurações; os testes são executados sob demanda.

Digitar no dicionário pesquisa as entradas Markdown salvas. **Definir palavra** ou Enter solicita uma definição online; **Salvar definição** guarda o resultado. A tradução tem provedor e idiomas próprios; traduzir um arquivo cria uma cópia Markdown separada. O assistente preserva a mensagem quando o envio falha. Sugestões de revisão alteram a nota quando você as aceita.

A revisão gramatical automática e a IA durante a digitação podem transmitir texto enquanto você escreve quando ativadas. Confira os controles antes de ligá-las. O guia explica [conexões e uso de dados](SUITES_AND_INTEGRATIONS.pt-BR.md#conexões-e-uso-de-dados) do LanguageTool, voz, rádio, citações, navegação e sincronização.

## Dados e privacidade

- Notas, projetos e edição local usam o cofre. Preferências e chaves de API ficam nas configurações locais do Basic; as chaves não estão em um gerenciador criptografado de credenciais.
- Recuperação, snapshots e cópias exportadas podem conter texto das notas sem criptografia. Proteja o cofre, os dados do plugin e os backups conforme sua necessidade.
- Notas protegidas criptografam o conteúdo de novos arquivos com AES-256-GCM. Os nomes continuam visíveis e senhas perdidas não são recuperáveis. Bloqueio da interface e foco de pastas oferecem privacidade visual, não criptografia dos arquivos.
- IA externa, revisão remota, voz online, rádio e imagens remotas usam serviços de rede. As vozes do navegador ou sistema operacional não têm funcionamento offline garantido.
- A sincronização opcional encaminha comandos para plugins instalados separadamente. Escolher um provedor no Basic não interrompe a sincronização automática de outro plugin.

Leia os [detalhes de segurança e uso dos dados](../SECURITY.md) antes de usar serviços externos ou notas criptografadas.

## Plataformas, ajuda e documentação

O Basic oferece suporte ao Obsidian no computador e no Android. Perfis de teclado, rádio web, pacotes de sons de digitação, redimensionamento de widgets no computador e exportação Pandoc têm requisitos de plataforma. A disponibilidade de voz depende do dispositivo, navegador e serviço. Capturas de uma janela estreita no computador não comprovam compatibilidade física de todos os recursos no Android; a validação no aparelho continua necessária.

- [Instalação e primeiros passos](GETTING_STARTED.pt-BR.md)
- [Guia de recursos, configurações e suporte](SUITES_AND_INTEGRATIONS.pt-BR.md)
- [Exemplos de blocos Markdown](BLOCKS.pt-BR.md): abas, fichas de universo, chat fictício, mídias, colunas, cronologias e navegação de capítulos. Os aliases existentes `writer-tabs`, `writer-avatar`, `writer-wiki`, `writer-post`, `writer-chat`, `writer-media-gallery` e `writer-folder-overview` continuam aceitos.
- [Histórico de versões](../CHANGELOG.md) e [documentação antiga](README_HISTORY.md). Os guias antigos podem usar nomes anteriores; use o guia atual para localizar configurações.
- [Relatar problema](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues): informe versões do Basic/Obsidian, plataforma e passos para reproduzir. Preserve suas chaves de API e manuscritos privados.
- [Contribuição](../CONTRIBUTING.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md) · [Licença MIT](../LICENSE.md)
