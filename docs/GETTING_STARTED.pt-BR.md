# Primeiros passos com o Basic

O Basic 13.7.0 requer Obsidian 1.11.4 ou superior. Este guia explica a instalação, a escolha de recursos e um primeiro fluxo de escrita. Para localizar todas as seções, consulte o [guia de recursos](SUITES_AND_INTEGRATIONS.pt-BR.md).

[English](GETTING_STARTED.en.md) · [README](README.pt-BR.md)

## Instale no computador ou no Android

1. Abra a [release estável mais recente do GitHub](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/latest).
2. Baixe `main.js`, `manifest.json` e `styles.css` na lista de **Assets**. Os três devem ser da mesma versão.
3. Dentro do cofre, crie `.obsidian/plugins/basic-ai-tool-for-writers/` e coloque os três arquivos diretamente nessa pasta.
4. No Obsidian, abra **Configurações → Plugins da comunidade**, permita plugins da comunidade se necessário e ative **Basic**.
5. Se o Basic não aparecer, recarregue o Obsidian e confira a pasta e os nomes dos arquivos.

No Android, use um gerenciador de arquivos que consiga acessar o cofre e mostrar a pasta oculta `.obsidian`. A localização do cofre depende de como ele foi criado. Recursos exclusivos do computador continuam sujeitos aos próprios limites de plataforma.

A estrutura deve ficar assim:

```text
Seu cofre/
└── .obsidian/
    └── plugins/
        └── basic-ai-tool-for-writers/
            ├── main.js
            ├── manifest.json
            └── styles.css
```

Os arquivos **Source code** do GitHub são cópias do repositório, não o pacote de instalação com três arquivos. Não deixe uma pasta extra entre `basic-ai-tool-for-writers/` e os arquivos.

## Escolha um ponto de partida

Uma instalação nova abre a **Configuração inicial** depois de carregar a área de trabalho:

| Ponto de partida | Quando usar |
| --- | --- |
| **Essencial** | Começar com escrita cotidiana, ferramentas de idioma e página inicial. |
| **Escrita de livros** | Incluir projetos, capítulos, navegação e ferramentas narrativas. |
| **Estudo** | Começar com estudo, leitura, citações e formatação. |
| **Personalizado** | Conferir a seleção atual e escolher os recursos individualmente. |

Um perfil preenche os interruptores propostos. Use **Buscar recurso…** e ajuste qualquer escolha antes de **Aplicar escolhas**. Essa tela não pede credenciais nem testa serviços. Aplicar escolhas não cria notas nem reorganiza o cofre. **Configurar depois** fecha a tela para continuar trabalhando.

Atualizar uma instalação existente não abre essa configuração automaticamente nem substitui suas escolhas. Para reabrir, use **Configuração inicial: abrir** na paleta de comandos ou o botão em **Geral → Comece por aqui**. Ao reabrir, a seleção parte dos recursos atuais.

No dia a dia, use **Geral → Recursos**. Desligar um recurso oculta suas entradas e ações relacionadas, preservando dados e preferências. Sua página de configuração continua acessível. Algumas páginas também têm interruptores próprios; siga a indicação de reinício quando ela aparecer nas opções avançadas de compatibilidade. Tarefas de outros plugins são independentes dessas escolhas.

## Pesquise e favorite configurações

Abra **Configurações → Basic**. Escolha categoria e seção ou pesquise uma opção antes de visitar a página. A busca aceita nomes atuais, nomes anteriores e os dois idiomas disponíveis.

Experimente *posição do cursor*, *aspas*, *PNG*, *numeração*, *criptografia*, *feed de calendário* ou *modelo*. Selecione um resultado para abrir a seção e localizar o controle. Favorite as seções que você usa mais; até 12 podem ficar salvas.

