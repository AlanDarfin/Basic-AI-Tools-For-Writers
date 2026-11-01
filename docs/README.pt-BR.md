# Basic AI Tool for Writers

**Versão atual:** 7.0.0 estável · **Obsidian:** 1.11.4+ · **Plataformas:** computador e Android · **Licença:** MIT

**Idiomas:** português brasileiro e inglês. [English README](../README.md).

Uma central compacta de escrita com Longform, Compêndio de universos, planejamento de cenas, Timeline, dicionários, tradução, ferramentas Markdown e IA opcional.

## Novidades da versão 7.0.0

A versão estável reúne as duas betas e a RC. Os novos recursos continuam usando os arquivos Markdown e os índices Longform existentes, sem bancos de dados duplicados.

| Área | Melhorias |
| --- | --- |
| **Escrita** | Árvore de capítulos recolhível, reordenação por toque, Quadro em Cartões/Kanban/Lista, matriz de tramas, modelos narrativos, análise de ritmo e ligações de preparação/consequência. |
| **Universo** | Compêndio por tags personalizadas, pastas e Folder Notes; fichas editáveis de personagens, locais e itens, templates próprios, relações, retratos, Galeria e mapas com imagens do cofre. |
| **Timeline** | Trilhas, ramificações, marcos, Gantt simples, calendário fictício por projeto com meses personalizados e correção da ordem de datas entre anos. |
| **Projetos** | Organizador de séries de livros que agrupa e reordena índices Longform **sem mover arquivos ou alterar capítulos**. Metas, sessões, tarefas e compilação continuam integradas. |
| **Interface** | Navegação compacta em **Escrita / Universo / Projeto** e layouts responsivos para telas estreitas. |
| **Ferramentas** | Gramática, dicionários, leitura em voz alta, snapshots, Unicode, edição e exportação opcional com Pandoc no desktop. |

**[Notas completas da 7.0.0](V7_RELEASE.pt-BR.md) · [English](V7_RELEASE.en.md) · [Baixar ZIP](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/download/7.0.0/Basic-AI-Tool-for-Writers-7.0.0.zip)**

**Segurança dos dados:** excluir uma série não apaga livros. Tags herdadas de Folder Notes afetam somente os filtros, não os arquivos. As fichas utilizam a API nativa de propriedades. A memória narrativa para IA continua desligada por padrão. Trocar o calendário modifica a ordenação visual, mas não altera as datas nas notas.

**Antes de atualizar:** faça backup do cofre e do data.json. A troca dos três arquivos da release não deve substituir as configurações salvas. O diretório da comunidade do Obsidian exige aprovação separada; uma release no GitHub não garante a publicação na comunidade.

**Histórico:** [5.2.0](V5_2_RELEASE.md), [6.0.1](V6_0_1_RELEASE.pt-BR.md), [7.0.0-rc.1](V7_RC1.pt-BR.md), [beta.2](V7_BETA2.pt-BR.md), [beta.1](V7_BETA1.pt-BR.md). Notas antigas continuam na pasta [docs](./).

## Tudo o que o plugin oferece

| Área | Funcionalidades |
| --- | --- |
| **Dicionário** | Verbete local em Markdown, busca online opcional, dicionários Yomitan, definições, sinônimos, antônimos e salvamento de resultados. |
| **Tradução** | Seletor de idioma de origem e destino, detecção automática quando solicitada, provedor independente e prompts editáveis. |
| **Assistente** | Chat de escrita, contexto do trecho selecionado e modelos/provedores de IA configuráveis. |
| **Revisão** | LanguageTool, erros destacados no texto, revisão de estilo por IA, comparação Diff e aceitação seletiva. |
| **Longform** | Projetos, capítulos e cenas hierárquicas, rascunhos, reordenação por arrastar/toque/setas, metas, sessões, notas, tarefas, comentários e compilação. |
| **Produtividade** | Autocomplete local, variantes, snippets de abreviações, menções, Unicode, templates por nome, sumário instantâneo e máquina de escrever. |
| **Versões** | Snapshots por nota, histórico, diferenças, restauração e backup preventivo. |
| **Leitura** | TTS local via Web Speech quando disponível e leitura neural online com permissão. |
| **Personalização** | 23 categorias de módulos opcionais, interface adaptada ao celular e diagnóstico integrado. |

## Novidades da versão 5.0.0

A v5 amplia a suíte de escrita com cinco áreas de produtividade:

- **Keyshots:** movimentar, duplicar e organizar linhas, adicionar cursores e escolher atalhos estilo VS Code/JetBrains (somente desktop).
- **Extended Markdown Syntax:** sublinhado, spoiler, sobrescrito/subscrito, destaques coloridos, classes e blocos especiais.
- **Pandoc Syntax:** listas especiais, definições, exemplos numerados, rótulos, blocos e índice navegável.
- **Easy Typing:** Tab e Backspace inteligentes, colagem em listas, capitalização e espaçamento opcionais, substituições literais e regras regex opt-in, além de modelos de texto com navegação por Tab.
- **Smart Typography:** aspas curvas, travessões, reticências, setas, comparações, frações opcionais e conversão da seleção.

