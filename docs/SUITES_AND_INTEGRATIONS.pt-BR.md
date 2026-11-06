# Guia das suítes e integrações · Basic 12.0.1

Este guia descreve as funções **realmente implementadas no Basic**, não uma cópia completa dos projetos originais. Os arquivos continuam no cofre Obsidian; configurações antigas são preservadas.

## Como localizar as configurações

Abra **Configurações do Obsidian → Basic**. Use as abas superiores ou a pesquisa. As opções recentes foram distribuídas em **Toolkit v12** e **Suítes**. As abas antigas de Arquivos e atalhos não duplicam mais a configuração das suítes.

| Aba superior | Subabas | O que configurar |
| --- | --- | --- |
| **Toolkit v12** | Visão geral, Escrita e atalhos, Imagens, Tarefas e Inbox, Privacidade, Leitura e voz, Integrações e sync | Funcionalidades novas, seus interruptores, limites e comandos |
| **Suítes** | Unique Suite, Notion Suite, Number Suite, Longform Studio | Configurações herdadas das versões 10.11 e 11 |
| **Interface** | Homepage, explorador, propriedades visuais, barra de edição, som e estilos | Aparência sem duplicar controles |
| **Organização** | Spaces, calendário, Flow, Pomodoro, rascunhos, bloqueio visual e arquivos | Fluxos de trabalho |
| **Escrita** | Digitação, Markdown, widgets, modelos, linter e navegação | Ferramentas da nota |
| **Longform** | Projetos, biblioteca, tarefas, BookNav, conteúdo virtual e mundo | Ferramentas narrativas |
| **IA e dicionário / Revisão** | Modelos, provedores, prompts, gramática, TTS e versões | Modelos e avaliação de textos |

A pesquisa das configurações funciona também para termos como *numeração*, *tarefas*, *criptografia*, *sincronização*, *imagens* e *subescrito*.

## Suítes adicionadas nas versões 10.11 e 11

| Projeto original | Recursos no Basic | Limite da integração |
| --- | --- | --- |
| [Unique Suite](https://github.com/Benhaman9/unique-suite) | Central de estudos; criação de notas de **aulas**, **diário** e **lembretes**; horários por semestre/pasta; resumo da rotina acadêmica; bloco de horário inserido no Markdown | Não copia toda a experiência acadêmica, nem reestrutura o cofre sem confirmação |
| [Notion Suite](https://github.com/navysum/notion-suite) | Bancos sobre notas Markdown, com visualizações de **tabela, quadro, galeria, lista, calendário, timeline e gráfico**; colunas, ordenação, agrupamento, filtros, limite de registros, propriedades tipadas e construtor visual de blocos | Não cria banco proprietário e não replica todos os recursos da interface do Notion |
| [Number Suite](https://github.com/ZHYX91/obsidian-number-suite) | Sumário de títulos e números; escrita/remoção explícita de numeração; esquema hierárquico; numeração visual no Live Preview; contadores de legendas e estrutura com títulos, figuras, tabelas, equações, código e notas de rodapé | Não altera os títulos no Live Preview automaticamente, a menos que o usuário utilize o comando que grava numeração |
| **Longform Studio v11** (extensão do Basic) | Escrita contínua dentro do Longform padrão, busca por capítulos, revisão editorial, compilar manuscrito e diagnóstico de compatibilidade; notas originais mantidas | Não gera um segundo sistema de projetos ou um widget paralelo no homepage |

## Recursos incorporados na versão 12

| Projeto de referência | Recursos nativos no Basic ou reaproveitados | O que ainda exige o plugin original |
| --- | --- | --- |
| [Ultimate Toolkit](https://github.com/ahmdmusa/obsidian-toolkit) | Paleta de **65 ações**, callouts, divisórias e modelos; foco temporário em pasta; TTS e IA existentes reaproveitados; leitura contextual de seleção; notas individuais criptografadas | Cofre de **pastas** criptografadas, ocultação de nomes e índice, TTS bilíngue completo para PDFs/HTML e HUD integral de imagens |
| [Visual Kit](https://github.com/pedrohf-dev/visual-kit) | Lightbox; largura de imagens com confirmação; anotar com caneta, seta, retângulo, texto e cobertura de área; resultado como **novo PNG** | Editor HTML avançado, rich copy/paste e deduplicação de anexos; o plugin original é só de PC |
| [Snailkit](https://github.com/arnaudgastelblum/snailkit) | Tarefas por etiquetas, filtragem e marcação protegida contra edições concorrentes; Inbox, brainstorm e extração de trechos para notas vinculadas; reaproveita calendário e pesquisa do Basic | Exportadores próprios, Workbench e ferramentas completas de edição |
| [dropit](https://github.com/smart-kits/dropit-obsidian) | Captura de texto em pasta Inbox local e central que detecta seus comandos quando instalado | Pareamento, servidor/transferência de dispositivos, recebimento automático |
| [Syncthing Integration](https://github.com/LBF38/obsidian-syncthing-integration) | Detecção, execução manual de comandos e inspeção local de conflitos | APIs e sincronização reais do Syncthing |
| [Syncthing Manager](https://github.com/gustjose/obsidian-syncthing-manager) | Mesma central de comandos e leitura de arquivos de conflito sem os alterar | Monitoramento remoto, versionamento, resolução/mescla e edição do servidor Syncthing |
| [Obsidian Git](https://github.com/Vinzent03/obsidian-git) | Encaminhamento **manual** dos comandos disponíveis quando o plugin está ativo | Push/pull, histórico e Git interno |
| [FIT](https://github.com/joshuakto/fit) | Seleção como provedor de sync manual e execução de comandos do FIT instalado | Sincronização GitHub, autenticação e tratamento remoto dos conflitos |

## Atalhos de ribbon e menus móveis

O ribbon próprio do Basic continua com **Assistente, Projetos e Ferramentas**. A 12.0.1 acrescenta o botão **Basic: ações rápidas**, que abre leitura, paleta, foco de tela, foco de pasta e integrações. Os botões *Read Aloud*, *Formatting Palette*, *Fullscreen Note* e *Focus on current folder* mostrados pelo Ultimate Toolkit original **pertencem àquele plugin** e não podem ser consertados alterando o Basic; use os equivalentes do Basic para ações independentes.

Na barra lateral do Basic, o botão **Mais opções** repassa as ações nativas após fechar o menu anterior, evitando dois pop-ups disputando o foco. **Marcador** tenta usar o comando do plugin Bookmarks, se registrado; caso contrário, repassa a ação ao botão nativo. É possível manter uma aba pressionada para fixá-la, fechá-la ou fechar outras não fixadas.

## Segurança e limitações

- A proteção AES-256-GCM da v12 é **por nova nota**, não por pasta; senhas não são recuperáveis, e nomes de arquivo continuam visíveis.
- O editor de imagem cria uma cópia: a foto original permanece armazenada e pode mostrar regiões que foram cobertas na anotação.
- A central de sincronização não suspende operações automáticas já configuradas em Syncthing, Git ou FIT. Mantenha somente um mecanismo automático por cofre.
- Configurações de programas externos permanecem nos plugins de origem. Não copie credenciais para o Basic.
- Testes automatizados verificam código e regressões; interface real em diferentes versões de Android e temas exige validação no dispositivo.

Consulte também [cobertura da v12](V12_SCOPE.pt-BR.md) e [segurança](../SECURITY.md).