| Você quer… | Abra esta categoria e seção |
| --- | --- |
| Desligar ou ligar recursos | **Geral → Recursos** |
| Ajustar aspas ou substituições | **Escrita e edição → Digitação e tipografia** |
| Mudar atalhos de teclado | **Escrita e edição → Atalhos do editor** |
| Organizar a página inicial | **Aparência e painéis → Página inicial** |
| Configurar um livro | **Livros e projetos → Escrita de livros** |
| Ajustar revisões dos cartões | **Leitura e estudo → Estudos e revisão espaçada** |
| Configurar um provedor | **Inteligência artificial → Conexões de IA** |
| Conferir o estado local | **Geral → Diagnóstico e atalhos** |

O idioma da interface acompanha o português ou inglês do Obsidian. Outros idiomas do programa usam a interface em inglês. Os idiomas das respostas, traduções e revisões gramaticais são configurações independentes.

## Escreva seu primeiro livro

1. Ative os recursos de projetos em **Geral → Recursos** se a entrada estiver oculta.
2. Abra **Projetos** ou a **Biblioteca**. Crie um livro ou use **Adicionar livro** para incluir uma nota Markdown existente.
3. Adicione capítulos e subcapítulos. Organize-os pela lista ou pelo quadro de cenas. O índice guarda a ordem do projeto, e cada capítulo continua em um arquivo Markdown comum.
4. Abra **Escrita contínua**, expanda um capítulo e escreva. Use a ação de salvar quando terminar. Se outra aba ou o arquivo original mudou, confira as versões antes de tentar novamente.
5. Abra o capítulo em uma aba normal do Obsidian quando precisar do editor nativo completo. A escrita contínua mantém editores separados por capítulo expandido.

Para uma nota individual na biblioteca, você pode informar capa local e sinopse nas propriedades:

```yaml
---
title: Meu romance
banner: "[[Imagens/capa.webp]]"
description: Uma sinopse breve.
readingProgress: 25
---
```

O progresso dos projetos usa as informações dos capítulos; `readingProgress` é útil para um livro de nota única. A biblioteca também permite organizar séries e estantes.

### Recupere a escrita dos capítulos

As cópias de recuperação são separadas das notas originais e dos snapshots de versões. Use **Livros: recuperar rascunhos** para conferir o texto e o estado do original. Você pode salvar uma nova cópia Markdown ou descartar uma entrada explicitamente.

Rascunhos compatíveis podem retornar à escrita contínua após reiniciar. Se o original mudou, o rascunho fica separado para revisão. Salvar o capítulo continua sendo uma ação explícita. Desativar novas cópias de recuperação preserva as que já estão disponíveis. Rascunhos temporários de sessão têm outro ciclo: salve-os em notas se quiser mantê-los após fechar o aplicativo.

A recuperação armazena texto sem criptografia nos dados locais do Basic. Mantenha um backup independente e proteja os dados do plugin ao compartilhar ou sincronizar o cofre.

### Compile o manuscrito

Use **Livros: compilar manuscrito Markdown** e escolha o livro. Selecione a origem do texto:

- **Arquivos salvos** usa as versões gravadas em disco.
- **Escrita atual** inclui rascunhos de capítulos compatíveis e texto dos editores abertos. Versões conflitantes ou capítulos ausentes precisam de revisão.

A prévia guarda o texto escolhido no momento da preparação. Atualize-a para incorporar edições posteriores. A compilação inclui todos os capítulos do rascunho selecionado, mesmo que o editor de escrita contínua mostre menos capítulos. Confirme para criar um novo arquivo Markdown completo em `Basic Exports/`; os capítulos existentes continuam em seus lugares.

Exportar DOCX, EPUB, HTML ou PDF é uma ação opcional separada para computador em **Markdown e formatação → Listas e blocos avançados**. Ela requer o executável Pandoc instalado; PDF pode precisar de outro mecanismo de renderização, como LaTeX. O Pandoc pode acessar recursos referenciados pelo documento. Confira as opções de exportação e os [detalhes de segurança](../SECURITY.md) antes de usar.

## Adicione IA quando precisar

1. Abra **Inteligência artificial → Conexões de IA** e escolha o provedor.
2. Informe chave e endpoint quando exigidos. O Ollama usa o servidor configurado; a maioria dos provedores hospedados precisa de conta e acesso por API.
3. Escolha o modelo em **Modelos de IA**. Buscar um catálogo ou testar uma conexão contata o serviço escolhido quando você solicita.
4. Associe a conexão ao dicionário, tradutor, assistente ou revisores. Cada função pode usar provedores e modelos diferentes.
5. Experimente um texto curto. Confira o resultado antes de aceitar uma edição ou salvar uma definição.