Também há **exportação Pandoc opcional no desktop** para DOCX, HTML, EPUB, ODT, PDF, LaTeX e texto simples. Requer o programa Pandoc instalado; PDF pode depender de um motor adicional. Os arquivos exportados são cópias, sem sobrescrever a nota.

Cada módulo continua independente e configurável, e a antiga Editing Toolbar **não voltou**.

## Módulos opcionais

Acesse **Configurações → Basic AI Tool for Writers → Módulos** para ocultar recursos que não usa. Por exemplo, desligar **Tradutor** remove a aba e os atalhos correspondentes, sem apagar idiomas, prompts ou qualquer outro dado. É possível reativar posteriormente.

As 23 categorias disponíveis são:

1. Dicionário e definições
2. Tradutor
3. Assistente de escrita
4. Revisão e LanguageTool
5. Longform e projetos
6. Ferramentas de escrita
7. Autocomplete
8. Variantes
9. Diff e perfis
10. Histórico de versões
11. Leitura em voz alta (TTS)
12. Unicode
13. Templates e sumário
14. Menções
15. Comentários
16. Ações de escrita com IA
17. Máquina de escrever
18. Memória de posição do cursor
19. Keyshots (atalhos e navegação)
20. Sintaxe Markdown estendida
21. Sintaxe Pandoc
22. Easy Typing (digitação inteligente)
23. Smart Typography (tipografia inteligente)

Ocultar **Histórico de versões** esconde acessos na interface, mas não remove os backups preventivos ou snapshots existentes. As configurações e dados persistem.

## Projetos e Longform

