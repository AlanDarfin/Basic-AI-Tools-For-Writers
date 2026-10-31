# Basic AI Tool for Writers — Português (Brasil)

**Atualização 4.1.1:** correções para o verificador CSS do Obsidian, preservando a interface compacta no celular. Tag sem prefixo `v`.

[English / README principal](../README.md) · [Release estável 4.3.0](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/tag/4.3.0)

Um ambiente de escrita personalizável para o [Obsidian](https://obsidian.md), que reúne dicionário, tradução, IA, revisão gramatical, projetos inspirados no Longform, histórico de versões e ferramentas de produtividade.

**Versão atual:** 4.3.0 estável · **Obsidian:** 1.11.4 ou superior · **Plataformas:** desktop e dispositivos móveis · **Licença:** MIT.

**Na 4.2.0:** o realce da linha atual no modo Máquina de Escrever agora segue diretamente o cursor do CodeMirror, inclusive no Android. A nova memória de posição salva cursor, seleção e rolagem de cada nota localmente.

**Novidades da 4.3.0:** removemos a Editing Toolbar, os controles flutuantes para PC e celular, os comandos extras de formatação Markdown e suas configurações. Para formatar texto, use as ferramentas nativas do Obsidian. Os comandos independentes de escrita com IA, o modo Máquina de Escrever e a memória do cursor continuam disponíveis.

**Para configurar:** abra **Configurações → Basic AI Tool for Writers → Posição do cursor**. Você pode ativar/desativar o recurso, escolher se deseja restaurar seleção e rolagem, definir um limite de notas (500 por padrão), limpar os registros salvos e usar comandos para restaurar ou esquecer a posição da nota atual. Links com âncoras não têm seu destino substituído pela memória. O código é uma integração independente inspirada no plugin [Remember cursor position](https://github.com/dy-sh/obsidian-remember-cursor-position), sem precisar instalá-lo.

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
| **Personalização** | 17 categorias de módulos opcionais, interface adaptada ao celular e diagnóstico integrado. |

## Módulos opcionais

Acesse **Configurações → Basic AI Tool for Writers → Módulos** para ocultar recursos que não usa. Por exemplo, desligar **Tradutor** remove a aba e os atalhos correspondentes, sem apagar idiomas, prompts ou qualquer outro dado. É possível reativar posteriormente.

As 17 categorias disponíveis são:

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

1. Baixe o [ZIP da 4.3.0](https://github.com/AlanDarfin/Basic-AI-Tools-For-Writers/releases/download/4.3.0/Basic-AI-Tool-for-Writers-4.3.0.zip).
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

A distribuição normal usa o `main.js`, montado a partir dos arquivos de `src/v3/`, `src/v4/` e do gerenciador `projects.js`.

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