É possível usar o dicionário Markdown salvo sem chave de IA. Digitar em **Definições** faz a busca local; **Definir palavra** ou Enter solicita um resultado online. O arquivo do dicionário é criado ao salvar a primeira definição.

Na tradução, escolha os idiomas de origem e destino e use a ação de traduzir. A tradução de arquivo salva uma cópia Markdown separada ao lado dele. O assistente aceita anexos de referência; o texto deles faz parte do material enviado ao provedor escolhido. Se o envio falhar, a mensagem fica disponível para tentar novamente.

A revisão com LanguageTool tem endpoint e idioma próprios em **Revisão e versões → Revisão gramatical**. Quando ativada, a verificação automática envia texto após uma pausa na digitação enquanto o painel de revisão está ativo. A IA durante a digitação também precisa ser configurada antes de enviar texto enquanto você escreve. Mantenha esses recursos desligados quando não desejar essas solicitações.

## Experimente uma nota local de estudo

Ative o recurso de estudo e crie uma nota Markdown assim:

```markdown
#flashcards

O que conduz o objetivo do protagonista?::O conflito da cena.
Antes da revelação:::Depois da revelação
```

Abra a área de estudos para revisar os cartões. `::` cria um cartão direto; `:::` cria cartões nos dois sentidos. As configurações oferecem opções de agendamento; o guia de recursos descreve o escopo e a troca por TSV.

## Atualize, desative ou remova

Para atualizar manualmente, substitua `main.js`, `manifest.json` e `styles.css` pela mesma versão da release e recarregue o Obsidian. Confira a versão instalada em **Geral → Diagnóstico e atalhos**. Um commit no GitHub não atualiza os arquivos já instalados no cofre.

Para reduzir a interface, use **Geral → Recursos** em vez de apagar os dados do plugin. Para interromper o Basic por completo, desative-o em **Plugins da comunidade**. Faça backup da pasta do Basic antes de desinstalar se precisar das preferências, recuperação de capítulos, progresso de estudos ou outros dados do plugin. As notas Markdown comuns continuam no cofre; blocos personalizados precisam do Basic ativado para sua visualização avançada.

## Se algo sumir ou falhar

| Sintoma | O que conferir |
| --- | --- |
| O Basic não aparece nos plugins da comunidade | Confira os três nomes de arquivo, a pasta exata e recarregue. |
| Um painel ou uma ação está oculta | Confira **Geral → Recursos**, o interruptor próprio da seção e os requisitos de plataforma. As configurações continuam acessíveis. |
| Um recurso avançado ainda usa o estado anterior | Leia **Geral → Compatibilidade** e reinicie quando solicitado. |
| A IA falha | Confira provedor, acesso ao modelo, endpoint e limites da conta. Teste a conexão sob demanda; preserve suas chaves ao pedir ajuda. |
| A revisão envia texto quando você não espera | Confira o interruptor automático e o endpoint em **Revisão gramatical**. |
| Um capítulo não salva ou não compila | Confira outros editores abertos, rascunhos recuperados e a nota original; guarde uma cópia separada de versões conflitantes. |
| Voz ou rádio não funciona | Confira dispositivo/navegador, rede, serviço e limites de plataforma. As vozes do sistema podem variar entre aparelhos. |
| Falta um comando de sincronização externo | Instale e ative a integração separadamente; preferências e credenciais continuam no plugin externo. |

Para um problema reproduzível, abra uma [issue](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues) com versões do Basic/Obsidian, dispositivo e passos. Preserve chaves e textos privados. Mais detalhes: [recursos e integrações](SUITES_AND_INTEGRATIONS.pt-BR.md), [blocos](BLOCKS.pt-BR.md), [segurança](../SECURITY.md) e [créditos de terceiros](../THIRD_PARTY_NOTICES.md).
