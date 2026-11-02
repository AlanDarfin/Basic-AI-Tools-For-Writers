# Basic AI Tool for Writers 9.0.3

**Personalização da homepage e manutenção de painéis · Obsidian 1.11.4+ · PC e Android**

## Widgets personalizáveis

A homepage mantém título/ícone, pesquisa com teclado e atalhos rápidos acima de uma área de widgets. Clique em **Adicionar widgets** para exibir a galeria de painéis. Cada widget ativo tem botões de ordenação e remoção. Remover apenas oculta o widget; nenhum arquivo ou rascunho é apagado. O layout é salvo nas configurações do Basic.

Os widgets anteriores (**Continuar escrevendo**, **Relógio e calendário**, **Notas recentes**, **Favoritos**, **Rascunhos rápidos** e **Resumo do cofre**) continuam habilitados nas instalações existentes. Os novos são opcionais e começam desativados:

- **Atividade da semana:** notas Markdown modificadas em cada um dos últimos sete dias.
- **Nota surpresa:** seleciona uma nota local aleatória com opções de abrir ou sortear novamente.
- **Tags frequentes:** lista até dez tags das notas indexadas no Obsidian.
- **Meta de palavras:** progresso de palavras na última nota Markdown aberta, com meta configurável (padrão: 500). É uma medida de tamanho do texto, não um relatório do que foi escrito hoje.

O calendário agora também pode ser ocultado e reorganizado como os demais widgets. A busca superior e os atalhos permanecem sempre disponíveis.

## Alinhamento visual

Os ícones Lucide e rótulos de abas do Longform, ferramentas e configurações recebem alinhamento vertical, espaçamento e dimensões consistentes. Os controles dos widgets também usam ícones padronizados, inclusive em telas menores.

## Restauração após atualizações

O plugin já salvava temporariamente o estado de três painéis laterais. Agora a restauração inclui também a **homepage, o calendário, estudos e Spaces**, além das abas do Basic abertas na área de edição. O snapshot é usado uma única vez, por até dois minutos, para evitar reabrir painéis fechados intencionalmente. Não substitui abas de notas nem painéis de outros plugins. Aposição exata dos grupos de abas e o comportamento em diferentes sistemas ainda exigem verificação visual.

## Instalação

Faça backup do cofre e de `.obsidian/plugins/basic-ai-tool-for-writers/data.json`. Substitua os arquivos `main.js`, `manifest.json` e `styles.css` pelos da versão 9.0.3 e recarregue o Basic. Nenhuma migração manual de notas é necessária.
