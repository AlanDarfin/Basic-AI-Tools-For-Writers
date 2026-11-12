# Plugins conectados

[English](companion-compatibility.md)

O Basic se conecta a plugins da comunidade instalados separadamente. Primeiro instale e ative o plugin original; depois abra **Configurações → Basic → Geral → Integrações e sincronização** ou **Plugins conectados** na paleta de comandos. A central mostra o plugin ativo, os comandos disponíveis e o acesso às configurações originais.

Você pode desligar todas as integrações, desativar a conexão de um plugin, ocultar o atalho do Basic ou escolher onde os painéis abrem. Desligar uma conexão preserva os dados e as preferências dos dois plugins. Isso não desliga o plugin externo nem muda suas rotinas automáticas.

## Painéis e configurações

Um painel abre na lateral escolhida ou em uma aba nova; um painel já aberto é reutilizado. Comandos que abrem uma janela continuam usando essa janela. Módulos desligados, comandos não registrados e recursos exclusivos do computador ficam indisponíveis. O Basic não transplanta a interface de outro plugin para o seu próprio DOM.

| Plugin | Conexão |
| --- | --- |
| **Ultimate Toolkit** | Ferramentas e configurações nativas; provedor opcional de voz; posição de player/botões móveis; prioridade de ícones no explorador. |
| **Visual Kit** | Anotação de imagens, ações de imagens/área de transferência, notas HTML e configurações nativas. Apenas no computador. |
| **Snailkit** | Workbench nativo; aba de escrita do Basic pela API pública de tarefas; prévias e conclusão explícita de tarefas; configurações por seção. |
| **dropit** | Comandos nativos de receber/enviar e configurações. Regras de processamento no computador continuam sendo ações explícitas separadas. |
| **Syncthing Integration** | Janelas originais de conflitos, diferenças da nota e configuração. Não oferece um motor próprio de sincronização manual. |
| **Syncthing Manager** | Painel nativo, estado atual, versões de notas e ações explícitas de conexão/varredura. |
| **Obsidian Git** | Painéis registrados de controle de versão/histórico e comandos Git explícitos, sujeitos à disponibilidade do backend. |
| **FIT** | Sincronização e explicação do estado remoto por ação explícita. Sem painel nativo próprio. |
| **LanguageTool** | Corretor externo, sugestões no editor, navegação e algumas preferências nativas, junto do corretor integrado independente do Basic. |

Preferências simples selecionadas do Toolkit/Visual Kit são salvas pelo gravador do próprio plugin. Os avisos de recarregamento continuam visíveis. Contas, tokens, repositórios, pareamento e regras de processamento ficam nas configurações originais. Atualizações podem mudar métodos privados; o Basic verifica as capacidades ao usar e mantém indisponíveis as ações que não existem.

## Escolha o provedor de leitura

**Basic** continua sendo o padrão. Instalar o Toolkit não muda suas vozes. Escolha **Ultimate Toolkit** em **Provedor de leitura** para encaminhar o texto selecionado/atual do Basic ao player dele. É necessário instalar o Toolkit e ativar sua leitura. As vozes e os idiomas vêm das configurações originais. Pausar/continuar/parar pelo Basic atua na reprodução iniciada por essa conexão.

**Permitir voz online do Toolkit** é uma permissão separada, inicialmente desligada. A versão auditada do Toolkit chama seu motor online de Edge, mas faz solicitações de voz ao Google Translate, com idiomas limitados pela implementação dele. O Basic não descreve esse motor como offline nem reaproveita as opções Edge do Basic. Vozes do dispositivo também dependem do sistema e podem precisar de rede. Um provedor escolhido indisponível não é trocado silenciosamente por outro.

## Gramática e LanguageTool

O cliente LanguageTool integrado do Basic funciona sem o plugin externo. Escolha o **corretor externo** quando quiser que o LanguageTool instalado verifique a nota no editor nativo e apresente seus sublinhados e avisos. Abra a nota em um editor primeiro. A conexão restaura o editor correto ao iniciar a análise pelo Basic.

Verificação automática externa, idioma e modo rigoroso podem ser configurados pela conexão; conta, endereço, dicionários e configuração completa ficam no LanguageTool. As propriedades `lt-language`, `lt-autoCheck` e `lt-picky` da nota podem substituir as escolhas gerais. A verificação automática dele pode funcionar com o painel do Basic fechado. Para interrompê-la, desligue a opção no próprio plugin; desativar só a conexão do Basic não a altera.

Uma análise manual pode enviar a nota atual ou a seleção ao servidor configurado no plugin externo. O endereço e as credenciais do Basic continuam independentes. Trocar a nota, a configuração ou o corretor invalida resultados antigos da revisão do Basic. Uma solicitação já enviada ainda pode terminar no serviço.

## Botões móveis e explorador

**Organizar botões no mobile** ajusta os controles suportados do Toolkit e do Snailkit ao redor da área visível, das barras nativas e de outros controles detectados. A organização acompanha mudanças de janela/teclado e mantém controles dentro do seu painel. Os manipuladores e as configurações originais são preservados. Desligue a opção para restaurar o estilo original. O posicionamento só consegue mover um controle quando existe espaço suficiente.

Use as opções nativas de **Note rail** do Snailkit para escolher esquerda/direita e os botões ativos. O Visual Kit fica indisponível no celular. A disponibilidade do Obsidian Git depende da versão instalada, do repositório e do backend móvel inicializado; a conexão não adiciona o Git do computador ao Android.

Quando Basic e Toolkit adicionam um ícone no explorador, escolha **Ultimate Toolkit**, **Basic personalizado** ou **Ambos**. Isso controla a decoração duplicada sem apagar preferências de pastas/arquivos. Mudar a prioridade dos ícones não recolore notas nem regrava o mapa de pastas do Toolkit.

## Sincronização

Escolha um **Provedor manual de sincronização** para liberar as ações dele que têm efeitos. A seleção não transfere arquivos. Cada sincronização, consulta remota, recebimento, envio ou processamento exige um clique. Abrir um painel nativo pode usar a atualização própria do plugin externo.

**Commit e sincronização** do Git pode criar um commit e transferir alterações; **Push** é outra ação. A explicação de estado do FIT pode consultar o remoto. O Syncthing e as rotinas dos outros plugins continuam seguindo suas próprias configurações. O Basic informa o envio do comando e o estado nativo disponível; despachar o comando não comprova uma transferência concluída.

Consulte a [auditoria dos fontes](../maintenance/COMPANION_SOURCE_AUDIT.md) para revisões, licenças, limites das APIs e requisitos de plataforma. A versão mínima do Obsidian exigida pelo Basic não substitui requisitos mais novos de um plugin externo.
