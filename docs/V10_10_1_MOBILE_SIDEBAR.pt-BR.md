# Basic 10.10.1 — sidebar móvel e Spaces integrados

## Problema observado

As capturas compararam a implementação anterior do Basic com o Sidebar Manager original no Android. Havia uma barra adicional, o seletor nativo permanecia à mostra e a troca de ícones podia apontar para uma aba diferente da exibida. O Space dock era renderizado dentro do conteúdo do explorador, junto de um rodapé nativo separado.

## Alterações

- **Uma só linha superior:** o Basic agora usa o contêiner de abas já existente no `MobileDrawer`. Esconde apenas a seleção nativa duplicada quando a linha própria está ativa. Se o drawer do Obsidian deixar de expor as propriedades necessárias, o Basic não tenta substituí-lo.
- **Seleção real de abas:** utiliza `selectTabIndex(index)` e sincroniza `setActiveLeaf`, em vez de depender somente de `revealLeaf`. O destaque acompanha `drawer.children[drawer.currentTab]`.
- **Menu unificado:** `...` reúne as ações da visualização ativa, painéis excedentes, configurações, Spaces e troca do cofre quando o controle estiver disponível; sem dois botões de overflow.
- **Spaces no rodapé:** o dock de Spaces já existente é reaproveitado no final do drawer móvel, fora da lista de arquivos. Os botões de todo o cofre, Space selecionado, opções, criar e gerenciar continuam utilizando o mesmo estado e as mesmas funções anteriores.
- **Sem duplicações:** quando integrado, o dock deixa de ser exibido dentro do explorador. A implementação evita conflito direto quando o Sidebar Manager original também está ativo.
- **Restauração segura:** desligar o gerenciador do Basic remove suas classes e seu cabeçalho, restaura o seletor nativo e devolve o dock ao explorador sem apagar informações do Space.
- **Rodapé nativo:** só é compactado opcionalmente se houver um método funcional para abrir o seletor de cofre. Caso contrário, permanece acessível.

### Configurações

Em **Personalização → Painéis laterais**, habilite o gerenciador e **Abas em ícones no celular**. As opções **Integrar Spaces ao rodapé móvel** e **Compactar rodapé nativo no celular** podem ser ativadas ou desativadas separadamente.

O Spaces precisa estar habilitado para exibir coleções no dock. As preferências, posições e layouts continuam salvos em seus campos existentes; nenhuma nota é movida.

## Compatibilidade

A integração usa propriedades internas do drawer para corrigir a seleção no Android, conferindo sua existência antes de utilizá-las. Como essas propriedades podem mudar com futuras versões do Obsidian, o comportamento visual precisa ser confirmado na instalação real, especialmente com temas, tablets e teclados virtuais.

Os testes automatizados verificam a seleção de abas, destaque ativo, posicionamento da linha, ocultação da lista nativa, restauração no unload e pontos de integração do dock, além da suíte histórica. Eles não substituem uma sessão gráfica real no Android.
