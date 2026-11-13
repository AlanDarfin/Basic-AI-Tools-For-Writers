# Suporte a plugins

[English](companion-compatibility.md)

As ferramentas de escrita do Basic funcionam sem plugins externos. O suporte a um plugin instalado permite que seus controles, painéis e comandos disponíveis convivam com o Basic. Isso não instala o plugin, não substitui seu motor nem copia suas credenciais. A [tabela de suporte do README](../README.pt-BR.md#plugins-com-suporte) descreve cada um dos nove plugins suportados.

Não há uma página dedicada de **Integrações** nas configurações. A configuração completa de cada plugin externo permanece nas configurações dele. Comandos antigos de painéis e preferências de compatibilidade salvas continuam disponíveis para instalações existentes. Um atalho salvo para a página removida abre **Edição avançada**, onde as menções e ações de IA nativas do Basic continuam configuráveis.

## Ferramentas nativas: sem plugin adicional

### Tarefas com prazos e captura rápida

Abra o painel de tarefas do Basic para filtrar **Todas**, **Hoje**, **Atrasadas**, **Próximos sete dias** ou **Sem prazo**. As datas seguem o dia do calendário local. Tarefas concluídas têm um controle separado de visibilidade. O texto pode conter um prazo como `📅 2026-11-20` ou `[due:: 2026-11-20]`, além das etiquetas de prioridade `#high`, `#medium` ou `#low`.

Escolha **Nova tarefa** para acrescentar uma tarefa a uma **nota Markdown existente**. Selecione o destino, informe a descrição e, se quiser, data, prioridade e etiquetas; depois gere a prévia. Confira o destino e a linha Markdown exata antes de adicionar. Editar um campo invalida a prévia anterior. Nota alterada, movida ou removida, edições não salvas ou bloco de código/propriedades inacabado podem impedir a gravação; atualize a prévia ou salve a nota antes de tentar novamente. A captura não cria uma caixa de entrada silenciosamente nem substitui edições concorrentes.

Painel, captura e filtros de data usam o interruptor de tarefas já existente no Basic. Não exigem Snailkit nem seu banco de tarefas.

### Ler a partir do cursor

Abra uma nota Markdown em modo de edição, posicione o cursor e execute **Ler a partir do cursor**, ou use o botão correspondente em **Leitura em voz alta**. O Basic lê a partir dessa posição usando o texto atual do editor, incluindo edições não salvas. Respeita o limite de caracteres, o interruptor do recurso e o provedor escolhido; regiões Markdown já excluídas da leitura permanecem excluídas. O comando não salva a nota.

O **Basic** permanece como provedor padrão. Instalar o Toolkit não troca as vozes. Se você escolher explicitamente **Ultimate Toolkit** em **Provedor de leitura**, ele precisa estar instalado e com a leitura ativada. Vozes e idiomas são escolhidos nas configurações dele. Os controles de pausar/continuar/parar do Basic atuam na reprodução que ele iniciou pelo Toolkit.

**Permitir voz online do Toolkit** é uma permissão separada, inicialmente desligada. O Toolkit 2.9.17 auditado chama seu motor online de Edge, mas envia trechos ao Google Translate; os idiomas disponíveis dependem da implementação dele. Isso é independente do motor Edge do Basic e de sua permissão para a Microsoft. Vozes do dispositivo também dependem do sistema e podem usar rede. Um provedor escolhido indisponível não é trocado silenciosamente por outro.

### Focar uma pasta no explorador

Use **Focar nesta pasta** no menu de contexto nativo de uma pasta do explorador. O Basic mostra o caminho e a ação **Mostrar todas** no próprio explorador, sem adicionar outro painel flutuante. O comando existente para focar a pasta da nota atual continua disponível. **Mostrar todas** restaura a árvore completa; desligar o foco de pastas remove sua apresentação temporária.

O foco é visual. Não criptografa arquivos, não bloqueia acesso, não move notas nem reescreve os ícones originais do explorador. O interruptor de foco de pastas permanece em **Ações rápidas**.

## Onde ficam as opções

| Opção | Configurações do Basic |
| --- | --- |
| Busca de tarefas e interruptor do painel | **Tarefas e captura** |
| Provedor de voz, vozes, permissão online e leitura pelo cursor | **Leitura em voz alta** |
| Interruptor do foco de pastas | **Ações rápidas** |
| Prioridade de ícones duplicados | **Explorador de arquivos** |
| Organizar controles flutuantes no mobile | **Arquivos e ferramentas** |
| Menções de notas e ações de IA nativas | **Edição avançada** |
| Corretor LanguageTool externo | **Gramática** |

## Controles móveis e explorador

**Organizar controles flutuantes no mobile** coordena os controles suportados do Toolkit e do Snailkit com o painel visível, barras, menus e diálogos abertos. Popups vinculados mantêm suas âncoras nativas. Quando não há uma posição segura, controles secundários podem ficar temporariamente ocultos, em vez de serem colocados sobre uma obstrução; retornam ao fechar a obstrução ou surgir espaço. Essa organização não altera coordenadas salvas, notas nem interruptores dos plugins externos.

O suporte visual passivo funciona independentemente do interruptor geral de ações rápidas do Basic. Preferências anteriores que desligavam a organização ou o suporte de um plugin são preservadas. Desligar a organização restaura os estilos gerenciados pelo Basic. Escolha o lado da barra e os botões ativos em **Note rail**, nas configurações nativas do Snailkit.

Em **Explorador de arquivos**, escolha **Ultimate Toolkit**, **Ícone personalizado do Basic** ou **Mostrar ambos** quando os dois decoram a mesma linha. A escolha altera a visibilidade da decoração duplicada e conserva os elementos e preferências dos dois plugins.

O Visual Kit continua exclusivo do computador. O Obsidian Git no celular exige um backend próprio disponível e inicializado. O Basic não adiciona o Git do computador ao Android. A emulação de viewport/CSS não substitui testes de navegação nativa, teclado do dispositivo e painéis flutuantes em aparelhos Android/iOS físicos.

## Gramática, painéis e sincronização

O cliente LanguageTool integrado do Basic funciona sem o plugin externo. Escolha o corretor externo em **Gramática** para usar os sublinhados, avisos e ações nativas do plugin instalado. O Basic restaura o editor correspondente e verifica os recursos disponíveis. O plugin externo mantém conta, endereço, dicionários e propriedades da nota (`lt-language`, `lt-autoCheck`, `lt-picky`). Sua verificação automática pode continuar com o painel do Basic fechado; desligue essa opção no próprio plugin quando quiser interrompê-la.

Os comandos antigos de painéis reutilizam as visualizações nativas registradas. Comandos que abrem diálogos continuam usando os diálogos originais. Módulos desligados, comandos ausentes e recursos incompatíveis com a plataforma ficam indisponíveis. A configuração completa pertence ao plugin original, incluindo repositórios, pareamento, regras de processamento e agendas automáticas.

O Basic não inicia transferências nem sincroniza arquivos ao reconhecer um plugin. Ações antigas de sincronização manual continuam exigindo seleção explícita do provedor e um clique. **Criar commit e sincronizar** do Git pode criar commits e transferir alterações; o comando de estado do FIT pode acessar o servidor quando a versão instalada o oferece. Abrir um painel nativo pode acionar a atualização do próprio plugin. Encaminhar um comando não comprova uma transferência concluída.

Consulte a [auditoria dos fontes](../maintenance/COMPANION_SOURCE_AUDIT.md) para versões, licenças, limites de APIs e os arquivos originais fornecidos para a revisão móvel. Uma exigência de Obsidian mais recente do plugin externo continua valendo.