O gerenciador é uma implementação própria inspirada no [Longform](https://github.com/kevboh/longform), com compatibilidade com alguns conceitos do índice YAML. Não é uma réplica de todos os fluxos de trabalho do plugin original.

**Cenas e capítulos:** títulos aninhados, indicação clara dos níveis, variantes/rascunhos e movimentação por arrastar no PC, por toque no Android ou pelas setas. A lista mantém a rolagem ao mudar a ordem dos capítulos.

**Projeto:** metas diárias e totais de palavras, contagem de palavras, sessões de escrita baseadas em alterações salvas, alertas de cenas ausentes e controle de cenas não indexadas.

**Notas e tarefas:** pastas de notas do projeto, notas rápidas, pesquisa, tarefas e comentários ligados a trechos da escrita — com localização, resolução, reabertura e exclusão.

**Compilação:** etapas ordenáveis, presets e prévia. Pode concatenar o manuscrito, remover frontmatter/links/comentários, adicionar títulos e números e gerar uma nova nota. Há proteção contra caminhos perigosos e sobrescrita do texto original. Scripts JavaScript externos importados de fluxos Longform **não são executados**.

O conteúdo da aba inativa não precisa ser renderizado, reduzindo trabalho em projetos extensos.

## IA, dicionário e tradução

### Provedores compatíveis

**OpenAI, Gemini, Grok (xAI), Claude (Anthropic), Groq Cloud, OpenRouter, Ollama** e servidores **compatíveis com a API da OpenAI**.

As ferramentas podem usar provedores diferentes, conforme a configuração. Modelos remotos podem cobrar pelo uso. O Ollama local precisa estar acessível ao dispositivo: `localhost` no celular não aponta para o computador.

### Dicionário e sinônimos

As buscas podem aproveitar dicionário Markdown local (arquivo padrão: `Dicionario.md`), fontes online configuradas e importações de dicionários compatíveis com Yomitan. Definições, sinônimos e antônimos são apresentados com Markdown; novos verbetes podem ser salvos localmente sem sobrescrever entradas existentes.

### Tradução

Escolha o idioma de destino e, se quiser, o idioma original. Com a origem em **Automático**, o modelo tenta identificar a língua ao clicar em **Traduzir**. Também é possível editar os prompts e usar uma configuração específica de provedor para tradução.

### IA para escrita

Há ações para melhorar estilo, encurtar, expandir, simplificar, mudar tom, revisar diálogos, corrigir gramática, encontrar pontos fracos e explorar alternativas. A revisão seletiva apresenta o **Diff**, com proteções para a estrutura Markdown e possibilidade de aceitar ou rejeitar mudanças.

## Revisão e produtividade

- **LanguageTool:** sugestões de ortografia/gramática, destaque no editor, regras ignoradas opcionalmente e proteção da sintaxe Markdown.
- **Revisão automática:** com a aba Revisão aberta em modo Gramática, aguarda uma pausa após digitar (3,5 segundos por padrão; ajustável de 2 a 15 segundos), aplica intervalos mínimos entre solicitações e descarta respostas antigas. Capítulos enormes são analisados em uma janela próxima ao cursor, com indicação de análise parcial.
- **Autocomplete:** sugestões provenientes da nota atual, arquivos do cofre, dicionários e links; índice local, limites e pastas excluídas.
- **Variantes:** alternativas inline, navegação entre versões de uma expressão e geração de novas propostas por IA.
- **Snapshots:** histórico próprio em `.basic-ai-history/`, versões manuais e automáticas opcionais, diferenças e restauração segura. Históricos de plugins externos não são modificados.
- **Formatação nativa:** use os comandos Markdown e a barra móvel do próprio Obsidian. O Basic AI mantém os **comandos independentes de escrita com IA**, mas não oferece mais barra nem comandos extras de formatação.
- **Extras:** TTS, Unicode com pesquisa/favoritos, menções a arquivos, abreviações, títulos alternativos, preferências de visualização, templates por nome de nota, sumário instantâneo e modo máquina de escrever.

## Leitura em voz alta

É possível usar vozes do **sistema / navegador** quando a API Web Speech estiver exposta. Há também opção de vozes neurais online, com autorização explícita antes do envio do texto ao serviço.

**Limite no Android:** mesmo com um leitor instalado no telefone, o WebView do Obsidian pode não fornecer acesso a essas vozes. O plugin não consegue garantir a leitura nativa em todos os aparelhos. O leitor online requer conexão e depende de um serviço externo que pode mudar ou ficar indisponível.

## Instalação e atualização

1. Baixe o [ZIP da 7.0.0](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/download/7.0.0/Basic-AI-Tool-for-Writers-7.0.0.zip).
2. Extraia os arquivos **`main.js`**, **`manifest.json`** e **`styles.css`** para:

   ```text
   <seu cofre>/.obsidian/plugins/basic-ai-tool-for-writers/
   ```

3. Ative **Basic AI Tool for Writers** em **Configurações → Plugins da comunidade**, ou recarregue o plugin após atualizar.
4. Configure provedores e módulos como preferir.

**Faça backup do cofre e da pasta do plugin antes de atualizar.** Não exclua nem sobrescreva o `data.json`: ele contém opções, prompts e chaves. Para voltar a uma versão anterior, restaure seus arquivos e o backup das configurações, se necessário.

## Privacidade e segurança

- **Provedores de IA:** trechos enviados às funções de IA vão para o provedor escolhido. Os serviços podem ter custos e políticas próprias.
- **LanguageTool:** a análise automática envia o texto ao servidor configurado, somente enquanto a revisão está ativa.
- **TTS online:** transmite texto ao serviço somente depois do consentimento.
- **Diagnóstico:** mostra versão, plataforma, recursos ativos, estado dos provedores, LanguageTool, histórico e disponibilidade da API de voz. Não faz consultas externas nem revela chaves completas.
- **Chaves:** ficam armazenadas no `data.json` do Obsidian **sem criptografia adicional**. Não publique esse arquivo nem o sincronize com dispositivos não confiáveis.
- **Backups:** use sempre cópias de segurança do cofre antes de mudanças grandes ou compilações.

## Idiomas da interface

O Basic AI utiliza a língua configurada no Obsidian e disponibiliza sua interface em **português brasileiro e inglês**, com inglês como alternativa para os demais idiomas.

**Na v4.1.0, foi concluída a revisão da tradução inglesa dos controles integrados**, incluindo Longform, compilação, variantes, snapshots, mensagens de erro, autocomplete e revisão seletiva. Um teste automatizado evita a volta de rótulos antigos sem tradução.

Os nomes dos seus projetos, notas e fluxos personalizados permanecem no idioma escolhido por você. Identificadores antigos como `Padrão` e `Principal` continuam preservados internamente para não quebrar o histórico, mas aparecem com equivalentes ingleses nos seletores. A ferramenta de Tradução de textos funciona separadamente, conforme o modelo escolhido.

## Desenvolvimento e documentação

A distribuição normal usa main.js, gerado a partir dos módulos de src/v3 até src/v7 e do gerenciador Longform em projects.js.

```sh
npm run build
npm run check
```

Documentos úteis:
- [Lançamento estável da v4.1 e internacionalização](V4_1_RELEASE.md)
- [Referência de migração v4.0](V4_RELEASE.md)
- [Writing Suite: TTS, Unicode, templates e extras](WRITING_SUITE.md)
- [Guia técnico da v3](V3.md)
- [Checklist da RC1](V4_RC1_CHECKLIST.md)
- [Histórico do README](README_HISTORY.md)
- [Créditos de terceiros](../THIRD_PARTY_NOTICES.md)

**Autor:** Alan Darfin · [Repositório](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers) · [Releases](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases) · [Reportar problemas](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/issues). A licença do projeto é MIT.
