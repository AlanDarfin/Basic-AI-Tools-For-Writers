# Basic

**Um espaço de escrita no Obsidian: planeje, escreva, revise e organize seu trabalho em Markdown.**

**Versão:** 13.8.0 · **Requer:** Obsidian 1.11.4+ · **Plataformas:** Computador e Android · **Licença:** MIT

[Read in English](../README.md) · [Primeiros passos](GETTING_STARTED.pt-BR.md) · [Recursos e integrações](SUITES_AND_INTEGRATIONS.pt-BR.md)

O Basic reúne escrita de capítulos, planejamento de histórias, edição, uma página inicial configurável e IA opcional dentro do seu cofre. As notas continuam sendo arquivos Markdown comuns, com suas pastas, links e propriedades. Escolha os recursos que usa e deixe os demais fora dos menus.

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
| **Revisar textos** | Análise local de repetições, dicionário ortográfico pessoal, LanguageTool opcional, comparação de versões e snapshots. |
| **Usar IA quando precisar** | Definições, tradução, conversa, reescrita e comentários editoriais, com escolha de provedor e modelo por função. |

O [guia de recursos](SUITES_AND_INTEGRATIONS.pt-BR.md) reúne as seções atuais de configuração, ações, conexões e limites.

## Encontre as configurações pelo que quer fazer

As categorias acompanham o trabalho que você está realizando:

| Categoria | Exemplos |
| --- | --- |
| **Geral** | Configuração inicial, Recursos, Perfis de escrita, Diagnóstico, integrações e compatibilidade. |
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

Abra **Projetos** ou a **Biblioteca** para criar um livro ou adicionar uma nota existente. Os capítulos continuam em arquivos Markdown separados. **+ Separador** no Longform adiciona uma linha visual de arco, com legenda opcional e movimento por arraste/toque. Os separadores ficam nas configurações do Basic por rascunho e não entram nas notas nem na compilação. A escrita contínua usa um editor por capítulo expandido; a gravação é explícita e verifica alterações concorrentes.

Rascunhos dos capítulos têm cópias locais de recuperação. Use **Livros: recuperar rascunhos** para conferir, salvar uma cópia Markdown separada ou descartar uma entrada. Se o original mudou, o rascunho fica separado para revisão. Recuperação e snapshots de versões têm propósitos diferentes; mantenha também um backup independente. Rascunhos temporários de sessão ficam em memória até serem salvos.

Para montar o manuscrito, use **Livros: compilar manuscrito Markdown**, escolha arquivos salvos ou escrita atual, confira a prévia e crie um novo arquivo em `Basic Exports/`. A compilação inclui todos os capítulos do rascunho selecionado, além do limite de editores exibidos. Capítulos ausentes ou versões conflitantes impedem a exportação. Atualize a prévia para incluir alterações posteriores.

A exportação opcional para DOCX, EPUB, HTML ou PDF no computador usa o **Pandoc** instalado separadamente; PDF também pode exigir um mecanismo compatível de renderização. Veja o [guia de primeiro uso](GETTING_STARTED.pt-BR.md#escreva-seu-primeiro-livro).

## Conecte os plugins instalados

**Geral → Integrações e sincronização** conecta painéis nativos, algumas configurações e comandos disponíveis do Ultimate Toolkit, Visual Kit, Snailkit, dropit, Syncthing, Git, FIT e LanguageTool. Cada conexão pode ser desligada. Escolha a leitura do Toolkit explicitamente; o Basic permanece como padrão, com permissão separada para voz online do Toolkit. Os controles móveis evitam sobreposições detectadas, e a prioridade de ícones controla decorações duplicadas no explorador. Visual Kit funciona só no computador; Git no celular depende do backend dele.

Consulte o [guia de plugins conectados](guides/companion-compatibility.pt-BR.md) para configuração, voz, gramática, uso de dados e limites de plataforma.

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
- [Guia de recursos, configurações e integrações](SUITES_AND_INTEGRATIONS.pt-BR.md)
- [Exemplos de blocos Markdown](BLOCKS.pt-BR.md): abas, fichas de universo, chat fictício, mídias, colunas, cronologias e navegação de capítulos. Os aliases existentes `writer-tabs`, `writer-avatar`, `writer-wiki`, `writer-post`, `writer-chat`, `writer-media-gallery` e `writer-folder-overview` continuam aceitos.
- [Histórico de versões](../CHANGELOG.md) e [documentação antiga](README_HISTORY.md). Os guias antigos podem usar nomes anteriores; use o guia atual para localizar configurações.
- [Relatar problema](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues): informe versões do Basic/Obsidian, plataforma e passos para reproduzir. Preserve suas chaves de API e manuscritos privados.
- [Contribuição](../CONTRIBUTING.md) · [Créditos de terceiros](../THIRD_PARTY_NOTICES.md) · [Licença MIT](../LICENSE.md)
