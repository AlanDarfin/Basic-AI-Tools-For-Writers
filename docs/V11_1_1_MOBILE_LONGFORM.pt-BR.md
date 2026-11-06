# Basic 11.1.1 — Longform integrado e painéis móveis

## Implementações

- **Escrita contínua como aba do Longform padrão:** acessível em Longform → Escrita → Escrita contínua, sem widget separado na Homepage. O editor usa os índices e o projeto selecionado no Longform.
- **Cenas no próprio Longform:** cada capítulo expande um editor de texto do arquivo original. Edição explícita, snapshots quando ativados e bloqueio de sobrescrita se o arquivo mudou externamente. Não é um buffer CodeMirror único.
- **Biblioteca:** o botão de escrita contínua agora leva à aba do projeto existente, em vez de abrir um estúdio duplicado.
- **Menu Mais opções:** ações nativas que abrem menus secundários são acionadas somente depois que o menu do Basic termina de fechar; durante esse intervalo, evita reconstruir a barra inferior.
- **Pressionar painel móvel:** segurar um ícone na barra de abas por aproximadamente 550ms abre um menu com Fixar/Desafixar, Fechar painel e Fechar outros não fixados.
- **Fixação:** mantém o tipo de painel entre os primeiros ícones; o fechamento em lote respeita os fixados. A fixação é salva em `v1010Layout.sidebar.pinnedViews`, independentemente para esquerda/direita. Não substitui o pin nativo que impede fechar a gaveta.
- **Segurança de gestos:** deslizar o dedo cancela o comando longo; pressionamento não ativa o painel por um clique sintético posterior. Menu de contexto via mouse/teclado também disponível. Não remove nem edita notas do cofre.

## Observações e limites

- O Longform Studio permanece como nome interno para preservar `v11Studio`, comandos e configurações de quem já usa essa versão; a interface principal não mostra widget duplicado.
- Configurações antigas do widget `studio` em `data.json` são mantidas de forma inerte para evitar migração destrutiva. A Homepage deixa de listar e renderizar esse widget.
- O menu de contexto gerencia as abas laterais do Obsidian por `leaf.detach()`. Ele não afeta notas abertas na área principal.
- A fixação de painel é uma preferência do Basic para priorização na barra e exclusão de fechamento em lote, não a mesma coisa que fixar toda a gaveta.
- O comportamento do submenu nativo depende da versão do Obsidian e requer confirmação visual no Android. Os testes de código verificam atraso, preservação dos controles e gestão de painéis.
- Não foi introduzida transferência automática de arquivos, novos serviços ou chamadas de rede.

## Verificação

- Fontes JavaScript e CSS modulares recompilados no CI.
- Verificações de regressão do Longform, remoção do widget, menus secundários, fixação e fechamento protegido de painéis.
- Revisar manualmente troca de abas, toque longo no Android, ícones de plugins de terceiros, submenu de ordenação, menu Mais opções, Spaces e o histórico de sessões de escrita antes de considerar os bugs definitivamente resolvidos no dispositivo.
